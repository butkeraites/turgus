import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  gap = 'sm'
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
    xl: 'gap-6 sm:gap-8'
  };

  const getColClass = (breakpoint: string, colCount?: number) => {
    if (!colCount) return '';
    return `${breakpoint}:grid-cols-${colCount}`;
  };

  const gridClasses = [
    'grid',
    gapClasses[gap],
    cols.xs ? `grid-cols-${cols.xs}` : 'grid-cols-2',
    getColClass('sm', cols.sm),
    getColClass('md', cols.md),
    getColClass('lg', cols.lg),
    getColClass('xl', cols.xl),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}