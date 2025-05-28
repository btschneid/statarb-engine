import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface TickerManagerProps {
  onTickerAdd: (ticker: string) => void;
  onSectorSelect: (sector: string) => void;
  onTickersChange: (tickers: string[]) => void;
  initialTickers?: string[];
}

interface TickerValidation {
  valid: boolean;
  name: string;
}

export const TickerManager: React.FC<TickerManagerProps> = ({
  onTickerAdd,
  onSectorSelect,
  onTickersChange,
  initialTickers = [],
}) => {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<string[]>(initialTickers);

  useEffect(() => {
    // Only set tickers if initialTickers has data and current tickers is empty
    if (initialTickers.length > 0 && tickers.length === 0) {
      setTickers(initialTickers);
      // Optionally notify parent about initial tickers
      initialTickers.forEach(ticker => {
        onTickerAdd(ticker);
      });
    }
  }, [initialTickers]); // Watch for changes in initialTickers

  // Notify parent when tickers change
  useEffect(() => {
    onTickersChange(tickers);
  }, [tickers, onTickersChange]);

  const handleAddTicker = async () => {
    if (!tickerInput) return;

    const tickerToValidate = tickerInput.toUpperCase();
    
    // Don't add if already in list
    if (tickers.includes(tickerToValidate)) {
      console.log('Ticker already in list');
      return;
    }

    try {
      const response = await apiClient.get<TickerValidation>(`/tickers/validate/${tickerToValidate}`);
      if (response.data.valid) {
        setTickers([...tickers, tickerToValidate]);
        onTickerAdd(tickerToValidate);
        setTickerInput('');
        console.log(`Added valid ticker: ${tickerToValidate} (${response.data.name})`);
      } else {
        console.log(`Invalid ticker: ${tickerToValidate}`);
      }
    } catch (error) {
      console.log(`Invalid ticker: ${tickerToValidate}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTicker();
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    setTickers(tickers.filter(ticker => ticker !== tickerToRemove));
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
              onKeyPress={handleKeyPress}
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
          <div className="flex flex-col gap-2">
            {tickers.map((ticker) => (
              <div 
                key={ticker}
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm font-medium w-full flex items-center justify-between"
              >
                <span>{ticker}</span>
                <button
                  onClick={() => handleRemoveTicker(ticker)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  ×
                </button>
              </div>
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