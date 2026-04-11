import React from 'react';

// ─────────────────────────────────────────────────────────────
// Layout & Structural Components
// ─────────────────────────────────────────────────────────────

export const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`container-responsive ${className}`}>{children}</div>;

export const Header: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
  <header
    className={`w-full px-6 md:px-10 py-4 flex items-center justify-between glass-effect sticky top-0 z-50 ${className}`}
    style={style}
  >
    {children}
  </header>
);

export const Section: React.FC<{
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  action?: React.ReactNode;
}> = ({ children, title, subtitle, className = '', style, action }) => (
  <section className={`py-6 ${className}`} style={style}>
    {(title || subtitle || action) && (
      <div className="flex items-start justify-between mb-6">
        <div>
          {title && (
            <h2 className="text-2xl serif-text font-bold text-on-surface tracking-tight">{title}</h2>
          )}
          {subtitle && <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </section>
);

export const Grid: React.FC<{
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, columns = 3, gap = 'lg', className = '', style }) => {
  const gapClass = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' }[gap];
  const colClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} ${gapClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Card Components
// ─────────────────────────────────────────────────────────────

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ children, className = '', interactive = false, onClick, style }) => (
  <div
    className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
    onClick={onClick}
    style={style}
    role={interactive ? 'button' : undefined}
    tabIndex={interactive ? 0 : undefined}
    onKeyDown={interactive && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    {children}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  backgroundColor?: string;
  className?: string;
}> = ({ label, value, icon, trend, trendValue, className = '' }) => (
  <Card className={`flex items-start gap-4 ${className}`}>
    {icon && (
      <div className="p-3 rounded-xl bg-surface-container-high flex-shrink-0">{icon}</div>
    )}
    <div className="flex flex-col">
      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </span>
      <span className="text-3xl font-bold serif-text text-primary leading-none">{value}</span>
      {trendValue && (
        <span
          className={`text-xs font-medium mt-1 ${
            trend === 'up' ? 'text-tertiary' : trend === 'down' ? 'text-error' : 'text-outline'
          }`}
        >
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
          {trendValue}
        </span>
      )}
    </div>
  </Card>
);

export const BookCard: React.FC<{
  title: string;
  author: string;
  cover?: string;
  coverUrl?: string;
  level?: string;
  onClick?: () => void;
  className?: string;
}> = ({ title, author, cover, coverUrl, level, onClick, className = '' }) => {
  const imgSrc = cover || coverUrl;
  return (
    <Card interactive onClick={onClick} className={`flex flex-col gap-0 p-0 overflow-hidden ${className}`}>
      <div className="w-full aspect-[3/4] bg-surface-container flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Cover for ${title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="material-symbols-outlined text-6xl text-outline-variant">menu_book</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-headline font-bold text-base leading-snug line-clamp-2 text-on-surface">
          {title}
        </h3>
        <p className="text-on-surface-variant text-sm mt-1 truncate">{author}</p>
        {level && (
          <span className="badge badge-primary mt-2">{level}</span>
        )}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Button Component
// ─────────────────────────────────────────────────────────────

export const Button: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}> = ({
  children,
  className = '',
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
  size = 'md',
  icon,
}) => {
  const sizeClass = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3', lg: 'px-8 py-4 text-lg' }[size];
  const variantClass =
    variant === 'ghost'
      ? 'text-primary hover:bg-surface-container-low rounded-full transition-colors font-semibold'
      : `btn-${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 ${sizeClass} ${variantClass} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// Chip / Tag Components
// ─────────────────────────────────────────────────────────────

export const Chip: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ children, active = false, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
      active
        ? 'bg-primary text-on-primary'
        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
    } ${className}`}
  >
    {children}
  </button>
);

export const ChipGroup: React.FC<{
  chips: { id: string; label: string }[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}> = ({ chips, activeId, onSelect, className = '' }) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    {chips.map((chip) => (
      <Chip key={chip.id} active={chip.id === activeId} onClick={() => onSelect?.(chip.id)}>
        {chip.label}
      </Chip>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Streak Display
// ─────────────────────────────────────────────────────────────

export const Streak: React.FC<{
  days: number;
  label?: string;
  className?: string;
}> = ({ days, label = 'Day Streak', className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
      local_fire_department
    </span>
    <span className="font-bold text-lg text-primary">{days}</span>
    <span className="text-on-surface-variant text-sm">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Progress Ring (SVG)
// ─────────────────────────────────────────────────────────────

export const ProgressRing: React.FC<{
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}> = ({ value, size = 80, strokeWidth = 8, label, className = '' }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#efeeea"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#8e4e14"
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-primary text-sm font-bold"
          fontSize={size * 0.2}
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fill="#8e4e14"
        >
          {value}%
        </text>
      </svg>
      {label && <span className="text-xs text-on-surface-variant text-center">{label}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Activity Feed Item
// ─────────────────────────────────────────────────────────────

export const ActivityItem: React.FC<{
  icon?: string;
  title: string;
  subtitle?: string;
  time?: string;
  className?: string;
}> = ({ icon = 'auto_stories', title, subtitle, time, className = '' }) => (
  <div className={`flex items-start gap-4 py-4 ${className}`}>
    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-on-primary-container text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-on-surface leading-snug">{title}</p>
      {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
    </div>
    {time && <span className="text-xs text-outline flex-shrink-0">{time}</span>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Sidebar Nav Item
// ─────────────────────────────────────────────────────────────

export const NavItem: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}> = ({ icon, label, active = false, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
      active
        ? 'bg-primary text-on-primary'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`}
  >
    <span
      className="material-symbols-outlined text-xl"
      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
    >
      {icon}
    </span>
    <span className="font-semibold text-sm flex-1">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-error text-on-error text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);
