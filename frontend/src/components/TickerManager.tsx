import React, { useState } from 'react';

interface TickerManagerProps {
  onTickerAdd: (ticker: string) => void;
  onSectorSelect: (sector: string) => void;
}

export const TickerManager: React.FC<TickerManagerProps> = ({
  onTickerAdd,
  onSectorSelect,
}) => {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<string[]>([]);

  const handleAddTicker = () => {
    if (tickerInput && !tickers.includes(tickerInput.toUpperCase())) {
      const newTicker = tickerInput.toUpperCase();
      setTickers([...tickers, newTicker]);
      onTickerAdd(newTicker);
      setTickerInput('');
    }
  };

  const sectors = ['Tech', 'Finance', 'Energy', 'Healthcare'];

  return (
    <div className="col-span-4 bg-white rounded-lg shadow p-4">
      <div className="grid grid-rows-3 gap-4 h-full">
        {/* Ticker Input */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded p-4">
            <input 
              type="text" 
              placeholder="Enter ticker symbol"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-gray-100 rounded p-4">
            <button 
              onClick={handleAddTicker}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Add Ticker
            </button>
          </div>
        </div>
        
        {/* Ticker List */}
        <div className="bg-gray-100 rounded p-4">
          <div className="flex flex-wrap gap-2">
            {tickers.map((ticker) => (
              <span 
                key={ticker}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {ticker}
              </span>
            ))}
          </div>
        </div>
        
        {/* Sector Buttons */}
        <div className="bg-gray-100 rounded p-4">
          <div className="grid grid-cols-2 gap-2">
            {sectors.map((sector) => (
              <button 
                key={sector}
                onClick={() => onSectorSelect(sector)}
                className="bg-purple-100 text-purple-800 px-3 py-2 rounded-md hover:bg-purple-200 transition-colors"
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 