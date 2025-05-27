import { useState } from 'react'
import { DateRangeSelector } from './components/DateRangeSelector'
import { TickerManager } from './components/TickerManager'
import { StockGraph } from './components/StockGraph'
import { StatisticsGrid } from './components/StatisticsGrid'

function App() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('')

  // Example statistics data
  const statistics = [
    { title: 'Cumulative Return', value: 0, description: 'Total return over the selected period' },
    { title: 'Annualized Return', value: 0, description: 'Return annualized to a yearly rate' },
    // Add more statistics as needed
  ]

  const handleTickerAdd = (ticker: string) => {
    setSelectedTickers([...selectedTickers, ticker])
  }

  const handleSectorSelect = (sector: string) => {
    setSelectedSector(sector)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Main Grid Container */}
      <div className="grid grid-cols-12 gap-4">
        {/* Row 1 */}
        <div className="col-span-12 grid grid-cols-12 gap-4 mb-4">
          <DateRangeSelector 
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
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Find Best Cointegrated Pair
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="col-span-12 grid grid-cols-12 gap-4 mb-4">
          <StockGraph data={null} />
          <TickerManager 
            onTickerAdd={handleTickerAdd}
            onSectorSelect={handleSectorSelect}
          />
        </div>

        {/* Row 3 */}
        <StatisticsGrid statistics={statistics} />
      </div>
    </div>
  )
}

export default App
