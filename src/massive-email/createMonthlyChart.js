import { createCanvas } from "canvas";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
export async function createMonthlyChart(data) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");
  const labels = Object.keys(data);
  const real_generation = labels.map((label) => data[label]["gen_real_sum"]);
  const estimated_generation = labels.map(
    (label) => data[label]["gen_estimated_sum"]
  );
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "geração real",
          data: real_generation,
          barThickness: 20,
          barPercentage: 0.9, // Ajuste fino da largura da barra dentro da categoria
          categoryPercentage: 0.8, // Ajuste fino do espaçamento entre categorias
          borderColor: "#8FC1B5",
          backgroundColor: "#dce6e3",
        },
        {
          label: "geração estimada",
          data: estimated_generation,
          barThickness: 20,
          barPercentage: 0.9, // Ajuste fino da largura da barra dentro da categoria
          categoryPercentage: 0.8, // Ajuste fino do espaçamento entre categorias
          borderColor: "#8FC1B5",
          backgroundColor: "#a0b2ad",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: false,
          text: "Chart",
        },
      },
      scales: {
        y: {
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: "KWh",
            font: { size: 18, weight: "bold" },
          },
          ticks: {
            font: {
              size: 15, // Tamanho da fonte para o eixo X
            },
          },
          stacked: false,
        },
        x: {
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: "Meses",
            font: { size: 18, weight: "bold" },
          },
          ticks: {
            font: {
              size: 15, // Tamanho da fonte para o eixo X
            },
          },
        },
      },
    },
  });

  return canvas.toBuffer();
}
