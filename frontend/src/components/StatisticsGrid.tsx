import React from 'react';

interface StatisticProps {
  title: string;
  value: number;
  description: string;
}

interface StatisticsGridProps {
  statistics: StatisticProps[];
}

const StatisticCard: React.FC<StatisticProps> = ({ title, value, description }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="bg-gray-100 rounded p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button 
          className="text-gray-400 hover:text-gray-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value.toFixed(2)}
      </div>
      {showTooltip && (
        <div className="absolute z-10 bg-gray-800 text-white p-2 rounded text-sm -top-2 left-full ml-2 w-48">
          {description}
        </div>
      )}
    </div>
  );
};

export const StatisticsGrid: React.FC<StatisticsGridProps> = ({ statistics }) => {
  return (
    <div className="col-span-12 bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-6 gap-4">
        {statistics.map((stat, index) => (
          <StatisticCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}; 