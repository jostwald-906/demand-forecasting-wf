import clsx from 'clsx';

type PillVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray';

interface StatusPillProps {
  label: string;
  variant?: PillVariant;
  className?: string;
}

const VARIANT_MAP: Record<string, PillVariant> = {
  Recommended: 'blue',
  'Under Review': 'amber',
  Approved: 'green',
  Rejected: 'gray',
  High: 'green',
  Medium: 'amber',
  Low: 'red',
  MICAP: 'red',
};

export default function StatusPill({ label, variant, className }: StatusPillProps) {
  const v = variant ?? VARIANT_MAP[label] ?? 'gray';

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300': v === 'blue',
          'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300': v === 'green',
          'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300': v === 'amber',
          'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300': v === 'red',
          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300': v === 'gray',
        },
        className
      )}
    >
      {label}
    </span>
  );
}
