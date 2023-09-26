import { Sequelize, Op } from "sequelize";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import moment from "moment-timezone";
import nodemailer from "nodemailer";

import Temperature from "../models/Temperature";
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,

  // secure: false, //alterar
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "xbox ejjd wokp ystv",
  },
  // tls: {
  //   rejectUnauthorized: true, //Usar "false" para ambiente de desenvolvimento
  // },
});
class GenerationController {
  //Esta função recupera dados de dispositivos e a temperatura mais recente, dentro de um intervalo de datas especificado. 
  //Em seguida, ela calcula alertas com base na geração de energia diária em relação à estimada e retorna os resultados em formato JSON.
  async deviceDataAndLatestTemperature(req, res) {
    const { startDate, endDate, type, devUuid } = req.query;
    const dataNow = moment().format("YYYY-MM-DD");
    // const now = dataNow.getDate();
    // const data = moment(now).format("YYYY-MM");
    const firstDay = moment(startDate).format("YYYY-MM-DD");
    const lastDay = moment(endDate).format("YYYY-MM-DD");

    console.log(firstDay, lastDay, dataNow);
    try {
      let deviceData;

      // Busca de primeiro ao último dia do mês
      deviceData = await Devices.findAll({
        where: {
          dev_uuid: devUuid,
        },
        attributes: ["dev_name"],
        include: [
          {
            model: Generation,
            as: "generation",
            where: {
              gen_date: {
                [Op.between]: [firstDay, lastDay],
              },
            },
            order: [["gen_date", "ASC"]],
          },
        ],
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
        const generation = dev.generation.find(
          (gen) => gen.gen_date === dataNow
        );

        dev.alert = {
          msg: "Geração diária dentro da faixa estimada",
          type: "success",
        };

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

      res.json({ deviceData, latestTemp });
      console.log(deviceData, latestTemp);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
//Esta recupera alertas recentes de um dispositivo específico dentro da última hora. 
//Ela retorna os dados em formato JSON, incluindo o nome do dispositivo e os detalhes dos alertas (como o tipo de alerta e o inversor associado, se houver). Se houver um erro durante o processo, a função retorna uma mensagem de erro no formato JSON.
  async recentAlerts(req, res) {
    const { devUuid } = req.query;

    try {
      const recentAlerts = await Devices.findAll({
        where: {
          dev_uuid: devUuid,
        },
        attributes: ["dev_name"],
        include: [
          {
            association: "alerts",
            attributes: ["al_alerts", "al_inv"],
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
        <p><img src="" alt="Logo da MAYA WATCH"></p>
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
}

export default new GenerationController();
