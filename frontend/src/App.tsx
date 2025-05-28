import { useState, useEffect } from 'react'
import { DateRangeSelector } from './components/DateRangeSelector'
import { TickerManager } from './components/TickerManager'
import { StockGraph } from './components/StockGraph'
import { StatisticsGrid } from './components/StatisticsGrid'
import apiClient from './services/api'

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
  metrics: RiskMetrics;
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

  // Fetch default sector tickers
  useEffect(() => {
    apiClient.get<SectorTickersResponse>('/default-sector-tickers')
      .then(res => {
        if (res.data && res.data.tickers) {
          setDefaultTickers(res.data.tickers)
        }
      })
      .catch(err => {
        console.error('Failed to fetch default sector tickers', err)
      })
  }, [])

  // Fetch default start date
  useEffect(() => {
    apiClient.get<DateResponse>('/default-start-date')
      .then(res => {
        if (res.data && res.data.date) {
          setStartDate(res.data.date)
        }
      })
      .catch(err => {
        console.error('Failed to fetch default start date', err)
      })
  }, [])

  // Fetch default end date
  useEffect(() => {
    apiClient.get<DateResponse>('/default-end-date')
      .then(res => {
        if (res.data && res.data.date) {
          setEndDate(res.data.date)
        }
      })
      .catch(err => {
        console.error('Failed to fetch default end date', err)
      })
  }, [])

  // Fetch metrics metadata
  useEffect(() => {
    apiClient.get<MetricsResponse>('/metrics-list')
      .then(res => {
        if (res.data && res.data.metrics) {
          setMetricsMetadata(res.data.metrics)
          // Initialize all statistics with 0
          const initialValues = Object.fromEntries(
            res.data.metrics.map(metric => [metric.id, 0])
          )
          setStatisticsValues(initialValues)
        }
      })
      .catch(err => {
        console.error('Failed to fetch metrics metadata', err)
      })
  }, [])

  // Fetch initial chart data when we have at least 2 tickers
  useEffect(() => {
    const fetchInitialChartData = async () => {
      if (currentTickers.length >= 2) {
        try {
          const params = new URLSearchParams();
          const tickersToDisplay = currentTickers.slice(0, 2);
          tickersToDisplay.forEach(ticker => {
            params.append('tickers', ticker);
          });
          params.append('start', startDate);
          params.append('end', endDate);
  
          const response = await apiClient.get<ChartDataPoint[]>('/chart-data', {
            params: params
          });
          setChartData(response.data);
          setDisplayedTickers(tickersToDisplay);
        } catch (error) {
          console.error('Error fetching initial chart data:', error);
        }
      }
    };
  
    fetchInitialChartData();
  }, [currentTickers, startDate, endDate]);

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
    setCurrentTickers(prev => [...prev, ticker]);
  };

  const handleTickersChange = (tickers: string[]) => {
    setCurrentTickers(tickers);
    
    // If we removed a ticker that was being displayed, update the chart
    if (displayedTickers.some(ticker => !tickers.includes(ticker))) {
      const newDisplayedTickers = tickers.slice(0, 2);
      if (newDisplayedTickers.length >= 2) {
        const params = new URLSearchParams();
        newDisplayedTickers.forEach(ticker => {
          params.append('tickers', ticker);
        });
        params.append('start', startDate);
        params.append('end', endDate);

        apiClient.get<ChartDataPoint[]>('/chart-data', {
          params: params
        })
        .then(response => {
          setChartData(response.data);
          setDisplayedTickers(newDisplayedTickers);
        })
        .catch(error => {
          console.error('Error updating chart data:', error);
        });
      } else {
        // If we don't have enough tickers, clear the chart
        setChartData(null);
        setDisplayedTickers([]);
      }
    }
  };

  const handleSectorSelect = (sector: string) => {
    setSelectedSector(sector)
  }

  // Combine metadata with current values for the StatisticsGrid
  const statistics = metricsMetadata.map(metric => ({
    ...metric,
    value: statisticsValues[metric.id] || 0
  }))

  const handleFindBestPair = async () => {
    if (currentTickers.length < 2) {
      console.log('Please select at least 2 tickers');
      return;
    }
  
    setIsLoading(true);
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
  
      const { pair, metrics, chart_data } = response.data;
      console.log('Best cointegrated pair:', pair);
  
      setStatisticsValues({
        cumulative_return: metrics.cumulative_return,
        annualized_return: metrics.annualized_return,
        sharpe_ratio: metrics.sharpe_ratio,
        sortino_ratio: metrics.sortino_ratio,
        calmar_ratio: metrics.calmar_ratio,
        max_drawdown: metrics.max_drawdown,
        var_95: metrics.var_95,
        cvar_95: metrics.cvar_95,
        profit_factor: metrics.profit_factor,
        mae: metrics.mae,
        adf_statistic: metrics.adf_statistic,
        p_value: metrics.p_value,
        hedge_ratio: metrics.hedge_ratio,
        half_life_days: metrics.half_life_days,
        number_of_trades: metrics.number_of_trades,
        win_rate: metrics.win_rate,
        mean_duration: metrics.mean_duration,
        z_score: metrics.z_score
      });
  
      setChartData(chart_data);
      setDisplayedTickers(pair);
      console.log('Successfully updated with best pair data');
    } catch (error) {
      console.error('Error finding best pair:', error);
    } finally {
      setIsLoading(false);
    }
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

          {/* Find Best Pair Button */}
          <div className="col-span-4 bg-white rounded-lg shadow p-4">
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
          />
        </div>

        {/* Row 3 */}
        <StatisticsGrid statistics={statistics} />
      </div>
    </div>
  )
}

export default App
