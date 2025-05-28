import React from 'react';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import type { TooltipProps } from '@mui/material/Tooltip';
import { tooltipClasses } from '@mui/material/Tooltip';

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
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: '0.75rem',
    border: '1px solid #dadde9',
    padding: '8px 12px',
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
    <div className="col-span-12 bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-6 gap-4">
        {statistics.map((stat) => (
          <StatisticCard key={stat.id} {...stat} />
        ))}
      </div>
    </div>
  );
}; 