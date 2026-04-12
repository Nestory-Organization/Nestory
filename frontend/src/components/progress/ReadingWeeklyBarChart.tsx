import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { ReadingActivityDayRow } from "../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ReadingWeeklyBarChartProps {
  byDay?: ReadingActivityDayRow[];
  title?: string;
  color?: string;
  isParent?: boolean;
}

const ReadingWeeklyBarChart: React.FC<ReadingWeeklyBarChartProps> = ({ 
  byDay = [], 
  title = "Reading Activity", 
  color = "#f43f5e",
  isParent = false
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
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          if (isParent) {
            gradient.addColorStop(0, "#6366f1"); // Indigo-500
            gradient.addColorStop(1, "rgba(99, 102, 145, 0.2)");
          } else {
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, "rgba(244, 63, 94, 0.1)");
          }
          return gradient;
        },
        borderRadius: 20,
        borderSkipped: false,
        barThickness: 24,
        hoverBackgroundColor: isParent ? "#4f46e5" : "#e11d48",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
          family: "Inter, sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "Inter, sans-serif"
        },
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context) => ` 📖 ${context.raw} minutes reading`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.04)",
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          padding: 10,
          font: {
            family: "Inter, sans-serif",
            weight: "700",
            size: 11,
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
          padding: 10,
          font: {
            family: "Inter, sans-serif",
            weight: "800",
            size: 12,
          },
          color: "#4b5563",
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart"
    }
  };

  if (!byDay || byDay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
           📊
        </div>
        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Not enough data yet 🔍</p>
      </div>
    );
  }

  return <Bar options={options} data={data} />;
};

export default ReadingWeeklyBarChart;
