import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { TooltipProps } from 'recharts';

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

interface StockGraphProps {
  data: ChartDataPoint[] | null;
}

export const StockGraph: React.FC<StockGraphProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="col-span-8 bg-white rounded-lg shadow p-4 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Get all ticker columns (excluding 'date')
  const tickers = Object.keys(data[0]).filter(key => key !== 'date');
  
  // Define colors for each ticker
  const colors = ['#2563eb', '#dc2626']; // Blue and Red

  return (
    <div className="col-span-8 bg-white rounded-lg shadow p-4">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            {tickers.map((ticker, index) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={colors[index % colors.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 