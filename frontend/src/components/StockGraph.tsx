import React from 'react';

interface StockGraphProps {
  data?: any; // Replace with proper type when implementing actual graph
}

export const StockGraph: React.FC<StockGraphProps> = ({ data }) => {
  return (
    <div className="col-span-8 bg-white rounded-lg shadow p-4">
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        {/* Placeholder for actual graph implementation */}
        Graph Area
      </div>
    </div>
  );
}; 