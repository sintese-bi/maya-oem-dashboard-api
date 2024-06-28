import moment from "moment-timezone";
import Devices from "../models/Devices";
import axios from "axios";
import Generation from "../models/Generation";
import { PDFDocument } from "pdf-lib";
import { Op, literal, Sequelize } from "sequelize";
import Users from "../models/Users";
import nodemailer from "nodemailer";
import Reports from "../models/Reports";
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  pool: true,

  secure: true,
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "xbox ejjd wokp ystv",
  },
  tls: {
    rejectUnauthorized: true, //Usar "false" para ambiente de desenvolvimento
  },
});
class DevicesController {
  //Esta função index processa dados de dispositivos, recuperando informações de gerações associadas a eles.
  //Ela inclui a ordenação por data e trata casos onde a geração atual não está disponível, utilizando dados da geração anterior.
  async index(req, res) {
    const blUuid = req.params.bl_uuid;
    const pl_name = req.params;
    const date = new Date();
    const currentDate = moment(date).format("YYYY-MM-DD");
    const previousDate = moment(date).subtract(1, "days").format("YYYY-MM-DD");

    try {
      const data = await Devices.findAll({
        include: { association: "generation", order: ["gen_date"] },
        where: { bl_uuid: blUuid },

        order: ["dev_name"],
      }).then(async (result) => {
        result.forEach((r) => {
          const generation = r.dataValues.generation.find(
            (gen) => gen.gen_date === currentDate
          );
          const previousGeneration = r.dataValues.generation.find(
            (gen) => gen.gen_date === previousDate
          );

          const gen_estimated = r.dataValues.generation[0]?.gen_estimated;

          r.dataValues.generation = generation;

          if (!generation) {
            r.dataValues.generation = {
              gen_estimated: gen_estimated ? gen_estimated : 0,
              gen_real: previousGeneration ? previousGeneration.gen_real : 0,
            };
          }
        });

        return result;
      });

      return res.json(data);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta função calcula a soma da geração real e estimada em um intervalo de datas especificado.
  //Para cada dia dentro do intervalo, ela busca e soma as gerações correspondentes de todas as usinas. Os resultados são retornados em formato JSON, incluindo as somas por dia tanto para a geração real quanto para a estimada. Em caso de erro, uma mensagem de erro é retornada com o status 400.
  async bigNumberSum(req, res) {
    try {
      const { use_uuid } = req.body;
      //Ajuste data
      const currentDate = new Date();
      const currentYear = currentDate.getUTCFullYear();
      const currentMonth = currentDate.getUTCMonth();

      const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
      const lastDayOfMonth = new Date(
        Date.UTC(currentYear, currentMonth + 1, 0)
      );

      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            where: {
              // sta_uuid: "b5f9a5f7-2f67-4ff2-8645-47f55d265e4e",
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } },
              ],
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        where: {
          gen_date: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
        },
        attributes: ["gen_date", "gen_real", "gen_estimated"],
      });

      const somaGenRealDia = {};
      const somaGenEstimadaDia = {};

      result.forEach((item) => {
        const dateKey = item.gen_date.split("T")[0];
        // Verifique se a geração real é maior que 0 antes de adicionar à soma
        if (item.gen_real > 0) {
          somaGenRealDia[dateKey] =
            (somaGenRealDia[dateKey] || 0) + item.gen_real;
          somaGenEstimadaDia[dateKey] =
            (somaGenEstimadaDia[dateKey] || 0) + item.gen_estimated;
        }
      });

      for (
        let date = new Date(firstDayOfMonth);
        date <= lastDayOfMonth;
        date.setDate(date.getDate() + 1)
      ) {
        const dateKey = date.toISOString().split("T")[0];
        somaGenRealDia[dateKey] = parseFloat(
          (somaGenRealDia[dateKey] || 0).toFixed(2)
        );
        somaGenEstimadaDia[dateKey] = parseFloat(
          (somaGenEstimadaDia[dateKey] || 0).toFixed(2)
        );
      }

      return res.status(200).json({
        realGeneration: somaGenRealDia,
        estimatedGeneration: somaGenEstimadaDia,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta API calcula a soma diária de gerações real e estimada para um intervalo de datas específico, considerando apenas dispositivos associados a um usuário.
  //Retorna as somas calculadas como resposta. Em caso de sucesso, a mensagem indica o cálculo bem-sucedido; em caso de erro, uma mensagem de falha é retornada.
  async sumGeneration(req, res) {
    try {
      const { startDate, endDate, use_uuid } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      console.log(start, end);
      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            where: {
              // sta_uuid: "b5f9a5f7-2f67-4ff2-8645-47f55d265e4e",
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } },
              ],
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        where: {
          gen_date: {
            [Op.between]: [start, end],
          },
        },
        attributes: [
          "gen_date",
          "gen_real",
          [literal("COALESCE(gen_estimated, 0)"), "gen_estimated"],
          "gen_updated_at",
        ],
        order: [["gen_updated_at", "DESC"]],
      });

      const aggregatedResult = result.reduce((acc, item) => {
        const deviceUUID = item.devices.dev_uuid;
        const genDate = new Date(item.gen_date).toISOString().split("T")[0];

        if (
          !acc[deviceUUID] ||
          !acc[deviceUUID][genDate] ||
          item.gen_updated_at > acc[deviceUUID][genDate].gen_updated_at
        ) {
          acc[deviceUUID] = {
            ...acc[deviceUUID],
            [genDate]: {
              gen_real: item.gen_real,
              gen_estimated: item.gen_estimated,
              gen_updated_at: item.gen_updated_at,
            },
          };
        }

        return acc;
      }, {});

      const totalByDate = {};
      Object.keys(aggregatedResult).forEach((deviceUUID) => {
        Object.keys(aggregatedResult[deviceUUID]).forEach((genDate) => {
          if (!totalByDate[genDate]) {
            totalByDate[genDate] = {
              gen_real: 0,
              gen_estimated: 0,
            };
          }

          totalByDate[genDate].gen_real +=
            aggregatedResult[deviceUUID][genDate].gen_real;
          totalByDate[genDate].gen_estimated +=
            aggregatedResult[deviceUUID][genDate].gen_estimated || 100;
        });
      });

      Object.keys(totalByDate).forEach((genDate) => {
        totalByDate[genDate].gen_real = parseFloat(
          totalByDate[genDate].gen_real.toFixed(2)
        );
        totalByDate[genDate].gen_estimated = parseFloat(
          totalByDate[genDate].gen_estimated.toFixed(2)
        );
      });

      return res.status(200).json({
        message: "Somas calculadas com sucesso!",
        // somaPorDiaReal: somaGenRealDia,
        // somaPorDiaEstimada: somaGenEstimadaDia,
        totalByDate,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  //Essa API soma os valores de gen_real e gen_estimated para todas as horas do dia corrente
  async sumGenerationLastHour(req, res) {
    try {
      const { use_uuid } = req.body;

      const currentDate = new Date();
      const startOfDay = new Date(currentDate.toISOString());
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(currentDate.toISOString());
      endOfDay.setUTCHours(23, 59, 59, 999);

      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            where: {
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } },
              ],
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        where: {
          gen_created_at: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        attributes: ["gen_date", "gen_real", "gen_estimated", "gen_created_at"],
        order: [["gen_created_at", "DESC"]],
      });

      const sumsPerHour = {};

      result.forEach((item) => {
        const hour = new Date(item.gen_created_at).getUTCHours();

        // Somar os valores de todos os dispositivos para cada hora
        sumsPerHour[hour] = {
          gen_real: (sumsPerHour[hour]?.gen_real || 0) + item.gen_real,
          gen_estimated:
            (sumsPerHour[hour]?.gen_estimated || 0) + item.gen_estimated,
        };
      });

      // Preencher horas ausentes com 0
      for (let hour = 0; hour < 24; hour++) {
        sumsPerHour[hour] = sumsPerHour[hour] || {
          gen_real: 0,
          gen_estimated: 0,
        };
      }

      return res.status(200).json({
        message: "Somas calculadas com sucesso!",
        sumsPerHour: sumsPerHour,
      });
    } catch (error) {
      return res.status(400).json({
        message: `Erro ao retornar os dados. ${error.message || error}`,
      });
    }
  }
  async deviceRecover(req, res) {
    try {
      const { dev_uuid } = req.body;
      await Devices.update(
        {
          dev_deleted: false,
        },
        {
          where: { dev_uuid: dev_uuid },
        }
      );
      return res
        .status(200)
        .json({ message: "O dispositivo foi recuperado com sucesso!" });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async liquidationReport(req, res) {
    try {
      const { dev_uuid } = req.body;
      const email = process.env.EMAIL_FATURA;
      const password = process.env.PASSWORD;
      const result = await axios.post("https://", {
        email: email,
        password: password,
      });

      const secondResult = await axios.post(
        "https:",
        {
          dev_uuid: dev_uuid,
        },
        {
          headers: {
            Authorization: `Bearer ${result.data.access_token}`,
          },
        }
      );
      //Informações recebidas do banco externo
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //API que retorna geração para um device e período específico
  async managerNames(req, res) {
    try {
      //Data atual
      const current = moment().format("YYYY-MM-DD");
      let periodo_com_dia;
      let current_day;
      //Dia corrente
      const current_day_string = moment().format("DD");
      //MêS corrente
      const current_month_string = moment().format("MM");
      const clientToken = req.headers.authorization;
      const expectedToken = process.env.TOKEN;
      const { dev_uuid, periodo } = req.body;
      //Ultimo dia do mes
      const lastDayOfMonth = moment(periodo, "YYYY-MM")
        .endOf("month")
        .format("DD");
      //Mês que o usuário escolheu
      const periodo_month_current = periodo.split("-")[1];
      //Data corrente
      const primeiro_dia_mes = `${periodo}-01`;
      if (periodo_month_current == current_month_string) {
        periodo_com_dia = `${periodo}-${current_day_string}`;
        current_day = parseInt(current_day_string);
      } else {
        periodo_com_dia = `${periodo}-${lastDayOfMonth}`;
        current_day = parseInt(lastDayOfMonth);
      }

      if (clientToken == `Bearer ${expectedToken}`) {
        const result = await Devices.findOne({
          attributes: ["dev_name"],

          where: { dev_uuid: dev_uuid },
        });
        if (!result) {
          return res.status(404).send();
        }
        // const result = await Devices.findOne({
        //   attributes: ["dev_name", "dev_name_manager", "dev_install"],

        //   where: { dev_uuid: dev_uuid },
        // });
        // if (
        //   !result ||
        //   result.dev_name_manager === null ||
        //   result.dev_install === null
        // ) {
        //   return res.status(404).send();
        // }
        //Valores de geração estimada do mês escolhido
        const gen = await Generation.findOne({
          include: [
            {
              association: "devices",
              where: {
                dev_uuid: dev_uuid,
              },
            },
          ],
          where: {
            gen_date: periodo_com_dia,
          },
          attributes: ["gen_estimated"],
        });
        const monthGeneration = await Generation.findAll({
          attributes: [
            [Sequelize.literal("DATE(gen_date)"), "day"],
            [Sequelize.fn("MAX", Sequelize.col("gen_date")), "latest_gen_date"],
            [Sequelize.fn("MAX", Sequelize.col("gen_real")), "latest_gen_real"],
            [
              Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
              "latest_gen_estimated",
            ],
          ],
          include: [
            {
              association: "devices",
              attributes: [],
              where: {
                dev_uuid: dev_uuid,
              },
            },
          ],
          where: {
            gen_date: {
              [Op.between]: [primeiro_dia_mes, periodo_com_dia],
            },
          },
          group: [Sequelize.literal("day")],
        });

        const yearOnly = periodo.split("-")[0];

        const yearGeneration = await Generation.findAll({
          attributes: [
            [Sequelize.literal("DATE(gen_date)"), "day"],
            [Sequelize.fn("MAX", Sequelize.col("gen_date")), "latest_gen_date"],
            [Sequelize.fn("MAX", Sequelize.col("gen_real")), "latest_gen_real"],
            [
              Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
              "latest_gen_estimated",
            ],
          ],
          include: [
            {
              association: "devices",
              attributes: [],
              where: {
                dev_uuid: dev_uuid,
              },
            },
          ],
          where: {
            gen_date: {
              [Op.between]: [`${yearOnly}-01-01`, `${yearOnly}-12-31`],
            },
          },
          group: [Sequelize.literal("day")],
        });

        const monthlySums = {};
        yearGeneration.forEach((result) => {
          const month = result.dataValues.day.split("-")[1];

          if (!monthlySums[month]) {
            monthlySums[month] = {
              gen_real: 0,
              gen_estimated: 0,
            };
          }

          monthlySums[month].gen_real += result.dataValues.latest_gen_real;
          monthlySums[month].gen_estimated +=
            result.dataValues.latest_gen_estimated;
        });
        // const dayGeneration = await Generation.findAll({
        //   attributes: [
        //     [Sequelize.literal("DATE_TRUNC('hour', gen_created_at)"), "hour"],
        //     [Sequelize.fn("MAX", Sequelize.col("gen_date")), "latest_gen_date"],
        //     [Sequelize.fn("MAX", Sequelize.col("gen_real")), "latest_gen_real"],
        //     [
        //       Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
        //       "latest_gen_estimated",
        //     ],
        //   ],
        //   include: [
        //     {
        //       association: "devices",
        //       attributes: [],
        //       where: {
        //         dev_uuid: dev_uuid,
        //       },
        //     },
        //   ],
        //   where: {
        //     gen_created_at: {
        //       [Op.between]: [moment().startOf("day"), moment().endOf("day")],
        //     },
        //   },
        //   group: [Sequelize.literal("DATE_TRUNC('hour', gen_created_at)")],
        // });
        const responseData = {
          result: result,
          gen_estimated: gen.gen_estimated,
          gen_estimated_total: gen.gen_estimated * current_day,
          geração_mes: monthGeneration,
          // geração_dia: dayGeneration,
          geração_ano: monthlySums,
        };
        return res.status(200).json(responseData);
      } else {
        return res
          .status(401)
          .json({ message: "Falha na autenticação: Token inválido." });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async emailBalance(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo PDF enviado" });
      }
      const pdfBuffer = req.file.buffer;

      const { dev_uuid } = req.body;
      const result = await Devices.findByPk(dev_uuid, {
        attributes: ["dev_email"],
      });
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pdfAttachment = {
        filename: "relatorio_fatura.pdf",
        content: Buffer.from(await pdfDoc.save()),
        encoding: "base64",
      };
      const emailBody = `
      <p>Olá!</p>      
      <p>Segue o PDF com os dados de sua fatura e geração!</p>
      <p>Agradecemos pela confiança em nossos serviços.</p>
      <p>Atenciosamente,<br>Equipe MAYA WATCH</p>`;

      const mailOptions = {
        from: "noreplymayawatch@gmail.com",
        to: [result.dev_email],
        subject: "Relatório de Fatura e Geração Maya Watch",
        text: "",
        html: emailBody,
        attachments: [pdfAttachment],
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({
          success: true,
          message: `O email foi enviado com sucesso! `,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: `Erro ao enviar o email!`,
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //API que retorna os dados de geração de todos os devices do ano e mês corrente
  async managerNamesAll(req, res) {
    try {
      //Data atual
      const current = moment().format("YYYY-MM-DD");
      const currentMonthYear = moment().format("YYYY-MM");
      const currentYear = moment().format("YYYY");
      //Dia corrente
      const current_day_string = moment().format("DD");
      let current_day_int = parseInt(current_day_string);
      //MêS corrente
      const current_month_string = moment().format("MM");
      const clientToken = req.headers.authorization;
      const expectedToken = process.env.TOKEN;
      //Ultimo dia do mes
      const lastDayOfMonth = moment().endOf("month").format("YYYY-MM-DD");
      const lastday = parseInt(lastDayOfMonth);
      //Data corrente
      const primeiro_dia_mes = `${currentMonthYear}-01`;

      if (clientToken == `Bearer ${expectedToken}`) {
        const result = await Devices.findAll({
          attributes: [
            "dev_name",
            "dev_uuid",
            "dev_wpp_number",
            "dev_capacity",
          ],
          //ADICIONAR CONDICAO DEV_DELETED=NULL
          where: {
            dev_deleted: { [Op.or]: [null, false] },
            dev_wpp_number: {
              [Op.ne]: null,
            },
          },
        });
        if (!result) {
          return res.status(404).send();
        }

        const generationAll = await Promise.all(
          result.map(async (element) => {
            //Valores de geração estimada do mês escolhido
            const gen = await Generation.findOne({
              include: [
                {
                  association: "devices",
                  where: {
                    dev_uuid: element.dev_uuid,
                  },
                },
              ],
              where: {
                gen_date: {
                  [Op.between]: [
                    `${currentMonthYear}-01`,
                    `${currentMonthYear}-${current_day_string}`,
                  ],
                },
              },
              attributes: ["gen_estimated"],
            });
            let generation_est;
            if (gen) {
              generation_est = gen.gen_estimated;
            } else {
              generation_est = 100;
            }

            const monthGeneration = await Generation.findAll({
              attributes: [
                [Sequelize.literal("DATE(gen_date)"), "day"],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_date")),
                  "latest_gen_date",
                ],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_real")),
                  "latest_gen_real",
                ],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
                  "latest_gen_estimated",
                ],
              ],
              include: [
                {
                  association: "devices",
                  attributes: [],
                  where: {
                    dev_uuid: element.dev_uuid,
                  },
                },
              ],
              where: {
                gen_date: {
                  [Op.between]: [primeiro_dia_mes, lastDayOfMonth],
                },
              },
              group: [Sequelize.literal("day")],
            });

            const yearGeneration = await Generation.findAll({
              attributes: [
                [Sequelize.literal("DATE(gen_date)"), "day"],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_date")),
                  "latest_gen_date",
                ],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_real")),
                  "latest_gen_real",
                ],
                [
                  Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
                  "latest_gen_estimated",
                ],
              ],
              include: [
                {
                  association: "devices",
                  attributes: [],
                  where: {
                    dev_uuid: element.dev_uuid,
                  },
                },
              ],
              where: {
                gen_date: {
                  [Op.between]: [
                    `${currentYear}-01-01`,
                    `${currentYear}-12-31`,
                  ],
                },
              },
              group: [Sequelize.literal("day")],
            });

            const monthlySums = {};
            yearGeneration.forEach((result) => {
              const month = result.dataValues.day.split("-")[1];

              if (!monthlySums[month]) {
                monthlySums[month] = {
                  gen_real: 0,
                  gen_estimated: 0,
                };
              }

              monthlySums[month].gen_real += Math.round(
                result.dataValues.latest_gen_real
              );
              monthlySums[month].gen_estimated += Math.round(
                result.dataValues.latest_gen_estimated
              );
            });
            //Cálculo Co2 e árvores salvas
            let tree_co2;
            if (monthlySums[current_month_string]) {
              tree_co2 = monthlySums[current_month_string].gen_real;
            } else {
              tree_co2 = 0;
            }
            const mapping = monthGeneration.map((element) => {
              return element.dataValues.latest_gen_real;
            });

            const realgenSum = mapping.reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            return {
              device_name: element.dev_name, //Nome do device
              period: currentMonthYear, //Período
              capacity: element.dev_capacity, //Potência Usina
              wpp_number: element.dev_wpp_number, //Número WhatsApp
              treesSaved: Math.round(tree_co2 * 0.000504 * 100) / 100, //Árvores salvas
              c02: Math.round(tree_co2 * 0.419 * 100) / 100, //Co2
              gen_estimated_total:
                Math.round(generation_est * lastday * 100) / 100, //Soma gen_estimada do mês
              gen_real_total: Math.round(realgenSum * 100) / 100, //Soma gen_real do mês
              generation_month: monthGeneration, //Gráfico geração mês
              generation_year: monthlySums, //Gráfico geração anual
            };
          })
        );
        const delay = 5000;

        setTimeout(function () {
          return res.status(200).json({ message: generationAll });
        }, delay);
      } else {
        return res
          .status(401)
          .json({ message: "Falha na autenticação: Token inválido." });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async emailBalance(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo PDF enviado" });
      }
      const pdfBuffer = req.file.buffer;

      const { dev_uuid } = req.body;
      const result = await Devices.findByPk(dev_uuid, {
        attributes: ["dev_email"],
      });
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pdfAttachment = {
        filename: "relatorio_fatura.pdf",
        content: Buffer.from(await pdfDoc.save()),
        encoding: "base64",
      };
      const emailBody = `
      <p>Olá!</p>      
      <p>Segue o PDF com os dados de sua fatura e geração!</p>
      <p>Agradecemos pela confiança em nossos serviços.</p>
      <p>Atenciosamente,<br>Equipe MAYA WATCH</p>`;

      const mailOptions = {
        from: "noreplymayawatch@gmail.com",
        to: [result.dev_email],
        subject: "Relatório de Fatura e Geração Maya Watch",
        text: "",
        html: emailBody,
        attachments: [pdfAttachment],
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({
          success: true,
          message: `O email foi enviado com sucesso! `,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: `Erro ao enviar o email!`,
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async administratorReportWhatsApp(req, res) {
    try {
      try {
        //Data atual
        const current = moment().format("YYYY-MM-DD");
        const currentMonthYear = moment().format("YYYY-MM");
        const currentYear = moment().format("YYYY");
        //Dia corrente
        const current_day_string = moment().format("DD");
        let current_day_int = parseInt(current_day_string);
        //MêS corrente
        const current_month_string = moment().format("MM");
        const clientToken = req.headers.authorization;
        const expectedToken = process.env.TOKEN;
        //Ultimo dia do mes
        const lastDayOfMonth = moment().endOf("month").format("YYYY-MM-DD");
        const lastday = parseInt(lastDayOfMonth);
        //Data corrente
        const primeiro_dia_mes = `${currentMonthYear}-01`;
        const { use_uuid } = req.body;
        if (clientToken == `Bearer ${expectedToken}`) {
          //Fluxo que soma as gerações de cada dia do mês corrente
          const monthGeneration = await Generation.findAll({
            attributes: [
              [Sequelize.literal("DATE(gen_date)"), "day"],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_date")),
                "latest_gen_date",
              ],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_real")),
                "latest_gen_real",
              ],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
                "latest_gen_estimated",
              ],
              [Sequelize.col("devices.dev_name"), "dev_name"],
              [Sequelize.col("devices.bl_uuid"), "bl_uuid"],
              [Sequelize.col("devices.dev_uuid"), "dev_uuid"],
              [Sequelize.col("devices.dev_deleted"), "dev_deleted"],
              [Sequelize.col("devices->brand_login.bl_name"), "bl_name"],
            ],
            include: [
              {
                association: "devices",
                attributes: [],

                where: {
                  dev_deleted: { [Op.or]: [false, null] },
                },
                include: [
                  {
                    association: "brand_login",
                    where: {
                      use_uuid: use_uuid,
                    },
                    attributes: [],
                  },
                ],
              },
            ],
            where: {
              gen_date: {
                [Op.between]: [primeiro_dia_mes, lastDayOfMonth],
              },
            },
            group: [
              Sequelize.literal("day"),
              Sequelize.col("devices.dev_name"),
              Sequelize.col("devices.bl_uuid"),
              Sequelize.col("devices.dev_uuid"),
              Sequelize.col("devices.dev_deleted"),
              Sequelize.col("devices->brand_login.bl_name"),
            ],
          });

          // Contar dispositivos únicos
          // const uniqueDevices = new Set();
          // monthGeneration.forEach(gen => {
          //   uniqueDevices.add(gen.dev_uuid);
          // });

          // const totalUniqueDevices = uniqueDevices.size;
          // return res.status(200).json({ message: [monthGeneration,totalUniqueDevices] });

          let sumMonth = {};
          monthGeneration.forEach((element) => {
            if (!sumMonth[element.dataValues.day]) {
              sumMonth[element.dataValues.day] = {
                latest_gen_real: 0,
                latest_gen_estimated: 0,
                day: element.dataValues.day,
              };
            } else {
              sumMonth[element.dataValues.day].latest_gen_real +=
                element.dataValues.latest_gen_real;
              sumMonth[element.dataValues.day].latest_gen_estimated +=
                element.dataValues.latest_gen_estimated;
            }
          });
          const roundToTwoDecimalPlaces = (num) => {
            return Math.round(num * 100) / 100;
          };

          Object.keys(sumMonth).forEach((day) => {
            sumMonth[day].latest_gen_real = roundToTwoDecimalPlaces(
              sumMonth[day].latest_gen_real
            );
            sumMonth[day].latest_gen_estimated = roundToTwoDecimalPlaces(
              sumMonth[day].latest_gen_estimated
            );
          });

          const keys = Object.keys(sumMonth);
          //Array com cada geração do mês corrente
          const sumMonthtotal = keys.map((key) => {
            return sumMonth[key];
          });
          // return res.status(200).json({message:monthGeneration})
          //Fluxo que soma as gerações de cada mês do ano corrente
          const yearGeneration = await Generation.findAll({
            attributes: [
              [Sequelize.literal("DATE(gen_date)"), "day"],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_date")),
                "latest_gen_date",
              ],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_real")),
                "latest_gen_real",
              ],
              [
                Sequelize.fn("MAX", Sequelize.col("gen_estimated")),
                "latest_gen_estimated",
              ],
              [Sequelize.col("devices.dev_name"), "dev_name"],
            ],
            include: [
              {
                association: "devices",
                attributes: [],
                where: {
                  dev_deleted: { [Op.or]: [null, false] },
                },
                include: [
                  {
                    association: "brand_login",
                    attributes: [],
                    where: {
                      use_uuid: use_uuid,
                    },
                  },
                ],
              },
            ],
            where: {
              gen_date: {
                [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`],
              },
            },
            group: [
              Sequelize.literal("day"),
              Sequelize.col("devices.dev_name"),
            ],
          });

          let sumYear = {};

          for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, "0");
            sumYear[month] = {
              gen_real: 0,
              gen_estimated: 0,
              month: month,
            };
          }

          yearGeneration.forEach((element) => {
            const month = element.dataValues.day.split("-")[1];

            if (sumYear[month]) {
              if (element.dataValues.latest_gen_real) {
                sumYear[month].gen_real += element.dataValues.latest_gen_real;
              }
              if (element.dataValues.latest_gen_estimated) {
                sumYear[month].gen_estimated +=
                  element.dataValues.latest_gen_estimated;
              }
            }
          });

          const keysYear = Object.keys(sumYear);
          //Array com cada geração do ano corrente
          const sumYearTotal = keysYear.map((sum) => {
            return sumYear[sum];
          });
          sumYearTotal.forEach((element) => {
            element.gen_real = Math.round(element.gen_real * 100) / 100;
            element.gen_estimated =
              Math.round(element.gen_estimated * 100) / 100;
          });

          const monthValue = sumMonthtotal.reduce(
            (accumulator, currentValue) => {
              accumulator.latest_gen_real += currentValue.latest_gen_real || 0;
              accumulator.latest_gen_estimated +=
                currentValue.latest_gen_estimated || 0;
              return accumulator;
            },
            { latest_gen_real: 0, latest_gen_estimated: 0 }
          );
          const yearValue = sumYearTotal.reduce(
            (accumulator, currentValue) => {
              accumulator.gen_real += currentValue.gen_real || 0;
              accumulator.gen_estimated += currentValue.gen_estimated || 0;
              return accumulator;
            },
            { gen_real: 0, gen_estimated: 0 }
          );
          const devices = await Devices.findAll({
            where: {
              dev_deleted: { [Op.or]: [false, null] },
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
                attributes: [],
              },
            ],
          });
          const desempenho = (
            (Math.round(monthValue.latest_gen_real * 100) /
              100 /
              (Math.round(monthValue.latest_gen_estimated * 100) / 100)) *
            100
          ).toLocaleString();

          const quant_dev = devices.length;
          const user = await Users.findOne({
            attributes: ["use_email", "use_name"],
            where: { use_uuid: use_uuid },
          });

          const startOfMonth = moment.utc().startOf("month").toDate();
          const endOfMonth = moment
            .utc()
            .endOf("month")
            .subtract(3, "hours")
            .toDate();
          console.log(startOfMonth, endOfMonth);
          const use = use_uuid;
          const brand = await Users.findByPk(use, {
            include: [
              {
                association: "brand_login",
                attributes: ["bl_name", "bl_uuid"],
              },
            ],
          });

          const result = await Users.findByPk(use, {
            attributes: ["use_name"],
            include: [
              {
                association: "brand_login",
                attributes: ["bl_name", "bl_uuid"],
                include: [
                  {
                    association: "devices",
                    where: {
                      [Op.or]: [
                        { dev_deleted: false },
                        { dev_deleted: { [Op.is]: null } },
                      ],
                    },
                    attributes: [
                      "dev_uuid",
                      "dev_name",
                      "dev_brand",
                      "dev_deleted",
                      "dev_capacity",
                      "dev_address",
                      "dev_lat",
                      "dev_long",
                      "dev_email",
                      "dev_image",
                      "dev_install",
                      "dev_manual_gen_est",
                    ],
                    include: [
                      {
                        association: "generation",
                        attributes: [
                          "gen_real",
                          "gen_estimated",
                          "gen_date",
                          "gen_updated_at",
                        ],
                        order: [
                          ["gen_updated_at", "DESC"],
                          ["gen_real", "DESC"],
                        ],
                        where: {
                          gen_date: {
                            [Op.between]: [startOfMonth, endOfMonth],
                          },
                        },
                        separate: true,
                        required: false,
                      },
                      {
                        association: "alerts",
                        attributes: ["al_alerts", "al_inv", "alert_created_at"],
                        separate: true,
                        where: {
                          alert_created_at: {
                            [Op.gte]: moment
                              .utc()
                              .subtract(4, "hours")
                              .toDate(),
                          },
                        },
                      },
                      {
                        association: "status",
                        attributes: ["sta_code", "sta_name"],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          const devicesData = [];

          if (result) {
            const brandLogin = result.brand_login;

            for (const brand of brandLogin) {
              const devices = brand.devices;

              for (const device of devices) {
                const generations = device.generation;
                const alerts = device.alerts || [];
                const dailySums = {};
                const weeklySumsReal = {};
                const weeklySumsEstimated = {};
                const monthlySumsReal = {};
                const monthlySumsEstimated = {};

                if (generations) {
                  for (const gen of generations) {
                    const genDate = moment
                      .utc(gen.gen_date)
                      .format("YYYY-MM-DD");

                    if (
                      !dailySums[genDate] ||
                      dailySums[genDate].gen_real <= gen.gen_real
                    ) {
                      dailySums[genDate] = {
                        gen_real: gen.gen_real,
                        gen_estimated: gen.gen_estimated || 100,
                        gen_date: gen.gen_date,
                        gen_updated_at: gen.gen_updated_at,
                      };
                    }
                  }

                  Object.values(dailySums).forEach((gen) => {
                    const genDate = moment
                      .utc(gen.gen_updated_at)
                      .format("YYYY-MM-DD");
                    const weekStartDate = moment
                      .utc()
                      .startOf("isoWeek")
                      .format("YYYY-MM-DD");
                    const weekEndDate = moment
                      .utc()
                      .endOf("isoWeek")
                      .format("YYYY-MM-DD");

                    if (
                      moment
                        .utc(gen.gen_updated_at)
                        .isSameOrAfter(weekStartDate) &&
                      moment.utc(gen.gen_updated_at).isBefore(weekEndDate)
                    ) {
                      if (!weeklySumsReal[weekStartDate]) {
                        weeklySumsReal[weekStartDate] = 0;
                      }
                      if (!weeklySumsEstimated[weekStartDate]) {
                        weeklySumsEstimated[weekStartDate] = 0;
                      }

                      weeklySumsReal[weekStartDate] += gen.gen_real;
                      weeklySumsEstimated[weekStartDate] += gen.gen_estimated;
                    }

                    const monthStartDate = moment
                      .utc(gen.gen_updated_at)
                      .startOf("month")
                      .format("YYYY-MM-DD");

                    if (!monthlySumsReal[monthStartDate]) {
                      monthlySumsReal[monthStartDate] = 0;
                    }
                    if (!monthlySumsEstimated[monthStartDate]) {
                      monthlySumsEstimated[monthStartDate] = 0;
                    }

                    monthlySumsReal[monthStartDate] += gen.gen_real;
                    monthlySumsEstimated[monthStartDate] += gen.gen_estimated;
                  });
                }

                const deviceData = {
                  monthlySum: {
                    gen_real: Object.values(monthlySumsReal).reduce(
                      (acc, value) => acc + value,
                      0
                    ),

                    gen_estimated: Object.values(monthlySumsEstimated).reduce(
                      (acc, value) => acc + value,
                      0
                    ),
                  },
                };

                devicesData.push(deviceData);
              }
            }
          }
          const soma = devicesData.reduce(
            (accumulator, current_value) => {
              return {
                gen_real:
                  current_value.monthlySum.gen_real + accumulator.gen_real,
                gen_estimated:
                  current_value.monthlySum.gen_estimated +
                  accumulator.gen_estimated,
              };
            },
            { gen_real: 0, gen_estimated: 0 }
          );
          sumYearTotal.sort((a, b) => {
            return parseInt(a.month) - parseInt(b.month);
          });
          const retorno = {
            user: user.use_name, //Usuário

            period: currentMonthYear, //Período

            current_date: current, //Data corrente

            devices_quant: quant_dev, //Quantidade de usinas do usuário

            performance: desempenho, //Perfomance

            sum_generation_real_month: (
              Math.round(soma.gen_real * 100) / 100
            ).toLocaleString(), // Soma da geração real do mês corrente

            sum_generation_estimated_month: (
              Math.round(soma.gen_estimated * 100) / 100
            ).toLocaleString(), // Soma da geração estimada do mês corrente

            sum_generation_real_year: (
              Math.round(yearValue.gen_real * 100) / 100
            ).toLocaleString(), // Soma da geração real do ano corrente

            sum_generation_estimated_year: (
              Math.round(yearValue.gen_estimated * 100) / 100
            ).toLocaleString(), // Soma da geração estimada do ano corrente

            treesSaved: (
              Math.round(soma.gen_real * 0.000504 * 100) / 100
            ).toLocaleString(), //Árvores salvas ano

            c02: (
              Math.round(soma.gen_real * 0.419 * 100) / 100
            ).toLocaleString(), //Co2 ano

            generation_month: sumMonthtotal, //Gráfico geração mês

            generation_year: sumYearTotal, //Gráfico geração anual
          };

          const delay = 3000;

          setTimeout(function () {
            return res.status(200).json({ message: retorno });
          }, delay);
        } else {
          return res
            .status(401)
            .json({ message: "Falha na autenticação: Token inválido." });
        }
      } catch (error) {
        return res
          .status(500)
          .json({ message: `Erro ao retornar os dados. ${error}` });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async teste1(req, res) {
    try {
      const { use_uuid } = req.body;
      await Users.update(
        {
          use_massive_reports_status: "executing",
        },
        {
          where: {
            use_uuid: use_uuid,
          },
        }
      );

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            attributes: [
              "dev_capacity",
              "dev_name",
              "dev_email",
              "dev_deleted",
            ],
            where: {
              dev_email: {
                [Op.not]: null,
              },
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } },
              ],
            },
            include: [
              {
                association: "brand_login",
                attributes: [],
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        attributes: ["gen_real", "gen_estimated", "gen_date", "dev_uuid"],
        where: {
          gen_date: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
          gen_updated_at: {
            [Op.in]: Generation.sequelize.literal(`
                        (SELECT MAX(gen_updated_at) 
                        FROM generation 
                        WHERE gen_date BETWEEN :firstDayOfMonth AND :lastDayOfMonth 
                        GROUP BY gen_date, dev_uuid)
                      `),
          },
        },
        replacements: { firstDayOfMonth, lastDayOfMonth },
      });
      const groupedResult = result.reduce((acc, generation) => {
        const { dev_uuid, gen_real, gen_estimated, gen_date, devices } =
          generation;
        const { dev_capacity, dev_name, dev_email } = devices;

        if (!acc[dev_uuid]) {
          acc[dev_uuid] = [];
        }

        acc[dev_uuid].push({
          gen_real,
          gen_estimated,
          gen_date,
          dev_capacity,
          dev_name,
          dev_email,
        });

        return acc;
      }, {});

      // Formatar o resultado final
      const formattedResult = Object.entries(groupedResult).map(
        ([dev_uuid, resultArray]) => {
          return { dev_uuid, result: resultArray };
        }
      );

      // return res.status(200).json({message:formattedResult})

      const sum_generation = await Promise.all(
        formattedResult.map(async (gens) => {
          // Real generation
          const realGeneration = gens.result.map((element) => {
            return { value: element.gen_real, date: element.gen_date };
          });

          // Estimated generation
          const estimatedGeneration = gens.result.map(
            (element) => element.gen_estimated
          );

          // Sum real generation
          const sumreal = gens.result.reduce(
            (acc, atual) => acc + atual.gen_real,
            0
          );
          const sumrealNew = sumreal.toFixed(2);

          // Sum estimated generation
          const sumestimated = gens.result.reduce(
            (acc, atual) => acc + atual.gen_estimated,
            0
          );
          const sumestimatedNew = sumestimated.toFixed(2);

          // Calculate percentage
          let percentNew;
          if (sumreal === 0) {
            percentNew = 0;
          } else {
            percentNew = ((sumestimated / sumreal) * 100).toFixed(2);
          }

          // Determine situation
          const situation =
            percentNew > 80
              ? `Parabéns, sua usina produziu o equivalente a ${percentNew}% do total esperado.`
              : `Infelizmente, sua usina produziu apenas ${percentNew}% em relação ao esperado.`;
          
          // Create device element
          const dev_element = {
            dev_uuid: gens.dev_uuid,
            capacity: gens.result[0].dev_capacity,
            name: gens.result[0].dev_name,
            email: gens.result[0].dev_email,
            sumrealNew,
            sumestimatedNew,
            percentNew,
            situation,
            realGeneration,
            estimatedGeneration,
          };

          return JSON.stringify(dev_element);
        })
      );
      return res.status(200).json({ message: sum_generation });
      // Process the results
      sum_generation.forEach((result) => this.push(result));
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}
export default new DevicesController();
