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
import { ReadingActivityDayRow } from "../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface ReadingWeeklyBarChartProps {
  byDay?: ReadingActivityDayRow[];
  title?: string;
  color?: string;
}

const ReadingWeeklyBarChart: React.FC<ReadingWeeklyBarChartProps> = ({ 
  byDay = [], 
  title = "Reading Activity", 
  color = "#f43f5e" 
}) => {
  const shortLabel = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const labels = byDay?.map((row) => shortLabel(row.date)) || [];
  const dataPoints = byDay?.map((row) => row.minutesSpent) || [];

  const data = {
    labels,
    datasets: [
      {
        label: "Minutes Spent",
        data: dataPoints,
        backgroundColor: color,
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            weight: "700" as const,
            size: 10,
          },
          color: "#9ca3af",
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            weight: "800" as const,
            size: 11,
          },
          color: "#4b5563",
        },
      },
    },
  };

  if (!byDay || byDay.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase text-xs tracking-widest">
        Not enough data yet ??
      </div>
    );
  }

  return <Bar options={options} data={data} />;
};

export default ReadingWeeklyBarChart;
