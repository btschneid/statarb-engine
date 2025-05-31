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
  // Row 1: Relationship & Stationarity
  hedge_ratio: number;
  cointegration_adf_stat: number;
  cointegration_p_value: number;
  spread_adf_stat: number;
  spread_adf_p_value: number;
  mean_reversion_half_life_days: number;
  spread_std_dev: number;
  
  // Row 2: Spread Performance & Risk Metrics
  spread_z_score: number;
  spread_cumulative_return: number;
  spread_annualized_return: number;
  spread_sharpe_ratio: number;
  spread_sortino_ratio: number;
  spread_calmar_ratio: number;
  spread_max_drawdown: number;
  
  // Row 3: Trade Stats & Tail Risk
  spread_var_95: number;
  spread_cvar_95: number;
  spread_profit_factor: number;
  spread_mae: number;
  num_trades: number;
  win_rate: number;
  mean_trade_duration_days: number;
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
  const [isRunningMetrics, setIsRunningMetrics] = useState(false)
  const [isFindingBestPair, setIsFindingBestPair] = useState(false)
  const [clearTickers, setClearTickers] = useState(0)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

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

  // Simple function to fetch chart data for a specific pair
  const fetchChartData = async (tickers: string[], start: string, end: string) => {
    if (tickers.length !== 2 || !start || !end) {
      debugLog('⏸️ [App] fetchChartData: Invalid parameters', { tickers, start, end });
      return;
    }

    debugLog('📊 [App] fetchChartData: Fetching data for', tickers, 'from', start, 'to', end);
    
    try {
      const params = new URLSearchParams();
      tickers.forEach(ticker => {
        params.append('tickers', ticker);
      });
      params.append('start', start);
      params.append('end', end);

      const response = await apiClient.get<ChartDataPoint[]>('/chart-data', {
        params: params
      });
      
      debugLog('✅ [App] fetchChartData: Success, data points:', response.data.length);
      setChartData(response.data);
      setDisplayedTickers(tickers);
    } catch (error) {
      debugError('❌ [App] fetchChartData: Error:', error);
    }
  };

  // Handle when user manually selects a pair
  const handleManualPairSelection = (selectedPair: string[]) => {
    debugLog('👆 [App] handleManualPairSelection called with:', selectedPair);
    if (selectedPair.length === 2) {
      fetchChartData(selectedPair, startDate, endDate);
    }
  };

  // Handle date changes - refetch if we have a displayed pair
  const handleStartDateChange = (newStartDate: string) => {
    debugLog('📅 [App] Start date changed to:', newStartDate);
    setStartDate(newStartDate);
    if (displayedTickers.length === 2) {
      fetchChartData(displayedTickers, newStartDate, endDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    debugLog('📅 [App] End date changed to:', newEndDate);
    setEndDate(newEndDate);
    if (displayedTickers.length === 2) {
      fetchChartData(displayedTickers, startDate, newEndDate);
    }
  };

  // Handle running risk metrics on selected pair
  const handleRunMetrics = async () => {
    if (displayedTickers.length !== 2) {
      debugError('❌ [App] Cannot run metrics: Need exactly 2 displayed tickers, have:', displayedTickers.length);
      return;
    }

    debugLog('📊 [App] Running risk metrics for pair:', displayedTickers);
    setIsRunningMetrics(true);

    try {
      const params = new URLSearchParams();
      displayedTickers.forEach(ticker => {
        params.append('tickers', ticker);
      });
      params.append('start', startDate);
      params.append('end', endDate);

      const response = await apiClient.get<RiskMetrics>('/risk-metrics', {
        params: params
      });

      debugLog('✅ [App] Risk metrics received:', response.data);
      
      // Update all statistics with the new values
      const metricsAsRecord = Object.fromEntries(
        Object.entries(response.data).map(([key, value]) => [key, Number(value)])
      );
      updateStatistics(metricsAsRecord);
      
    } catch (error) {
      debugError('❌ [App] Error fetching risk metrics:', error);
    } finally {
      setIsRunningMetrics(false);
    }
  };

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
    setCurrentTickers(tickers);
  };

  const handleSectorSelect = (sector: string) => {
    debugLog('🏢 [App] handleSectorSelect called with:', sector);
    setSelectedSector(sector)
  };

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
  
    setIsFindingBestPair(true);
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
      
      // Update chart data and displayed tickers directly from the response
      setChartData(chart_data);
      setDisplayedTickers(pair);
      debugLog('✅ [App] Successfully updated with best pair data');
    } catch (error) {
      debugError('❌ [App] Error finding best pair:', error);
    } finally {
      setIsFindingBestPair(false);
      debugLog('✅ [App] Best pair analysis complete');
    }
  };

  const handleClearTickers = () => {
    debugLog('🧹 [App] handleClearTickers called');
    debugLog('📝 [App] Clearing tickers, chart data, and displayed tickers');
    setCurrentTickers([]);
    setChartData(null);
    setDisplayedTickers([]);
    setClearTickers(prev => prev + 1);
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

      {/* Row 1 - Header Section (Compact, can shrink when zoomed) */}
      <div className="flex-shrink mb-2 min-h-[80px]">
        <div className="grid grid-cols-12 card p-3">
          <DateRangeSelector 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />

          {/* Title */}
          <div className="col-span-4 h-full">
            <div className="h-full flex items-center justify-center">
              <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'rgb(var(--color-foreground))' }}>
                Risk Engine Simulator
              </h1>
            </div>
          </div>

          {/* Buttons Container */}
          <div className="col-span-4 h-full flex items-center">
            <div className="w-full flex justify-center gap-2 lg:gap-4">
              <button 
                className="px-3 lg:px-5 py-2 lg:py-3 text-sm lg:text-base rounded-lg border-2 hover:opacity-70 transition-opacity"
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
                className="px-3 lg:px-5 py-2 lg:py-3 text-sm lg:text-base rounded-lg border-2 hover:opacity-70 transition-opacity flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-foreground))'
                }}
                onClick={() => window.open('https://github.com/btschneid/statarb-engine', '_blank')}
                title="View on GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Main Content Section (Priority - Gets most space and maintains minimum size) */}
      <div className="flex-1 mb-2 min-h-[400px]">
        <div className="h-full grid grid-cols-12 gap-4 card p-4 lg:p-6 overflow-hidden">
          <StockGraph data={chartData} />
          <TickerManager 
            onTickerAdd={handleTickerAdd}
            onSectorSelect={handleSectorSelect}
            onTickersChange={handleTickersChange}
            onClearTickers={handleClearTickers}
            onFindBestPair={handleFindBestPair}
            onManualPairSelection={handleManualPairSelection}
            onRunMetrics={handleRunMetrics}
            initialTickers={defaultTickers}
            clearTickers={clearTickers}
            bestPairTickers={displayedTickers}
            isRunningMetrics={isRunningMetrics}
            isFindingBestPair={isFindingBestPair}
          />
        </div>
      </div>

      {/* Row 3 - Statistics Section (Can shrink, but maintains readability) */}
      <div className="flex-shrink min-h-[120px]">
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
            className="relative mx-4 max-w-4xl w-full max-h-[80vh] overflow-auto rounded-lg shadow-2xl"
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
                    className="text-xl font-semibold mb-3"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    Welcome to the Pair Trading & Cointegration Analyzer
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    This dashboard analyzes <strong>cointegrated pairs</strong> of stocks for <strong>statistical arbitrage</strong> trading strategies. 
                    Learn how to identify when two stocks move together in a predictable way and profit from temporary deviations.
                  </p>
                </div>

                {/* What is Cointegration */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    🔗 What is Cointegration?
                  </h4>
                  <div 
                    className="text-base leading-relaxed space-y-2"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <p>
                      <strong>Cointegration</strong> occurs when two stocks move together over the long term, even though their individual prices may wander around. 
                      Think of it like two people walking their dogs on leashes connected by an elastic band:
                    </p>
                    <div 
                      className="p-3 rounded-lg"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-muted) / 0.1)',
                        border: '1px solid rgb(var(--color-border))'
                      }}
                    >
                      <p className="text-sm">
                        🚶‍♂️---🔗---🚶‍♀️<br/>
                        <strong>Analogy:</strong> The people (stocks) can drift apart temporarily, but the elastic band (economic relationship) 
                        always pulls them back together. The further apart they get, the stronger the pull back becomes.
                      </p>
                    </div>
                    <p>
                      <strong>Examples of cointegrated pairs:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>McDonald's & Burger King (same industry, similar business models)</li>
                      <li>Coca-Cola & PepsiCo (direct competitors)</li>
                      <li>Gold mining stocks (all affected by gold prices)</li>
                    </ul>
                  </div>
                </div>

                {/* The Arbitrage Opportunity */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    💰 The Arbitrage Opportunity
                  </h4>
                  <div 
                    className="text-base leading-relaxed space-y-2"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <p>
                      <strong>Statistical arbitrage</strong> exploits temporary mispricings between cointegrated stocks. Here's how:
                    </p>
                    
                    <div 
                      className="p-4 rounded-lg space-y-3"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-muted) / 0.1)',
                        border: '1px solid rgb(var(--color-border))'
                      }}
                    >
                      <div>
                        <strong>📈 Step 1: Calculate the "Spread"</strong>
                        <p className="text-sm mt-1">
                          Spread = Stock A Price - (Hedge Ratio × Stock B Price)<br/>
                          The hedge ratio tells us how many shares of B to short for each share of A we buy.
                        </p>
                      </div>
                      
                      <div>
                        <strong>📊 Step 2: Monitor Spread Deviations</strong>
                        <p className="text-sm mt-1">
                          Normally: Spread ≈ Historical Average ± Small Fluctuation<br/>
                          Opportunity: Spread = Way Above or Below Average (2+ standard deviations)
                        </p>
                      </div>
                      
                      <div>
                        <strong>🎯 Step 3: Execute the Trade</strong>
                        <div className="text-sm mt-1 space-y-1">
                          <p><strong>When spread is HIGH:</strong> Stock A is "expensive" relative to B</p>
                          <p>→ SHORT Stock A, BUY Stock B (bet the spread will decrease)</p>
                          <p><strong>When spread is LOW:</strong> Stock A is "cheap" relative to B</p>
                          <p>→ BUY Stock A, SHORT Stock B (bet the spread will increase)</p>
                        </div>
                      </div>
                      
                      <div>
                        <strong>💸 Step 4: Profit from Mean Reversion</strong>
                        <p className="text-sm mt-1">
                          As the spread returns to its historical average, you profit from the convergence. 
                          Close both positions when the spread normalizes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Process Example */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    📈 Visual Example: KO vs PEP
                  </h4>
                  <div 
                    className="p-4 rounded-lg"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-muted) / 0.1)',
                      border: '1px solid rgb(var(--color-border))'
                    }}
                  >
                    <div className="text-sm space-y-2" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                      <div>
                        <strong>Timeline Visualization:</strong>
                      </div>
                      <div className="font-mono text-sm">
                        Time:    Jan    Feb    Mar    Apr    May<br/>
                        KO:      $60 → $62 → $58 → $61 → $60<br/>
                        PEP:     $65 → $64 → $66 → $63 → $65<br/>
                        Spread:   -5  →  -2  →  -8  →  -2  →  -5
                      </div>
                      <div>
                        <strong>🔥 Trading Opportunity in March:</strong><br/>
                        • Spread = -8 (way below normal -5)<br/>
                        • Action: BUY KO, SHORT PEP<br/>
                        • Reasoning: KO is unusually cheap vs PEP<br/>
                        • Result: In April, spread reverts to -2, you profit!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Explained */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    🔍 Key Metrics to Watch
                  </h4>
                  <div 
                    className="text-base space-y-2"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <div>
                      <strong>• Cointegration P-Value:</strong> &lt; 0.05 = Strong cointegration (good for trading)
                    </div>
                    <div>
                      <strong>• Spread Z-Score:</strong> ±2 or higher = Trading signal (spread is far from mean)
                    </div>
                    <div>
                      <strong>• Half-Life:</strong> How many days for spread to revert halfway (shorter = better)
                    </div>
                    <div>
                      <strong>• Hedge Ratio:</strong> How many shares of stock B to trade per share of stock A
                    </div>
                  </div>
                </div>

                {/* How to Use This Tool */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'rgb(var(--color-foreground))' }}
                  >
                    🛠️ How to Use This Dashboard
                  </h4>
                  <ol 
                    className="text-base space-y-1 list-decimal list-inside"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <li>Set your analysis period using the date selectors</li>
                    <li>Add tickers or use the default sector-based lists</li>
                    <li><strong>Find Best Pair:</strong> Algorithm identifies the most cointegrated pair</li>
                    <li><strong>Or manually select</strong> two tickers to analyze</li>
                    <li><strong>Run Metrics:</strong> Calculate all risk and cointegration metrics</li>
                    <li><strong>Analyze results:</strong> Look for low p-values, reasonable half-life, good Sharpe ratios</li>
                    <li><strong>Monitor Z-Score:</strong> Values beyond ±2 indicate potential trading opportunities</li>
                  </ol>
                </div>

                {/* Risk Warning */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-0.5">⚠️</span>
                    <div>
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Risk Disclaimer</h5>
                      <p 
                        className="text-sm leading-relaxed text-yellow-700 dark:text-yellow-300"
                      >
                        <strong>This is for educational purposes only.</strong> Pair trading involves significant risks including:
                        model breakdown, execution risk, and market volatility. Cointegration relationships can disappear over time.
                        Always conduct thorough research and consider your risk tolerance before trading.
                      </p>
                    </div>
                  </div>
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
                    className="text-base"
                    style={{ color: 'rgb(var(--color-muted-foreground))' }}
                  >
                    <strong>🔗 Want to dive deeper?</strong> Check out the GitHub repository (button in top-right) for the complete 
                    mathematical implementation, including OLS regression, ADF tests, and all 18 risk metrics calculations.
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
