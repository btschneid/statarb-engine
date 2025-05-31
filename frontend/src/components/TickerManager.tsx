import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { debugLog, debugError } from '../utils/debug';

interface TickerManagerProps {
  onTickerAdd: (ticker: string) => void;
  onSectorSelect: (sector: string) => void;
  onTickersChange: (tickers: string[]) => void;
  onClearTickers: () => void;
  onFindBestPair: () => void;
  onManualPairSelection: (selectedPair: string[]) => void;
  onRunMetrics: () => void;
  initialTickers?: string[];
  clearTickers?: number;
  bestPairTickers?: string[];
  isRunningMetrics?: boolean;
  isFindingBestPair?: boolean;
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
  onClearTickers,
  onFindBestPair,
  onManualPairSelection,
  onRunMetrics,
  initialTickers = [],
  clearTickers = 0,
  bestPairTickers = [],
  isRunningMetrics = false,
  isFindingBestPair = false,
}) => {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<string[]>(initialTickers);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [loadingSector, setLoadingSector] = useState<string | null>(null);

  // Reset selected tickers when bestPairTickers changes
  useEffect(() => {
    debugLog('🔄 [TickerManager] useEffect: bestPairTickers changed', {
      bestPairTickers,
      clearTickers,
      currentSelectedTickers: selectedTickers
    });
    if (bestPairTickers.length > 0) {
      debugLog('✅ [TickerManager] Setting selected tickers to bestPairTickers:', bestPairTickers);
      setSelectedTickers(bestPairTickers);
    }
  }, [bestPairTickers, clearTickers]);

  // Handle clearing tickers
  useEffect(() => {
    debugLog('🔄 [TickerManager] useEffect: clearTickers changed', {
      clearTickers,
      currentTickers: tickers.length,
      tickersList: tickers
    });
    if (clearTickers > 0) {
      debugLog('🧹 [TickerManager] Clearing all tickers and selections');
      setTickers([]);
      setSelectedTickers([]);
      // Only notify parent if we actually had tickers to clear
      if (tickers.length > 0) {
        debugLog('📤 [TickerManager] Notifying parent of ticker clearance');
        onTickersChange([]);
      }
    }
  }, [clearTickers]);

  // Fetch sectors from backend
  useEffect(() => {
    debugLog('🔄 [TickerManager] useEffect: Fetching sectors from backend');
    apiClient.get<SectorsResponse>('/sectors')
      .then(res => {
        if (res.data && res.data.sectors) {
          debugLog('✅ [TickerManager] Sectors fetched:', res.data.sectors);
          setSectors(res.data.sectors);
        }
      })
      .catch(err => {
        debugError('❌ [TickerManager] Failed to fetch sectors', err);
      });
  }, []);

  // Handle initial tickers
  useEffect(() => {
    debugLog('🔄 [TickerManager] useEffect: initialTickers changed', {
      initialTickers: initialTickers.length,
      initialTickersList: initialTickers,
      currentTickers: tickers.length,
      currentTickersList: tickers
    });
    if (initialTickers.length > 0 && tickers.length === 0) {
      debugLog('🎯 [TickerManager] Setting initial tickers and notifying parent');
      setTickers(initialTickers);
      initialTickers.forEach(ticker => {
        debugLog('📤 [TickerManager] Adding initial ticker:', ticker);
        onTickerAdd(ticker);
      });
    }
  }, [initialTickers]);

  // Notify parent when tickers change (avoid during sector changes)
  useEffect(() => {
    debugLog('🔄 [TickerManager] useEffect: tickers changed', {
      tickersCount: tickers.length,
      tickersList: tickers
    });
    debugLog('📤 [TickerManager] Notifying parent of ticker change');
    onTickersChange(tickers);
  }, [tickers, onTickersChange]);

  const handleAddTicker = async () => {
    debugLog('🎯 [TickerManager] handleAddTicker called with:', tickerInput);
    if (!tickerInput) return;

    const tickerToValidate = tickerInput.toUpperCase();
    debugLog('🔍 [TickerManager] Validating ticker:', tickerToValidate);
    
    // Don't add if already in list
    if (tickers.includes(tickerToValidate)) {
      debugLog('⚠️ [TickerManager] Ticker already in list:', tickerToValidate);
      return;
    }

    try {
      const response = await apiClient.get<TickerValidation>(`/tickers/validate/${tickerToValidate}`);
      if (response.data.valid) {
        debugLog('✅ [TickerManager] Ticker valid, adding to list:', tickerToValidate, '(' + response.data.name + ')');
        setTickers([...tickers, tickerToValidate]);
        onTickerAdd(tickerToValidate);
        setTickerInput('');
      } else {
        debugLog('❌ [TickerManager] Invalid ticker:', tickerToValidate);
      }
    } catch (error) {
      debugError('❌ [TickerManager] Error validating ticker:', tickerToValidate, error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      debugLog('⌨️ [TickerManager] Enter key pressed, adding ticker');
      handleAddTicker();
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    debugLog('🗑️ [TickerManager] Removing ticker:', tickerToRemove);
    const newTickers = tickers.filter(ticker => ticker !== tickerToRemove);
    debugLog('📝 [TickerManager] New ticker list:', newTickers);
    setTickers(newTickers);
  };

  const handleSectorSelect = async (sector: string) => {
    debugLog('🏢 [TickerManager] Sector selected:', sector);
    setLoadingSector(sector);
    try {
      debugLog('🌐 [TickerManager] Fetching tickers for sector:', sector);
      const response = await apiClient.get<SectorTickersResponse>(`/sectors/${sector}/tickers`);
      if (response.data && response.data.tickers) {
        debugLog('✅ [TickerManager] Sector tickers received:', response.data.tickers);
        // Set all tickers at once instead of individual calls
        setTickers(response.data.tickers);
        onSectorSelect(sector);
        // Pass all tickers at once instead of calling onTickerAdd multiple times
        debugLog('📤 [TickerManager] Notifying parent of sector ticker change');
        onTickersChange(response.data.tickers); // This should replace the forEach loop
      }
    } catch (error) {
      debugError('❌ [TickerManager] Failed to fetch tickers for sector', sector, ':', error);
    } finally {
      setLoadingSector(null);
      debugLog('✅ [TickerManager] Sector selection complete for:', sector);
    }
  };

  const handleTickerClick = (ticker: string) => {
    debugLog('👆 [TickerManager] Ticker clicked:', ticker, 'Current selection:', selectedTickers);
    
    let newSelection: string[];
    
    // If we already have a pair selected, start fresh
    if (selectedTickers.length === 2) {
      newSelection = [ticker];
      debugLog('🔄 [TickerManager] Had 2 selected, starting fresh with:', ticker);
    }
    // If we have one selected and it's not the same ticker, add it
    else if (selectedTickers.length === 1 && !selectedTickers.includes(ticker)) {
      newSelection = [...selectedTickers, ticker];
      debugLog('➕ [TickerManager] Adding second ticker, pair:', newSelection);
    }
    // If we have one selected and it's the same ticker, remove it
    else if (selectedTickers.length === 1 && selectedTickers.includes(ticker)) {
      newSelection = [];
      debugLog('➖ [TickerManager] Deselecting ticker, clearing selection');
    }
    // If we have none selected, add it
    else {
      newSelection = [ticker];
      debugLog('🎯 [TickerManager] First ticker selected:', ticker);
    }
    
    debugLog('📊 [TickerManager] Selection changed from', selectedTickers, 'to', newSelection);
    setSelectedTickers(newSelection);
    
    // If we now have a complete pair, notify parent
    if (newSelection.length === 2) {
      debugLog('✅ [TickerManager] Complete pair selected, notifying parent:', newSelection);
      onManualPairSelection(newSelection);
    }
  };

  return (
    <div className="col-span-4 h-full overflow-hidden">
      <div className="flex flex-col gap-3 h-full max-h-full">
        {/* Ticker Input */}
        <div className="flex gap-4 flex-shrink-0">
          <input 
            type="text" 
            placeholder="Enter ticker symbol"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input h-10 flex-1"
          />
          <button 
            onClick={handleAddTicker}
            className="btn btn-success h-10 w-32"
          >
            Add Ticker
          </button>
          <button 
            onClick={onClearTickers}
            className="btn btn-destructive h-10 w-32"
          >
            Clear Ticker List
          </button>
        </div>
        
        {/* Ticker List */}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: 'rgb(var(--color-muted))', borderRadius: '0.375rem', padding: '1rem' }}>
          <div className="flex flex-col gap-2 h-full overflow-y-auto">
            {tickers.map((ticker) => (
              <div 
                key={ticker}
                className={`px-4 py-1.5 rounded-md text-sm font-medium w-full flex items-center justify-between transition-colors flex-shrink-0 ${
                  selectedTickers.includes(ticker)
                    ? 'border-2'
                    : ''
                }`}
                style={{
                  backgroundColor: selectedTickers.includes(ticker) 
                    ? 'rgb(var(--color-success) / 0.1)' 
                    : 'rgb(var(--color-card))',
                  color: selectedTickers.includes(ticker)
                    ? 'rgb(var(--color-success))'
                    : 'rgb(var(--color-card-foreground))',
                  borderColor: selectedTickers.includes(ticker) 
                    ? 'rgb(var(--color-success))' 
                    : 'transparent'
                }}
              >
                <button
                  className="flex-1 text-left transition-colors hover:opacity-80"
                  onClick={() => handleTickerClick(ticker)}
                >
                  {ticker}
                </button>
                <button
                  onClick={() => handleRemoveTicker(ticker)}
                  className="ml-2 transition-colors hover:opacity-80 text-lg"
                  style={{ 
                    color: selectedTickers.includes(ticker)
                      ? 'rgb(var(--color-success))'
                      : 'rgb(var(--color-card-foreground))'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sector Buttons */}
        <div className="flex-shrink-0" style={{ backgroundColor: 'rgb(var(--color-muted))', borderRadius: '0.375rem', padding: '0.75rem' }}>
          <div className="grid grid-cols-2 gap-2">
            {sectors.map((sector) => (
              <button 
                key={sector}
                onClick={() => handleSectorSelect(sector)}
                disabled={loadingSector === sector}
                className={`px-3 py-1.5 rounded-md text-sm font-medium w-full transition-colors hover:opacity-80 ${
                  loadingSector === sector ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  backgroundColor: 'rgb(var(--color-card))',
                  color: 'rgb(var(--color-card-foreground))'
                }}
              >
                {loadingSector === sector ? 'Loading...' : sector}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0" style={{borderRadius: '0.375rem', padding: '0.5rem' }}>
          <div className="flex items-center justify-center gap-4">
            <button
              className="btn btn-success py-3 flex-1 text-lg"
              disabled={selectedTickers.length !== 2 || isRunningMetrics}
              onClick={() => {
                debugLog('Run Metrics clicked:', {
                  bestPairTickers,
                  selectedTickers
                });
                onRunMetrics();
              }}
            >
              {isRunningMetrics ? 'Running Metrics...' : 'Run Metrics on Selected Pair'}
            </button>
            <button 
              onClick={onFindBestPair}
              disabled={isFindingBestPair || tickers.length < 2}
              className={`btn btn-default py-3 flex-1 text-lg ${
                isFindingBestPair || tickers.length < 2
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                border: '2px solid rgb(var(--color-success))',
                color: 'rgb(var(--color-success))'
              }}
            >
              {isFindingBestPair ? 'Finding Best Pair...' : 'Find Best Cointegrated Pair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};