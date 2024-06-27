import { Sequelize, Op, fn, col, literal } from "sequelize";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import moment from "moment-timezone";
import nodemailer from "nodemailer";
import Brand from "../models/Brand";
import XLSX from "xlsx";
import Users from "../models/Users";
import cron from "node-cron";
import Temperature from "../models/Temperature";
import IrradiationCoefficient from "../models/IrradiationCoefficient";
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,

  secure: true, //alterar
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "xbox ejjd wokp ystv",
  },
  tls: {
    rejectUnauthorized: true, //Usar "false" para ambiente de desenvolvimento
  },
});
class GenerationController {
  //Esta função recupera dados de dispositivos e a temperatura mais recente, dentro de um intervalo de datas especificado.
  //Em seguida, ela calcula alertas com base na geração de energia diária em relação à estimada e retorna os resultados em formato JSON.
  async deviceDataAndLatestTemperature(req, res) {
    const { startDate, endDate, type, devUuid } = req.query;
    const dataNow = moment().format("YYYY-MM-DD");

    const firstDay = moment(startDate).format("YYYY-MM-DD");
    const lastDay = moment(endDate).format("YYYY-MM-DD");

    console.log(firstDay, lastDay, dataNow);

    try {
      let deviceData;
      deviceData = await Generation.findAll({
        attributes: [
          "gen_uuid",
          "gen_estimated",
          "gen_real",
          "gen_date",
          "dev_uuid",
          "gen_created_at",
          "gen_updated_at",
        ],
        where: {
          dev_uuid: devUuid,
          gen_date: {
            [Op.between]: [firstDay, lastDay],
          },
          gen_updated_at: {
            [Op.in]: Generation.sequelize.literal(`
              (SELECT MAX(gen_updated_at) 
              FROM generation 
              WHERE dev_uuid = :devUuid 
              AND gen_date BETWEEN :firstDay AND :lastDay 
              GROUP BY gen_date)
            `),
          },
        },
        replacements: { devUuid, firstDay, lastDay },
      });
      deviceData.forEach((element) => {
        console.log(element.gen_estimated);
        if (!element.gen_estimated) {
          element.gen_estimated = 100;
        }
      });

      const latestTemp = await Devices.findAll({
        where: {
          dev_uuid: devUuid,
        },
        attributes: ["dev_name"],
        include: [
          {
            model: Temperature,
            as: "temperature",
            attributes: ["temp_temperature"],
            order: [["temp_created_at", "DESC"]],
            limit: 1,
          },
        ],
      });

      deviceData.forEach((dev) => {
        dev.alert = {
          msg: "Geração diária dentro da faixa estimada",
          type: "success",
        };

        const generation =
          dev.generation &&
          dev.generation.find((gen) => gen.gen_date === dataNow);

        if (generation) {
          const alert = (generation.gen_real / generation.gen_estimated) * 100;

          if (alert < 20) {
            dev.alert = {
              msg: `Geração diária ${alert.toFixed(2)}% da estimada`,
              type: "warning",
            };
          }
        }
      });

      return res.status(200).json({ deviceData, latestTemp });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  //Esta recupera alertas recentes de um dispositivo específico dentro da última hora.
  //Ela retorna os dados em formato JSON, incluindo o nome do dispositivo e os detalhes dos alertas (como o tipo de alerta e o inversor associado, se houver). Se houver um erro durante o processo, a função retorna uma mensagem de erro no formato JSON.
  async recentAlerts(req, res) {
    const { devUuid } = req.params;

    try {
      const recentAlerts = await Devices.findAll({
        where: {
          dev_uuid: devUuid,
        },
        attributes: ["dev_name"],
        include: [
          {
            association: "alerts",
            attributes: ["al_alerts", "al_inv", "alert_created_at"],
            where: {
              alert_created_at: {
                [Op.between]: [
                  moment().subtract(1, "hour").toDate(),
                  moment().toDate(),
                ],
              },
            },
          },
        ],
      });
      console.log(recentAlerts);
      return res.json(recentAlerts);
    } catch (error) {
      console.error(error);
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  // SALVANDO DADOS DE GERAÇÃO ESTIMADA E PORCENTAGEM
  async projectionPatch(req, res) {
    try {
      const { percentMaxMin, value, date, devUuid } = req.body;
      const year = moment(value[0].gen_date).get("year");

      await Generation.findAll({
        where: {
          [Op.and]: Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year),
          [Op.or]: value.map((month) =>
            Sequelize.fn(
              'EXTRACT(MONTH from "gen_date") =',
              moment(month.gen_date).get("month") + 1
            )
          ),
          dev_uuid: devUuid,
        },
      }).then(async (result) => {
        result.forEach(async (item) => {
          const gen_uuid = item.dataValues.gen_uuid;
          const gen_date = item.dataValues.gen_date;
          const month = Number(
            moment(item.dataValues.gen_date).get("month") + 1
          );

          const projection = value.filter(
            (A) => Number(moment(A.gen_date).get("month") + 1) === month
          )[0];
          const gen_estimated =
            projection.gen_projection / moment(gen_date).daysInMonth();

          await Generation.update(
            {
              gen_projection: projection.gen_projection,
              gen_percentage: percentMaxMin,
              gen_estimated: gen_estimated,
            },
            {
              where: { gen_uuid: gen_uuid },
            }
          );
        });

        return result;
      });
      return res.json({ message: "Projeção definida com sucesso!" });
    } catch (error) {
      res.status(400).json({ message: `Erro ao definir projeção!` });
    }
  }
  //Esta função recebe uma requisição com informações sobre projeção da geração de energia.
  // Ela processa os dados, atualiza as projeções de geração no banco de dados e retorna uma mensagem de sucesso. Se ocorrer um erro durante o processo, ela retorna uma mensagem de erro no formato JSON.
  async projection(req, res) {
    const { date, devUuid } = req.query;

    const year = moment(date).get("year");

    try {
      const data = await Generation.findAll({
        attributes: ["gen_projection", "gen_date", "gen_percentage"],

        order: ["gen_date"],
        where: {
          [Op.and]: Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year),
          dev_uuid: devUuid,
        },
      }).then(async (result) => {
        const distinctYear = result.filter(function (item) {
          return (
            !this[
              JSON.stringify(moment(item.dataValues.gen_date).get("month") + 1)
            ] &&
            (this[
              JSON.stringify(moment(item.dataValues.gen_date).get("month") + 1)
            ] = true)
          );
        }, Object.create(null));

        return distinctYear;
      });

      return res.json(data);
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //É enviado um e-mail contendo dados de geração de energia para um endereço específico associado a um dispositivo.
  //Ela compõe o corpo do e-mail com os valores fornecidos e utiliza um serviço de transporte de e-mail para enviar a mensagem.
  //Em caso de erro, a função retorna uma mensagem no formato JSON.
  async reportgenerationEmail(req, res) {
    try {
      const {
        gen_est_day,
        gen_real_day,
        gen_est_week,
        gen_real_week,
        gen_est_month,
        gen_real_month,
      } = req.body;
      const { dev_uuid } = req.query;
      const searchDevice_email = await Devices.findOne({
        where: { dev_uuid: dev_uuid },
        attributes: ["dev_email"],
      });

      const emailBody = `
        <p>Olá,</p>       
        <p>Aqui estão os dados de geração da usina:</p>

        <ul>
          <li><strong>Dados de Estimativa Diária:</strong> ${gen_est_day}</li>
          <li><strong>Dados de Geração Real Diária:</strong> ${gen_real_day}</li>
          <li><strong>Dados de Geração Estimativa Semanal:</strong> ${gen_est_week}</li>
          <li><strong>Dados de Geração Real Semanal:</strong> ${gen_real_week}</li>
          <li><strong>Dados de Geração Estimativa Mensal:</strong> ${gen_est_month}</li>
          <li><strong>Dados de Geração Real Mensal:</strong> ${gen_real_month}</li>
        </ul>
        <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
        
        `;

      const mailOptions = {
        from: '"noreplymayawatch@gmail.com',
        to: searchDevice_email.dev_email,
        subject: "Dados de Geração da Usina ",
        text: "",
        html: emailBody,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Erro ao enviar o e-mail:", error);
        } else {
          console.log("E-mail enviado:", info.res);
        }
      });
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Essa API é uma função assíncrona que gera e envia relatórios em formato PDF por e-mail.
  //Ela aceita um PDF em formato base64, o UUID do dispositivo (dev_uuid) e o endereço de e-mail associado ao dispositivo. O relatório é anexado ao e-mail e enviado.
  //Em caso de erro, a API retorna uma mensagem de erro.
  async reportgenerationEmailPDF(req, res) {
    try {
      const { base64, dev_uuid } = req.body;
      const attachment = {
        filename: "relatorio.pdf", // Nome do arquivo anexado no e-mail
        content: base64, // Conteúdo base64 do PDF
        encoding: "base64", // Tipo de codificação
      };
      const searchDevice_email = await Devices.findOne({
        where: { dev_uuid: dev_uuid },
        attributes: ["dev_email"],
      });
      if (!searchDevice_email.dev_email) {
        return res.status(400).json({ message: "Email não encontrado!" });
      }
      const emailBody = `
      Prezado usuário,

      Anexamos um relatório em formato PDF com os dados de geração da usina. Este relatório inclui informações referentes à geração diária, semanal e mensal, apresentadas de forma clara e concisa.

      Além disso, no documento, você encontrará um gráfico temporal que ilustra a variação na produção de energia ao longo do período analisado.
      
      <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
      `;

      const mailOptions = {
        from: '"noreplymayawatch@gmail.com',
        to: [searchDevice_email.dev_email, "contato@mayaenergy.com.br"],
        subject: "Relatório de dados de Geração",
        text: "",
        html: emailBody,
        attachments: [attachment],
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res
            .status(400)
            .json({ message: `Erro ao enviar o email! ${error}` });
        } else {
          return res
            .status(200)
            .json({ message: `Email enviado com sucesso!` });
        }
      });
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta API permite a atualização assíncrona de um endereço de e-mail associado a um dispositivo.
  //Primeiro, verifica se o e-mail fornecido é válido. Em seguida, atualiza o e-mail do dispositivo identificado pelo dev_uuid.
  async updateEmail(req, res) {
    try {
      const { dev_uuid, email } = req.body;
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "O email não é válido." });
      }
      await Devices.update(
        { dev_email: email },
        { where: { dev_uuid: dev_uuid } }
      );
      return res.status(200).json({ message: `Email atualizado com sucesso!` });
    } catch (error) {
      res.status(400).json({ message: `Erro ao atualizar email. ${error}` });
    }
  }
  //Esta API generalreportEmail retorna dados de relatórios agregados de dispositivos, incluindo estimativas e valores reais de geração de energia para o mês atual e dados do dia atual.
  //Se ocorrer um erro, a API retorna uma mensagem de erro com status 400.
  //Os dados de geração dessa api que retornam são do primeiro dia do mês até o dia atual
  async generalreportEmail(req, res) {
    try {
      const { use_uuid } = req.body;
      const currentDate = new Date();

      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        2
      );
      console.log(currentDate, firstDayOfMonth);
      const result = await Devices.findAll({
        attributes: [
          "dev_email",
          "dev_name",
          "dev_brand",
          "dev_capacity",
          "dev_uuid",
          "dev_deleted",
        ],
        include: [
          {
            association: "brand_login",
            where: {
              use_uuid: use_uuid,
            },
          },
          {
            association: "generation",
            attributes: ["gen_estimated", "gen_real", "gen_date"],
            where: {
              gen_date: {
                [Op.between]: [firstDayOfMonth, currentDate],
              },
            },
          },
        ],
      });

      const reportData = result.map((device) => {
        let sumGenEstimated = 0;
        let sumGenReal = 0;

        device.generation.forEach((generation) => {
          sumGenEstimated += generation.gen_estimated;
          sumGenReal += generation.gen_real;
        });

        const currentDateData = {};

        device.generation.forEach((generation) => {
          const genDate = new Date(generation.gen_date);
          const formattedGenDate = `${genDate.getFullYear()}-${
            genDate.getMonth() + 1
          }-${genDate.getDate()}`;

          currentDateData[formattedGenDate] = {
            gen_estimated: generation.gen_estimated,
            gen_real: generation.gen_real,
          };
        });

        return {
          dev_uuid: device.dev_uuid,
          dev_email: device.dev_email,
          dev_name: device.dev_name,
          dev_brand: device.dev_brand,
          dev_capacity: device.dev_capacity,
          currentDayData: currentDateData,
          sumData: {
            gen_estimated: sumGenEstimated,
            gen_real: sumGenReal.toFixed(2),
          },
        };
      });

      return res.status(200).json({
        reportData,
      });
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async testQuery(req, res) {
    try {
      const currentDate = new Date();
      const { use_uuid } = req.body;
      const startOfMonth = moment
        .utc()
        .startOf("month")
        .subtract(3, "hours")
        .toDate();
      const endOfMonth = moment
        .utc()
        .endOf("month")
        .subtract(3, "hours")
        .toDate();
      currentDate.setHours(currentDate.getHours() - 3);
      const currentDateWithDelay = currentDate.toISOString().split("T");
      const currentDateSplit = currentDateWithDelay[0];
      console.log({ DATA: currentDateSplit });
      const result = await Users.findByPk(use_uuid, {
        attributes: ["use_name"],

        include: [
          {
            association: "brand_login",
            attributes: ["bl_uuid", "bl_name"],
            separate: true,
            include: [
              {
                association: "devices",
                attributes: ["dev_uuid", "dev_name", "dev_deleted"],
                separate: true,
                where: {
                  [Op.or]: [
                    { dev_deleted: false },
                    { dev_deleted: { [Op.is]: null } },
                  ],
                },
                include: [
                  {
                    association: "generation",
                    attributes: [
                      "gen_real",
                      "gen_updated_at",
                      "gen_estimated",
                      "gen_date",
                      "gen_uuid",
                    ],
                    //
                    where: {
                      gen_date: { [Op.between]: [startOfMonth, endOfMonth] },
                    },

                    order: [["gen_updated_at", "DESC"]],

                    separate: true,
                  },
                ],
              },
            ],
          },
        ],
      });

      return res.status(200).json({ message: result });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async emailAlertSendWhatsApp(req, res) {
    try {
      const clientToken = req.headers.authorization;
      const expectedToken = process.env.TOKEN;
      if (clientToken == `Bearer ${expectedToken}`) {
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() - 3);
        const currentDateWithDelay = currentDate.toISOString();
        console.log(currentDateWithDelay);
        const dataAtual = moment(currentDateWithDelay);
        const inicioUltimaSemana = dataAtual
          .clone()
          .subtract(1, "weeks")
          .startOf("week");
        const fimUltimaSemana = inicioUltimaSemana.clone().endOf("week");
        const inicioFormatado = inicioUltimaSemana.toISOString();
        const fimFormatado = fimUltimaSemana.toISOString();
        const inicioMesCorrente = dataAtual.clone().startOf("month");
        const fimMesCorrente = dataAtual.clone().endOf("month");
        const inicioFormatadomes = inicioMesCorrente.toISOString();
        const fimFormatadomes = fimMesCorrente.toISOString();
        const startOfDay = new Date(currentDateWithDelay);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDateWithDelay);
        endOfDay.setHours(23, 59, 59, 999);
        const consultUser = await Users.findAll({
          attributes: [
            "use_percentage",
            "use_alert_email",
            "use_date",
            "use_name",
            "use_wpp_number",
            "use_uuid",
          ],
        });

        const reports = await Promise.all(
          consultUser.map(async (element) => {
            if (
              !element.use_date ||
              !element.use_percentage ||
              !element.use_wpp_number
            ) {
              return;
            }
            if (
              !(
                element.use_date === 2 &&
                moment().isoWeekday() === 1 &&
                moment().date() <= 7
              ) &&
              !(element.use_date === 3 && moment().date() === 1) &&
              !(element.use_date === 1)
            ) {
              return;
            }
            let dateInterval;
            //Intervalo diário, semanal e mensal
            if (element.use_date == 1) {
              dateInterval = currentDateWithDelay;
            } else if (element.use_date == 2) {
              dateInterval = {
                [Op.between]: [inicioFormatado, fimFormatado],
              };
            } else if (element.use_date == 3) {
              dateInterval = {
                [Op.between]: [inicioFormatadomes, fimFormatadomes],
              };
            }

            const result = await Generation.findAll({
              include: [
                {
                  association: "devices",
                  attributes: ["dev_uuid", "dev_name"],
                  where: {
                    [Op.or]: [
                      { dev_deleted: false },
                      { dev_deleted: { [Op.is]: null } },
                    ],
                  },
                  include: [
                    {
                      association: "brand_login",
                      attributes: ["bl_name"],
                      where: {
                        use_uuid: element.use_uuid,
                      },
                    },
                  ],
                },
              ],
              where: {
                gen_date: dateInterval,
              },
              attributes: [
                "gen_date",
                "gen_real",
                "gen_estimated",
                "gen_updated_at",
              ],
              order: [["gen_updated_at", "DESC"]],
            });

            const filteredResult = {};
            result.forEach((generation) => {
              const { devices, gen_updated_at, gen_real, gen_estimated } =
                generation;
              const deviceUUID = devices.dev_uuid;
              const deviceName = devices.dev_name;
              const brandLogin = devices.brand_login;
              const brandName = brandLogin ? brandLogin.bl_name : null;
              const generationDate = gen_updated_at.toISOString().split("T")[0];

              if (!filteredResult[generationDate]) {
                filteredResult[generationDate] = {};
              }

              if (
                !filteredResult[generationDate][deviceUUID] ||
                gen_updated_at >
                  filteredResult[generationDate][deviceUUID].gen_updated_at
              ) {
                filteredResult[generationDate][deviceUUID] = {
                  gen_real,
                  gen_estimated,
                  dev_name: deviceName,
                  bl_name: brandName,
                };
              }
            });
            const deviceSums = {};
            Object.keys(filteredResult).forEach((date) => {
              const devices = filteredResult[date];
              Object.keys(devices).forEach((deviceUUID) => {
                const generation = devices[deviceUUID];
                const { gen_real, gen_estimated, dev_name, bl_name } =
                  generation;
                if (!deviceSums[deviceUUID]) {
                  deviceSums[deviceUUID] = {
                    gen_real: 0,
                    gen_estimated: 0,
                    dev_name,
                    bl_name,
                  };
                }
                deviceSums[deviceUUID].gen_real += gen_real;
                deviceSums[deviceUUID].gen_estimated += gen_estimated;
              });
            });

            //Fluxo de verificação igual ou abaixo de x%
            const percentage = element.use_percentage / 100;
            const deviceUUIDs = Object.keys(deviceSums);

            const sumPercentage = deviceUUIDs
              .map((uuid) => {
                const device = deviceSums[uuid];

                if (device.gen_real <= percentage * device.gen_estimated) {
                  return {
                    Portal: device.bl_name,
                    Cliente: device.dev_name,
                    "Produção(KWh)": device.gen_real.toFixed(2),
                    "Esperado(KWh)": device.gen_estimated.toFixed(2),
                    "Desempenho(%)": (
                      (device.gen_real.toFixed(2) /
                        device.gen_estimated.toFixed(2)) *
                      100
                    ).toFixed(2),
                  };
                }
                return null;
              })
              .filter((device) => device !== null);

            const num = sumPercentage.length;
            let buffer;

            let object;
            if (num == 0) {
              object = {
                telefone: element.use_wpp_number,
                relatorio: 0,
                user_name: element.use_name,
              };
            } else {
              const workbook = XLSX.utils.book_new();
              const worksheet = XLSX.utils.json_to_sheet(sumPercentage);
              XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
              buffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "buffer",
              });
              object = {
                telefone: element.use_wpp_number,
                relatorio: buffer,
                user_name: element.use_name,
              };
            }

            return object;
          })
        );

        const validReports = reports.filter((report) => report !== undefined);

        return res.status(200).json({
          relatorios: validReports,
        });
      } else {
        return res
          .status(401)
          .json({ message: "Falha na autenticação: Token inválido." });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados: ${error.message}` });
    }
  }
  async generationRoutine(req, res) {
    try {
      const months = {
        "01": "ic_january",
        "02": "ic_february",
        "03": "ic_march",
        "04": "ic_april",
        "05": "ic_may",
        "06": "ic_june",
        "07": "ic_july",
        "08": "ic_august",
        "09": "ic_september",
        10: "ic_october",
        11: "ic_november",
        12: "ic_december",
      };
      const radiation = await IrradiationCoefficient.findAll({
        attributes: {
          exclude: [
            "ic_uuid",
            "ic_lat",
            "ic_lon",
            "ic_created_at",
            "ic_updated_at",
          ],
        },
      });
      const date = moment().format("MM");
      const dateYearmonth = moment().format("YYYY-MM");
      const result = await Devices.findAll({
        attributes: [
          "dev_uuid",
          "dev_manual_gen_est",
          "dev_capacity",
          "dev_address",
        ],
      });

      const manualGen = result.map((element) => {
        if (element.dev_manual_gen_est == 0 || !element.dev_manual_gen_est) {
          if (
            !element.dev_capacity ||
            !element.dev_address ||
            element.dev_address == "undefined-undefined" ||
            !element.dev_address.split("-")[0] ||
            !element.dev_address.split("-")[1]
          ) {
            element.dev_manual_gen_est = 100;
          } else {
            const currentMonth = months[date];
            const city = element.dev_address.split("-")[0];
            const state = element.dev_address.split("-")[1];

            const object = radiation.find((element) => {
              return element.ic_city == city && element.ic_states == state;
            });
            if (!object) {
              element.dev_manual_gen_est = 100;
            } else {
              element.dev_manual_gen_est =
                element.dev_capacity * object[currentMonth] * 0.81;
            }
          }
        }

        return {
          ...element.dataValues,
          dev_manual_gen_est: element.dev_manual_gen_est,
        };
      });

      await Promise.all(
        manualGen.map(async (element) => {
          await Generation.create({
            dev_uuid: element.dev_uuid,
            gen_estimated: Math.floor(element.dev_manual_gen_est * 100) / 100,
            gen_date: `${dateYearmonth}-01`,
            gen_real: 0,
          });
        })
      );

      return res.status(200).json({ data: manualGen });
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao atualizar os dados: ${error.message}` });
    }
  }
  agendarInputGeracao() {
    cron.schedule(
      "0 0 1 * *",
      async () => {
        try {
          await this().generationRoutine();
        } catch (error) {
          console.error("Erro durante a inserção das gerações:", error);
        }
      },
      {
        timezone: "America/Sao_Paulo",
      }
    );
  }
}
const generationController = new GenerationController();
// generationController.agendarInputGeracao();
export default new GenerationController();
