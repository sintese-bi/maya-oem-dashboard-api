import { PDFDocument, degrees, rgb } from "pdf-lib";
import fs from "fs/promises";
import moment from "moment-timezone";
import { createMonthlyChart } from "../massive-email/createMonthlyChart";
import { createDailyChart } from "../massive-email/createDailyChart";

export const generateFile = async ({
  dev_name,
  period,
  currentMonthRealSum,
  currentMonthEstimatedSum,
  performance,
  treesSavedTotal,
  CO2,
  generationData,
  currentMonthData,
}) => {
  const startOfMonth = moment().startOf("month").format("DD/MM/YYYY");
  const recentDayOfMonth = moment().format("DD/MM/YYYY");
  const url = `src/utils/final.pdf`;
  const existingPdfBytes = await fs.readFile(url);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const monthlyChart = await pdfDoc.embedPng(
    await createMonthlyChart(generationData)
  );
  const dailyChart = await pdfDoc.embedPng(
    await createDailyChart(currentMonthData)
  );
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  firstPage.drawText(dev_name, {
    x: 12,
    y: height - 80,
    size: 12,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(dev_name, {
    x: 249,
    y: height - 50,
    size: 8,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(period, {
    x: 249,
    y: height - 92,
    size: 12,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(String(currentMonthRealSum), {
    x: 42,
    y: height - 191,
    size: 10,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(String(currentMonthEstimatedSum), {
    x: 168,
    y: height - 191,
    size: 10,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(String(performance), {
    x: 290,
    y: height - 191,
    size: 10,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(String(treesSavedTotal), {
    x: 416,
    y: height - 191,
    size: 10,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(String(CO2), {
    x: 538,
    y: height - 191,
    size: 10,
    color: rgb(0, 0, 0),
  });
  firstPage.drawImage(monthlyChart, {
    x: 24,
    y: height / 2 + 32,
    height: 220,
    width: 520,
  });
  firstPage.drawImage(dailyChart, {
    x: 24,
    y: height / 2 - 272,
    height: 220,
    width: 520,
  });
  const base64DataUri = await pdfDoc.saveAsBase64();
  return { base64: base64DataUri };
};
