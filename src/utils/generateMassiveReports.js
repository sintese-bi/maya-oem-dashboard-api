import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs/promises";
import moment from "moment-timezone";

export const generateFile = async (params) => {
  const startOfMonth = moment().startOf("month").format("DD/MM/YYYY");
  const recentDayOfMonth = moment().format("DD/MM/YYYY");

  const url = `src/utils/teste.pdf`;
  const existingPdfBytes = await fs.readFile(url);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const emblemUrl =
    "https://ucarecdn.com/258f82dc-bf80-4b30-a4be-bcea7118f14a/-/preview/500x500/-/quality/smart/-/format/auto/";
  const emblemImageBytes = await fetch(emblemUrl).then((res) =>
    res.arrayBuffer()
  );
  console.log(emblemImageBytes);
  const emblemImage = await pdfDoc.embedPng(emblemImageBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  firstPage.drawText(`${params.name}`, {
    color: rgb(1, 1, 1),

    x: 20,
    y: height - 35,
    size: 14,
  });

  firstPage.drawText("Data de geração", {
    color: rgb(1, 1, 1),

    x: 20,
    y: height - 75,
    size: 14,
  });
  firstPage.drawText(`${recentDayOfMonth}`, {
    color: rgb(1, 1, 1),

    x: 20,
    y: height - 90,
    size: 12,
  });

  firstPage.drawText("Data de aquisição dos dados", {
    color: rgb(1, 1, 1),

    x: 150,
    y: height - 75,
    size: 14,
  });
  firstPage.drawText(`${startOfMonth} ${recentDayOfMonth}`, {
    color: rgb(1, 1, 1),
    x: 150,
    y: height - 90,
    size: 12,
  });

  firstPage.drawImage(emblemImage, {
    x: width - 180,
    y: height - 105,
    height: 70,
    width: 180,
  });

  firstPage.drawText(`266`, {
    color: rgb(1, 1, 1),
    x: 40,
    y: height / 2 + 19,
    size: 19,
  });

  firstPage.drawText(
    `${params.capacity} MWp
    `,
    {
      color: rgb(1, 1, 1),

      x: 226,
      y: height / 2 + 19,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.sumrealNew} MWh
    `,
    {
      color: rgb(1, 1, 1),

      x: 422,
      y: height / 2 + 19,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.sumestimatedNew} MWp
    `,
    {
      color: rgb(1, 1, 1),

      x: 152,
      y: height / 2 - 76,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.percentNew} MWp
    `,
    {
      color: rgb(1, 1, 1),

      x: 336,
      y: height / 2 - 76,
      size: 19,
    }
  );

  firstPage.drawText("POWERED BY: MAYA TECH S.A", {
    color: rgb(0, 0, 0),

    x: width / 3 + 34,
    y: height - (height - 120),
    size: 10,
  });

  const pdfBytes = await pdfDoc.save();

  const base64DataUri = await pdfDoc.saveAsBase64();
  return { base64: base64DataUri };
};
