import React from 'react';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import type { TooltipProps } from '@mui/material/Tooltip';
import { tooltipClasses } from '@mui/material/Tooltip';
import MetricDescription from './MetricDescription';

interface StatisticProps {
  id: string;
  title: string;
  value: number;
  description: string;
}

interface StatisticsGridProps {
  statistics: StatisticProps[];
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'rgb(var(--color-background))',
    maxWidth: 500,
    fontSize: '0.875rem',
    border: '1px solid rgb(var(--color-border))',
    padding: '20px 24px',
    lineHeight: '1.5',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const StatisticCard: React.FC<StatisticProps> = ({ id, title, value, description }) => {
  return (
    <div className="bg-gray-100 rounded p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <HtmlTooltip title={description}>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </HtmlTooltip>
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value.toFixed(2)}
      </div>
    </div>
  );
};

export const StatisticsGrid: React.FC<StatisticsGridProps> = ({ statistics }) => {
  return (
    <div className="col-span-12 grid grid-cols-7 grid-rows-3 gap-3">
      {statistics.map((stat) => (
        <div key={stat.id} className="card p-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium" style={{ color: 'rgb(var(--color-muted-foreground))' }}>{stat.title}</h3>
              <HtmlTooltip 
                title={
                  <MetricDescription description={stat.description} />
                }
              >
                <button className="transition-colors hover:opacity-80" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </HtmlTooltip>
            </div>
            <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-foreground))' }}>
              {typeof stat.value === 'number' ? stat.value.toFixed(4) : stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}; 