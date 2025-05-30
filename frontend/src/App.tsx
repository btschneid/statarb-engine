import { useState, useEffect, useRef } from 'react'
import { DateRangeSelector } from './components/DateRangeSelector'
import { TickerManager } from './components/TickerManager'
import { StockGraph } from './components/StockGraph'
import { StatisticsGrid } from './components/StatisticsGrid'
import apiClient from './services/api'
import { debugLog, debugError } from './utils/debug'

interface DateResponse {
  date: string;
}

interface MetricMetadata {
  id: string;
  title: string;
  description: string;
}

interface MetricsResponse {
  metrics: MetricMetadata[];
}

interface SectorTickersResponse {
  tickers: string[];
}

interface RiskMetrics {
  cumulative_return: number;
  annualized_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  var_95: number;
  cvar_95: number;
  profit_factor: number;
  mae: number;
  adf_statistic: number;
  p_value: number;
  hedge_ratio: number;
  half_life_days: number;
  number_of_trades: number;
  win_rate: number;
  mean_duration: number;
  z_score: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

interface BestPairResponse {
  pair: [string, string];
  metrics: Record<string, number>;
  chart_data: ChartDataPoint[];
}

function App() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentTickers, setCurrentTickers] = useState<string[]>([])
  const [displayedTickers, setDisplayedTickers] = useState<string[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [metricsMetadata, setMetricsMetadata] = useState<MetricMetadata[]>([])
  const [statisticsValues, setStatisticsValues] = useState<Record<string, number>>({})
  const [defaultTickers, setDefaultTickers] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [clearTickers, setClearTickers] = useState(false)
  const [prevStartDate, setPrevStartDate] = useState('')
  const [prevEndDate, setPrevEndDate] = useState('')
  const isSectorChange = useRef(false)
  const isFindBestPair = useRef(false)

  // Fetch default sector tickers
  useEffect(() => {
    debugLog('🔄 [App] useEffect: Fetching default sector tickers');
    apiClient.get<SectorTickersResponse>('/default-sector-tickers')
      .then(res => {
        if (res.data && res.data.tickers) {
          debugLog('✅ [App] Default sector tickers fetched:', res.data.tickers);
          setDefaultTickers(res.data.tickers)
        }
      })
      .catch(err => {
        debugError('❌ [App] Failed to fetch default sector tickers', err)
      })
  }, [])

  // Fetch default start date
  useEffect(() => {
    debugLog('🔄 [App] useEffect: Fetching default start date');
    apiClient.get<DateResponse>('/default-start-date')
      .then(res => {
        if (res.data && res.data.date) {
          debugLog('✅ [App] Default start date fetched:', res.data.date);
          setStartDate(res.data.date)
        }
      })
      .catch(err => {
        debugError('❌ [App] Failed to fetch default start date', err)
      })
  }, [])

  // Fetch default end date
  useEffect(() => {
    debugLog('🔄 [App] useEffect: Fetching default end date');
    apiClient.get<DateResponse>('/default-end-date')
      .then(res => {
        if (res.data && res.data.date) {
          debugLog('✅ [App] Default end date fetched:', res.data.date);
          setEndDate(res.data.date)
        }
      })
      .catch(err => {
        debugError('❌ [App] Failed to fetch default end date', err)
      })
  }, [])

  // Fetch metrics metadata
  useEffect(() => {
    debugLog('🔄 [App] useEffect: Fetching metrics metadata');
    apiClient.get<MetricsResponse>('/metrics-list')
      .then(res => {
        if (res.data && res.data.metrics) {
          debugLog('✅ [App] Metrics metadata fetched:', res.data.metrics.length, 'metrics');
          setMetricsMetadata(res.data.metrics)
          // Initialize all statistics with 0
          const initialValues = Object.fromEntries(
            res.data.metrics.map(metric => [metric.id, 0])
          )
          setStatisticsValues(initialValues)
        }
      })
      .catch(err => {
        debugError('❌ [App] Failed to fetch metrics metadata', err)
      })
  }, [])

  // Fetch initial chart data when we have at least 2 tickers
  useEffect(() => {
    debugLog('🔄 [App] useEffect: Chart data dependency change detected', {
      currentTickers: currentTickers.length,
      tickersList: currentTickers,
      startDate,
      endDate,
      currentlyDisplayed: displayedTickers,
      isFindBestPair: isFindBestPair.current
    });
    
    // Skip if we're in the middle of a "Find Best Pair" operation
    if (isFindBestPair.current) {
      debugLog('⏸️ [App] Skipping chart fetch - Find Best Pair operation in progress');
      isFindBestPair.current = false; // Reset flag
      return;
    }
    
    const fetchInitialChartData = async () => {
      if (currentTickers.length >= 2) {
        const tickersToDisplay = currentTickers.slice(0, 2);
        
        // Check if tickers are different from currently displayed
        const isDifferentPair = tickersToDisplay.length !== displayedTickers.length || 
                               tickersToDisplay.some((ticker, index) => ticker !== displayedTickers[index]);
        
        // Check if dates have changed
        const isDifferentDates = startDate !== prevStartDate || endDate !== prevEndDate;
        
        // Fetch if either tickers or dates have changed
        if (isDifferentPair || isDifferentDates) {
          const reason = isDifferentPair ? 'ticker pair changed' : 'dates changed';
          debugLog(`📊 [App] ${reason}, fetching chart data for:`, tickersToDisplay, isDifferentPair ? `(was: ${displayedTickers})` : `(dates: ${prevStartDate} to ${prevEndDate} -> ${startDate} to ${endDate})`);
          try {
            const params = new URLSearchParams();
            tickersToDisplay.forEach(ticker => {
              params.append('tickers', ticker);
            });
            params.append('start', startDate);
            params.append('end', endDate);
    
            const response = await apiClient.get<ChartDataPoint[]>('/chart-data', {
              params: params
            });
            debugLog('✅ [App] Chart data fetched successfully, data points:', response.data.length);
            setChartData(response.data);
            setDisplayedTickers(tickersToDisplay);
            setPrevStartDate(startDate);
            setPrevEndDate(endDate);
          } catch (error) {
            debugError('❌ [App] Error fetching initial chart data:', error);
          }
        } else {
          debugLog('⏸️ [App] No changes detected, skipping chart data fetch:', tickersToDisplay);
        }
      } else {
        debugLog('⏸️ [App] Not enough tickers for chart data (need 2, have', currentTickers.length, ')');
        if (displayedTickers.length > 0) {
          debugLog('🧹 [App] Clearing chart data due to insufficient tickers');
          setChartData(null);
          setDisplayedTickers([]);
        }
      }
    };
  
    fetchInitialChartData();
  }, [currentTickers, startDate, endDate, displayedTickers, prevStartDate, prevEndDate]);

  // Function to update a single statistic value
  const updateStatistic = (id: string, value: number) => {
    setStatisticsValues(prev => ({
      ...prev,
      [id]: value
    }))
  }

  // Function to update multiple statistics at once
  const updateStatistics = (newValues: Record<string, number>) => {
    setStatisticsValues(prev => ({
      ...prev,
      ...newValues
    }))
  }

  const handleTickerAdd = (ticker: string) => {
    debugLog('📥 [App] handleTickerAdd called with:', ticker);
    debugLog('📝 [App] Current tickers before add:', currentTickers);
    setCurrentTickers(prev => {
      const newTickers = [...prev, ticker];
      debugLog('📝 [App] New tickers after add:', newTickers);
      return newTickers;
    });
  };

  const handleTickersChange = (tickers: string[]) => {
    debugLog('🔄 [App] handleTickersChange called with:', tickers);
    debugLog('📝 [App] Previous currentTickers:', currentTickers);
    debugLog('🏢 [App] Is sector change:', isSectorChange.current);
    setCurrentTickers(tickers);
    
    // Reset sector change flag after handling
    if (isSectorChange.current) {
      debugLog('🔄 [App] Resetting sector change flag');
      isSectorChange.current = false;
    }
  };

  const handleSectorSelect = (sector: string) => {
    debugLog('🏢 [App] handleSectorSelect called with:', sector);
    debugLog('🏢 [App] Setting sector change flag to prevent duplicate chart fetches');
    isSectorChange.current = true;
    setSelectedSector(sector)
  }

  // Combine metadata with current values for the StatisticsGrid
  const statistics = metricsMetadata.map(metric => ({
    ...metric,
    value: statisticsValues[metric.id] || 0
  }))

  const handleFindBestPair = async () => {
    debugLog('🔍 [App] handleFindBestPair called with tickers:', currentTickers);
    if (currentTickers.length < 2) {
      debugLog('⚠️ [App] Not enough tickers for best pair analysis');
      return;
    }
  
    setIsLoading(true);
    debugLog('🎯 [App] Starting best pair analysis...');
    try {
      const params = new URLSearchParams();
      
      // Add each ticker correctly
      currentTickers.forEach(ticker => {
        params.append('tickers', ticker);
      });
  
      // Add start and end dates
      params.append('start', startDate);
      params.append('end', endDate);
  
      const response = await apiClient.get<BestPairResponse>('/find-best-pair', {
        params
      });
  
      const { pair, chart_data } = response.data;
      debugLog('✅ [App] Best cointegrated pair found:', pair);
      
      // Set flag to prevent useEffect from overriding our best pair data
      debugLog('�� [App] Setting find best pair flag to prevent useEffect override');
      isFindBestPair.current = true;
  
      setChartData(chart_data);
      setDisplayedTickers(pair);
      debugLog('✅ [App] Successfully updated with best pair data');
    } catch (error) {
      debugError('❌ [App] Error finding best pair:', error);
    } finally {
      setIsLoading(false);
      debugLog('✅ [App] Best pair analysis complete');
    }
  };

  const handleClearTickers = () => {
    debugLog('🧹 [App] handleClearTickers called');
    debugLog('📝 [App] Clearing tickers, chart data, and displayed tickers');
    setCurrentTickers([]);
    setChartData(null);
    setDisplayedTickers([]);
    setClearTickers(true);
    debugLog('✅ [App] Clear operation complete');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Main Grid Container */}
      <div className="grid grid-cols-12 gap-4">
        {/* Row 1 */}
        <div className="col-span-12 grid grid-cols-12 gap-4 mb-4">
          <DateRangeSelector 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          {/* Title */}
          <div className="col-span-4 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Risk Engine Simulator
            </h1>
          </div>

          {/* Buttons Container */}
          <div className="col-span-4 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleFindBestPair}
                disabled={isLoading || currentTickers.length < 2}
                className={`w-full py-3 px-4 rounded-md transition-colors ${
                  isLoading || currentTickers.length < 2
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? 'Loading...' : 'Find Best Cointegrated Pair'}
              </button>
              <button 
                onClick={handleClearTickers}
                className="w-full py-3 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Clear Ticker List
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="col-span-12 grid grid-cols-12 gap-4 mb-4">
          <StockGraph data={chartData} />
          <TickerManager 
            onTickerAdd={handleTickerAdd}
            onSectorSelect={handleSectorSelect}
            onTickersChange={handleTickersChange}
            initialTickers={defaultTickers}
            clearTickers={clearTickers}
            bestPairTickers={displayedTickers}
          />
        </div>

        {/* Row 3 */}
        <StatisticsGrid statistics={statistics} />
      </div>
    </div>
  )
}

export default App
