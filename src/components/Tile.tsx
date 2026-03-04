import clsx from 'clsx';

interface TileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  variant?: 'default' | 'risk-low' | 'risk-medium' | 'risk-high' | 'warning';
  className?: string;
}

export default function Tile({ label, value, subtitle, trend, variant = 'default', className }: TileProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border p-3 flex flex-col',
        {
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700': variant === 'default',
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': variant === 'risk-low',
          'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800': variant === 'risk-medium',
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800': variant === 'risk-high',
          'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700': variant === 'warning',
        },
        className
      )}
    >
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</span>
      <span
        className={clsx('text-lg font-bold mt-1', {
          'text-gray-900 dark:text-gray-100': variant === 'default',
          'text-green-700 dark:text-green-400': variant === 'risk-low',
          'text-amber-700 dark:text-amber-400': variant === 'risk-medium',
          'text-red-700 dark:text-red-400': variant === 'risk-high',
          'text-amber-800 dark:text-amber-400': variant === 'warning',
        })}
      >
        {value}
      </span>
      {subtitle && <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</span>}
      {trend && (
        <span
          className={clsx('text-xs mt-1 font-medium', {
            'text-green-600 dark:text-green-400': trend.direction === 'down',
            'text-red-600 dark:text-red-400': trend.direction === 'up',
            'text-gray-500 dark:text-gray-400': trend.direction === 'flat',
          })}
        >
          {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'} {trend.label}
        </span>
      )}
    </div>
  );
}
