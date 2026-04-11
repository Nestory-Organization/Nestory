import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink';
  subtext?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtext,
  trend,
}) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-primary-container text-primary-700',
    green: 'bg-tertiary-container text-tertiary-700',
    purple: 'bg-secondary-100 text-secondary-800',
    orange: 'bg-amber-100 text-amber-900',
    red: 'bg-red-100 text-red-800',
    pink: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="card animate-slide-up bg-surface-container-lowest">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-headline text-3xl font-semibold text-on-surface">{value}</h3>
            {trend ? (
              <span
                className={`text-xs font-semibold ${trend > 0 ? 'text-tertiary-700' : 'text-red-700'}`}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            ) : null}
          </div>
          {subtext && <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{subtext}</p>}
        </div>
        <div className={`${colorMap[color]} p-3.5 rounded-2xl shrink-0 shadow-ambient-sm`}>
          <Icon size={26} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
