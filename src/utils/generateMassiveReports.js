import { PDFDocument, degrees, rgb } from "pdf-lib";
import fs from "fs/promises";
import moment from "moment-timezone";

export const generateFile = async ({ params }) => {
  let dataSpace = 0;
  let dataBetweenSpace = 0;
  let dataWidth = 0;

  switch ("30days") {
    case "5days":
      dataSpace = 60;
      dataBetweenSpace = 28;
      dataWidth = 26;
      break;

    case "15days":
      dataSpace = 32;
      dataBetweenSpace = 14;
      dataWidth = 12;
      break;

    case "30days":
      dataSpace = 16;
      dataBetweenSpace = 8;
      dataWidth = 6;
      break;

    default:
      break;
  }

  const { realGeneration, estimatedGeneration } = params;

  console.log(realGeneration, estimatedGeneration);

  const startOfMonth = moment().startOf("month").format("DD/MM/YYYY");
  const recentDayOfMonth = moment().format("DD/MM/YYYY");

  const url = `src/utils/final.pdf`;
  const existingPdfBytes = await fs.readFile(url);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const emblemUrl =
    "https://ucarecdn.com/258f82dc-bf80-4b30-a4be-bcea7118f14a/-/preview/500x500/-/quality/smart/-/format/auto/";
  const emblemImageBytes = await fetch(emblemUrl).then((res) =>
    res.arrayBuffer()
  );
  const emblemImage = await pdfDoc.embedPng(emblemImageBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  const maxValue = Math.max(...realGeneration.map((data) => data.value));

  firstPage.drawRectangle({
    x: dataSpace + 26,
    y: height - 298,
    width: 0.5,
    height: (maxValue / 20) * 5,
    rotate: degrees(0),
    color: rgb(0, 0, 0),
    opacity: 0.3,
  });

  firstPage.drawText(`${maxValue.toFixed()}`, {
    x: dataSpace + 10,
    y: height - 298 + (maxValue / 20) * 5,
    size: 8,
  });

  firstPage.drawText("0", {
    x: dataSpace + 10,
    y: height - 298,
    size: 8,
  });

  realGeneration.map((realGenerationItem, index) => {
    firstPage.drawRectangle({
      x: index * dataSpace + 51,
      y: height - 298,
      width: dataWidth,
      height: (realGenerationItem.value / 20) * 5,
      rotate: degrees(0),
      color: rgb(0.4235, 0.898, 0.9098),
      opacity: 0.5,
      borderOpacity: 0.75,
    });
    firstPage.drawRectangle({
      x: index * dataSpace + dataBetweenSpace + 51,
      y: height - 298,
      width: dataWidth,
      height: (estimatedGeneration[index] / 20) * 5,
      rotate: degrees(0),
      color: rgb(0.1765, 0.5451, 0.7294),
      opacity: 0.5,
      borderOpacity: 0.75,
    });
    firstPage.drawText(
      `${moment(realGenerationItem.date, "DD-MM-AAAA").format("DD")}`,
      {
        size: 8,
        x: index * dataSpace + dataBetweenSpace + 45,
        y: height - 310,
        width: dataWidth,
        height: estimatedGeneration[index] * 5,
      }
    );
  });

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
    y: height - 95,
    height: 70,
    width: 180,
  });

  firstPage.drawText(`266`, {
    color: rgb(1, 1, 1),
    x: 40,
    y: height / 2 + 26,
    size: 19,
  });

  firstPage.drawText(
    `${params.capacity} KWp
    `,
    {
      color: rgb(1, 1, 1),

      x: 226,
      y: height / 2 + 26,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.sumrealNew} KWh
    `,
    {
      color: rgb(1, 1, 1),

      x: 410,
      y: height / 2 + 26,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.sumestimatedNew} KWh
    `,
    {
      color: rgb(1, 1, 1),

      x: 133,
      y: height / 2 - 68,
      size: 19,
    }
  );

  firstPage.drawText(
    `${params.percentNew} %
    `,
    {
      color: rgb(1, 1, 1),

      x: 318,
      y: height / 2 - 68,
      size: 19,
    }
  );

  firstPage.drawText(`${params.situation}`, {
    color: rgb(1, 1, 1),
    x: width / 2 - 152,
    y: height - (height - 262),
    size: 10,
  });

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
