import React from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="col-span-4 bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="bg-gray-100 rounded p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}; 