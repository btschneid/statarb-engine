import { useState, useEffect, useRef } from 'react'
import { DateRangeSelector } from './components/DateRangeSelector'
import { TickerManager } from './components/TickerManager'
import { StockGraph } from './components/StockGraph'
import { StatisticsGrid } from './components/StatisticsGrid'
import { ThemeToggle } from './components/ThemeToggle'
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
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
      debugLog('🔄 [App] Setting find best pair flag to prevent useEffect override');
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

  const handleOpenHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  return (
    <div className="h-screen flex flex-col p-4" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      {/* Fixed Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Row 1 - Header Section (Fixed Height) */}
      <div className="flex-shrink-0 mb-2">
        <div className="grid grid-cols-12 card p-4">
          <DateRangeSelector 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          {/* Title */}
          <div className="col-span-4 h-full">
            <div className="h-full flex items-center justify-center">
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-foreground))' }}>
                Risk Engine Simulator
              </h1>
            </div>
          </div>

          {/* Buttons Container */}
          <div className="col-span-4 h-full flex items-center">
            <div className="w-full flex justify-center gap-4">
              <button 
                className="px-5 py-3 text-base rounded-lg border-2 hover:opacity-70 transition-opacity"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-foreground))'
                }}
                onClick={handleOpenHelpModal}
              >
                How to Use
              </button>
              
              <button
                className="px-5 py-3 text-base rounded-lg border-2 hover:opacity-70 transition-opacity flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-foreground))'
                }}
                onClick={() => window.open('https://github.com/btschneid/statarb-engine', '_blank')}
                title="View on GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Main Content Section (Flexible Height - Takes remaining space) */}
      <div className="flex-1 mb-2 min-h-0">
        <div className="h-full grid grid-cols-12 gap-4 card p-6 overflow-hidden">
          <StockGraph data={chartData} />
          <TickerManager 
            onTickerAdd={handleTickerAdd}
            onSectorSelect={handleSectorSelect}
            onTickersChange={handleTickersChange}
            onClearTickers={handleClearTickers}
            onFindBestPair={handleFindBestPair}
            initialTickers={defaultTickers}
            clearTickers={clearTickers}
            bestPairTickers={displayedTickers}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Row 3 - Statistics Section (Fixed Height) */}
      <div className="flex-shrink-0">
        <StatisticsGrid statistics={statistics} />
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseHelpModal}
        >
          <div 
            className="relative mx-4 max-w-2xl w-full max-h-[80vh] overflow-auto rounded-lg shadow-2xl"
            style={{ 
              backgroundColor: 'rgb(var(--color-background))',
              border: '1px solid rgb(var(--color-border))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: 'rgb(var(--color-border))' }}
            >
              <h2 
                className="text-2xl font-bold"
                style={{ color: 'rgb(var(--color-foreground))' }}
              >
                Help & How To Use
              </h2>
              <button
                onClick={handleCloseHelpModal}
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: 'rgb(var(--color-muted-foreground))' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Introduction */}
                <div>
                  <h3 
                    className="text-lg font-semibold mb-3"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Welcome to the Risk Engine Simulator
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    This dashboard is designed to test the risk metrics of cointegrated pairs for arbitrage trading strategies in finance. 
                    Analyze historical data, evaluate pair relationships, and assess risk metrics to make informed trading decisions.
                  </p>
                </div>

                {/* How to Use Tickers */}
                <div>
                  <h4 
                    className="text-md font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Working with Ticker Pairs
                  </h4>
                  <ul 
                    className="text-sm space-y-2 list-disc list-inside"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <li><strong>Manual Selection:</strong> Choose any two tickers from your list to analyze their relationship</li>
                    <li><strong>Find Best Pair:</strong> Let the algorithm automatically identify the most cointegrated pair from your ticker list</li>
                    <li><strong>Add Custom Tickers:</strong> Expand your analysis by adding your own ticker symbols to the list</li>
                  </ul>
                </div>

                {/* Date Range */}
                <div>
                  <h4 
                    className="text-md font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Date Range Selection
                  </h4>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    Use the date selectors in the top left to specify your analysis period. The chart will display historical 
                    adjusted close data for your selected ticker pair within this timeframe.
                  </p>
                </div>

                {/* Metrics */}
                <div>
                  <h4 
                    className="text-md font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Risk Metrics Analysis
                  </h4>
                  <p 
                    className="text-sm leading-relaxed mb-2"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    After selecting a pair (either manually or through "Find Best Pair"), you need to click the 
                    <strong> "Run Metrics on Selected Pair"</strong> button to calculate and populate the comprehensive 
                    risk metrics displayed at the bottom of the dashboard.
                  </p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <strong>💡 Tip:</strong> Hover over the info icon (ⓘ) next to any metric to see a detailed explanation of what it measures.
                  </p>
                </div>

                {/* Getting Started */}
                <div>
                  <h4 
                    className="text-md font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Quick Start Guide
                  </h4>
                  <ol 
                    className="text-sm space-y-1 list-decimal list-inside"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <li>Set your desired date range using the date selectors</li>
                    <li>Add tickers or use the default list provided</li>
                    <li>Either select two tickers manually or click "Find Best Pair"</li>
                    <li>Click "Run Metrics on Selected Pair" to calculate risk metrics</li>
                    <li>Review the chart data and populated risk metrics below</li>
                    <li>Hover over metric info icons for detailed explanations</li>
                  </ol>
                </div>

                {/* GitHub Reference */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-muted) / 0.1)',
                    border: '1px solid rgb(var(--color-border))'
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <strong>Want to learn more?</strong> Check out the GitHub repository (button in top-right) for detailed information 
                    on how this Risk Engine Simulator was built, including the algorithms and methodologies used.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
