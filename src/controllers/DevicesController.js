import moment from "moment-timezone";
import Devices from "../models/Devices";
import axios from "axios";
import Generation from "../models/Generation";
import { PDFDocument } from "pdf-lib";
import { Op, literal, Sequelize } from "sequelize";
import Users from "../models/Users";
import nodemailer from "nodemailer";
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
        if (
          !result 
        ) {
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
}
export default new DevicesController();
