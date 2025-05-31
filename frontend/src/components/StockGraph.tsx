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
      <div className="col-span-8 h-full p-4 flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-4 max-w-md">
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: 'rgb(var(--color-foreground))' }}
          >
            Ready to Analyze Stock Pairs
          </h3>
          <div 
            className="text-sm space-y-2 leading-relaxed"
            style={{ color: 'rgb(var(--color-muted-foreground))' }}
          >
            <p>To display chart data, you need to:</p>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>Click on two tickers to select a pair</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>Or click "Find Best Cointegrated Pair"</span>
              </div>
            </div>
            <p className="text-xs mt-3 italic">
              💡 Tip: Adjust the date range in the top-left to analyze different time periods
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get all ticker columns (excluding 'date')
  const tickers = Object.keys(data[0]).filter(key => key !== 'date');
  
  // Define colors for each ticker using theme colors
  const colors = ['rgb(var(--color-chart-1))', 'rgb(var(--color-chart-2))'];

  // Get unique years from the data and create custom ticks
  const getYearTicks = () => {
    const years = new Set<string>();
    const yearTicks: string[] = [];
    
    data.forEach(point => {
      const date = new Date(point.date);
      const year = date.getFullYear().toString();
      
      if (!years.has(year)) {
        years.add(year);
        // Find the first date of this year in the dataset
        const yearStart = data.find(d => new Date(d.date).getFullYear().toString() === year);
        if (yearStart) {
          yearTicks.push(yearStart.date);
        }
      }
    });
    
    return yearTicks;
  };

  const yearTicks = getYearTicks();

  return (
    <div className="col-span-8 h-full p-4 overflow-hidden">
      <div className="h-full max-h-full">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }}
              tickFormatter={(dateString: string) => {
                const date = new Date(dateString);
                return date.getFullYear().toString();
              }}
              ticks={yearTicks}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }}
              tickFormatter={(value: number) => value.toFixed(2)}
              label={{ 
                value: 'Adj Close ($)', 
                angle: -90, 
                position: 'insideLeft',
                offset: -10,
                style: { textAnchor: 'middle', fill: 'rgb(var(--color-muted-foreground))' }
              }}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
              contentStyle={{
                backgroundColor: 'rgb(var(--color-card))',
                border: '1px solid rgb(var(--color-border))',
                borderRadius: '0.375rem',
                color: 'rgb(var(--color-card-foreground))'
              }}
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