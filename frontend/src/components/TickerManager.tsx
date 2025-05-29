import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface TickerManagerProps {
  onTickerAdd: (ticker: string) => void;
  onSectorSelect: (sector: string) => void;
  onTickersChange: (tickers: string[]) => void;
  initialTickers?: string[];
  clearTickers?: boolean;
  bestPairTickers?: string[];
}

interface TickerValidation {
  valid: boolean;
  name: string;
}

interface SectorsResponse {
  sectors: string[];
}

interface SectorTickersResponse {
  tickers: string[];
}

export const TickerManager: React.FC<TickerManagerProps> = ({
  onTickerAdd,
  onSectorSelect,
  onTickersChange,
  initialTickers = [],
  clearTickers = false,
  bestPairTickers = [],
}) => {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<string[]>(initialTickers);
  const [sectors, setSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);

  // Reset selected tickers when bestPairTickers changes
  useEffect(() => {
    if (bestPairTickers.length > 0 && !clearTickers) {
      setSelectedTickers(bestPairTickers);
    }
  }, [bestPairTickers, clearTickers]);

  // Handle clearing tickers
  useEffect(() => {
    if (clearTickers) {
      setTickers([]);
      setSelectedTickers([]);
      // Only notify parent if we actually had tickers to clear
      if (tickers.length > 0) {
        onTickersChange([]);
      }
    }
  }, [clearTickers]);

  // Fetch sectors from backend
  useEffect(() => {
    apiClient.get<SectorsResponse>('/sectors')
      .then(res => {
        if (res.data && res.data.sectors) {
          setSectors(res.data.sectors);
        }
      })
      .catch(err => {
        console.error('Failed to fetch sectors', err);
      });
  }, []);

  // Handle initial tickers
  useEffect(() => {
    if (initialTickers.length > 0 && tickers.length === 0) {
      setTickers(initialTickers);
      initialTickers.forEach(ticker => {
        onTickerAdd(ticker);
      });
    }
  }, [initialTickers]);

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

  const handleSectorSelect = async (sector: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<SectorTickersResponse>(`/sectors/${sector}/tickers`);
      if (response.data && response.data.tickers) {
        // Clear existing tickers and set new ones
        setTickers(response.data.tickers);
        // Notify parent about sector selection
        onSectorSelect(sector);
        // Notify parent about each new ticker
        response.data.tickers.forEach(ticker => {
          onTickerAdd(ticker);
        });
      }
    } catch (error) {
      console.error(`Failed to fetch tickers for sector ${sector}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTickers(prev => {
      // If we already have a pair selected, start fresh
      if (prev.length === 2) {
        return [ticker];
      }
      // If we have one selected and it's not the same ticker, add it
      if (prev.length === 1 && !prev.includes(ticker)) {
        return [...prev, ticker];
      }
      // If we have one selected and it's the same ticker, remove it
      if (prev.length === 1 && prev.includes(ticker)) {
        return [];
      }
      // If we have none selected, add it
      return [ticker];
    });
  };

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
                className={`px-4 py-2 rounded-md text-sm font-medium w-full flex items-center justify-between ${
                  selectedTickers.includes(ticker)
                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <button
                  className={`flex-1 text-left transition-colors ${
                    selectedTickers.includes(ticker)
                      ? 'hover:text-green-900'
                      : 'hover:text-blue-900'
                  }`}
                  onClick={() => handleTickerClick(ticker)}
                >
                  {ticker}
                </button>
                <button
                  onClick={() => handleRemoveTicker(ticker)}
                  className="text-red-600 hover:text-red-800 transition-colors ml-2"
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
                onClick={() => handleSectorSelect(sector)}
                disabled={isLoading}
                className={`bg-purple-100 text-purple-800 px-3 py-2 rounded-md hover:bg-purple-200 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Run Metrics Button */}
        <div className="bg-gray-100 rounded p-4">
          <button
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={selectedTickers.length !== 2}
            onClick={() => {
              console.log('Run Metrics clicked:', {
                bestPairTickers,
                selectedTickers
              });
            }}
          >
            Run Metrics on Selected Pair
          </button>
        </div>
      </div>
    </div>
  );
};