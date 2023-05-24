import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: false,
      text: "Chart.js Bar Chart",
    },
  },
};

const labels = ["January", "February", "March", "April", "May", "June", "July"];

export const data = {
  labels,
  datasets: [
    {
      label: "Client Ad Rate",
      data: labels.map(() => Math.random() * 10),
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
    {
      label: "Client Entertainment Rate",
      data: labels.map(() => Math.random() * 10),
      backgroundColor: "rgba(255, 0, 66, 0.5)",
    },
  ],
};

export function ClientAdEntertainmentRateGraph() {
  return <Bar options={options} data={data} />;
}
