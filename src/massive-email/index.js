import { generateFile } from "../utils/generateMassiveReports";
import nodemailer from "nodemailer";
import Users from "../models/Users";
import { getGeneration } from "./get_generation";
import { getGroupedGeneration } from "./get_grouped_generation";
import { sumGeneration } from "./sum_generation";
import { formattedResult } from "./formatted_result";

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

export async function massiveEmail(use_uuid) {
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
  const result = await getGeneration(use_uuid);
  const grouped_result = await getGroupedGeneration(result);
  const formatted_result = await formattedResult(grouped_result);
  const sum_generation = await sumGeneration(formatted_result);
  for (const data of sum_generation) {
    let dataToJSON = JSON.parse(data);
    let report = await generateFile({
      params: dataToJSON,
    });
    dataToJSON.report = report;
    const attachment = {
      filename: "relatorio.pdf",
      content: dataToJSON.report.base64,
      encoding: "base64",
    };
    const emailBody = `
      Prezado usuário,<br><br>
    
      Em anexo, relatório com a performance da sua usina no mês atual. Estamos à disposição para quaisquer dúvidas e sugestões.<br><br>
    
      <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
      https://mayax.com.br/
    `;
    const mailOptions = {
      from: "noreplymayawatch@gmail.com",
      to: [
        // JSON.parse(chunk).email,
        "felipegadelha2004@gmail.com",
      ],
      subject: "Relatório de dados de Geração",
      text: "",
      html: emailBody,
      attachments: attachment,
    };
    //transporter.sendMail(mailOptions);
  }

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
