import Devices from "../models/Devices";
import Generation from "../models/Generation";
import { generateFile } from "../utils/generateMassiveReports";
import { Sequelize, Op } from "sequelize";
import { setTimeout } from "node:timers/promises";

import nodemailer from "nodemailer";
import Reports from "../models/Reports";
import Users from "../models/Users";
import { WebSocketService } from "../service/websocket";
import { server } from "../server";

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

export async function massiveEmail(use_uuid, res, req) {
  let sentEmailsAmount = 0;

  //const webSocketService = new WebSocketService();
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

  const { Readable, Writable, pipeline, Transform } = require("node:stream");
  const util = require("util");

  const pipelineAsync = util.promisify(pipeline);
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
  const resultDev = await Devices.findAll({
    include: [
      {
        association: "brand_login",
        attributes: [],
        where: {
          use_uuid: use_uuid,
        },
      },
    ],
    attributes: ["dev_uuid"],
    where: {
      dev_email: {
        [Op.not]: null,
      },
      [Op.or]: [{ dev_deleted: false }, { dev_deleted: { [Op.is]: null } }],
    },
  });

  const readableStream = Readable({
    async read() {
      try {
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

        // Process the results
        sum_generation.forEach((result) => this.push(result));

        this.push(null);
      } catch (error) {
        this.emit("error", error);
      }
    },
  });

  const transformStream = Transform({
    async transform(chunk, encode, cb) {
      const realGeneration = [
        { value: 242.77, date: "01-02-2024" },
        { value: 54.12, date: "02-02-2024" },
        { value: 101.88, date: "03-02-2024" },
        { value: 163.32, date: "04-02-2024" },
        { value: 312.65, date: "05-02-2024" },
        { value: 176.53, date: "06-02-2024" },
        { value: 51.31, date: "07-02-2024" },
        { value: 116.78, date: "08-02-2024" },
        { value: 324.93, date: "09-02-2024" },
        { value: 153.89, date: "10-02-2024" },
        { value: 108.01, date: "11-02-2024" },
        { value: 327.34, date: "12-02-2024" },
        { value: 253.67, date: "13-02-2024" },
        { value: 234.68, date: "14-02-2024" },
        { value: 250.42, date: "15-02-2024" },
        { value: 275.57, date: "16-02-2024" },
        { value: 238.41, date: "17-02-2024" },
        { value: 63.05, date: "18-02-2024" },
        { value: 170.43, date: "19-02-2024" },
        { value: 219.22, date: "20-02-2024" },
        { value: 79.94, date: "21-02-2024" },
        { value: 307.22, date: "22-02-2024" },
        { value: 233.38, date: "23-02-2024" },
        { value: 256.52, date: "24-02-2024" },
        { value: 174.33, date: "25-02-2024" },
        { value: 82.34, date: "26-02-2024" },
        { value: 198.84, date: "27-02-2024" },
        { value: 51.68, date: "28-02-2024" },
        { value: 179.76, date: "29-02-2024" },
        { value: 294.69, date: "30-02-2024" },
        { value: 71.21, date: "31-02-2024" },
      ];

      const estimatedGeneration = [
        121.38, 27.06, 50.94, 81.66, 156.33, 88.26, 25.65, 58.39, 162.47, 76.95,
        54.0, 163.67, 126.83, 117.34, 125.21, 137.78, 119.2, 31.53, 85.22,
        109.61, 39.97, 153.61, 116.69, 128.26, 87.17, 41.17, 99.42, 25.84,
        89.88, 147.34, 35.61,
      ];

      let report = await generateFile({
        params: JSON.parse(chunk),
        paramstest: {
          realGeneration,
          estimatedGeneration,
        },
      });
      let userWithReport = JSON.parse(chunk);
      userWithReport.report = report;
      cb(null, JSON.stringify(userWithReport));
    },
  });

  const writableStream = Writable({
    async write(chunk, enconding, cb) {
      const attachment = {
        filename: "relatorio.pdf",
        content: JSON.parse(chunk).report.base64,
        encoding: "base64",
      };

      // const searchDeviceEmail = await Devices.findOne({
      //   where: { dev_uuid: dev_uuid },
      //   attributes: ["dev_email"],
      // });

      // const emailBody = `
      //   Prezado usuário,

      //   Anexamos um relatório em formato PDF com os dados de geração da usina. Este relatório inclui informações referentes à geração diária, semanal e mensal, apresentadas de forma clara e concisa.

      //   Além disso, no documento, você encontrará um gráfico temporal que ilustra a variação na produção de energia ao longo do período analisado.

      //   <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
      // `;
      const emailBody = `
          Prezado usuário,<br><br>

          Em anexo, relatório com a performance da sua usina no mês atual. Estamos à disposição para quaisquer dúvidas e sugestões.<br><br>
      
          <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
          https://mayax.com.br/
      `;

      const mailOptions = {
        from: "noreplymayawatch@gmail.com",
        to: [
          JSON.parse(chunk).email,
          "bisintese@gmail.com",
          "eloymun00@gmail.com",
        ],
        subject: "Relatório de dados de Geração",
        text: "",
        html: emailBody,
        attachments: attachment,
      };

      const user = await Users.findOne({
        attributes: ["use_massive_reports_status"],
        where: {
          use_uuid: use_uuid,
        },
      });

      if (user.use_massive_reports_status == "completed") {
        return;
      }

      try {
        await transporter.sendMail(mailOptions);
        await setTimeout(2000);
        sentEmailsAmount = sentEmailsAmount + 100 / resultDev.length;
        console.log(sentEmailsAmount)
        res.write(`data: ${sentEmailsAmount}\n\n`);

        //console.log({
        //  success: true,
        //  message: `Email enviado com sucesso para dev_uuid: ${
        //    JSON.parse(chunk).dev_uuid
        //  }`,
        //});

        //Adicionar atualização tabela report
        //await Devices.update({
        //  dev_verify_email: true,
        //});
      } catch (error) {
        console.log({
          success: false,
          message: `Erro ao enviar o email para dev_uuid: ${
            JSON.parse(chunk).dev_uuid
          } - ${error}`,
        });
      }
      cb();
    },
  });

  pipelineAsync(readableStream, transformStream, writableStream).then(
    async () => {
      res.end();
      await Users.update(
        {
          use_massive_reports_status: "completed",
        },
        {
          where: {
            use_uuid: use_uuid,
          },
        }
      );
    }
  );
}
