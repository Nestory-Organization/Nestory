import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ReadingActivityDayRow } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const nestoryBar = 'rgba(14, 165, 233, 0.85)';
const nestoryBarMuted = 'rgba(14, 165, 233, 0.35)';
const pagesBar = 'rgba(99, 102, 241, 0.75)';

export interface ReadingWeeklyBarChartProps {
  byDay: ReadingActivityDayRow[];
  title?: string;
}

const shortLabel = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const ReadingWeeklyBarChart: React.FC<ReadingWeeklyBarChartProps> = ({
  byDay,
  title = 'Reading this period',
}) => {
  const chartData = useMemo(() => {
    const labels = byDay.map((row) => shortLabel(row.date));
    return {
      labels,
      datasets: [
        {
          label: 'Minutes',
          data: byDay.map((row) => row.minutes),
          backgroundColor: byDay.map((row) =>
            row.minutes > 0 ? nestoryBar : nestoryBarMuted,
          ),
          borderRadius: 6,
          maxBarThickness: 36,
        },
        {
          label: 'Pages',
          data: byDay.map((row) => row.pages),
          backgroundColor: pagesBar,
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    };
  }, [byDay]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { boxWidth: 12, font: { size: 12 } },
        },
        title: {
          display: true,
          text: title,
          font: { size: 15, weight: '600' as const },
          color: '#111827',
          padding: { bottom: 8 },
        },
        tooltip: {
          callbacks: {
            afterBody: (items: { dataIndex: number }[]) => {
              const i = items[0]?.dataIndex;
              if (i === undefined || !byDay[i]) return '';
              const saves = byDay[i].progressSaveCount;
              return saves ? `${saves} progress save${saves === 1 ? '' : 's'}` : '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#6b7280' },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#6b7280' },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }),
    [byDay, title],
  );

  if (!byDay.length) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">No daily breakdown yet.</p>
    );
  }

  return (
    <div className="h-64 w-full min-h-[16rem]">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ReadingWeeklyBarChart;
