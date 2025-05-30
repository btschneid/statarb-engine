import React, { useRef, useEffect, useState } from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if we're in dark mode by looking at the background color
    const checkTheme = () => {
      const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
      // If background is dark (low RGB values), we're in dark mode
      setIsDarkMode(backgroundColor.includes('0 0 0') || document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    return () => observer.disconnect();
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartDateChange(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndDateChange(e.target.value);
  };

  const openStartDatePicker = () => {
    startDateRef.current?.showPicker?.();
  };

  const openEndDatePicker = () => {
    endDateRef.current?.showPicker?.();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const dateInputStyle = {
    colorScheme: isDarkMode ? 'dark' : 'light',
    backgroundColor: 'rgb(var(--color-background))',
    color: 'rgb(var(--color-foreground))'
  };

  return (
    <div className="col-span-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium" style={{ color: 'rgb(var(--color-muted-foreground))' }}>Start Date</label>
          <div className="relative">
            <input
              ref={startDateRef}
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              style={dateInputStyle}
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || undefined}
            />
            <div 
              className="input flex items-center justify-between cursor-pointer h-8 px-3 text-sm"
              onClick={openStartDatePicker}
            >
              <span style={{ color: startDate ? 'rgb(var(--color-foreground))' : 'rgb(var(--color-muted-foreground))' }}>
                {formatDate(startDate)}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="block text-xs font-medium" style={{ color: 'rgb(var(--color-muted-foreground))' }}>End Date</label>
          <div className="relative">
            <input
              ref={endDateRef}
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              style={dateInputStyle}
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
            />
            <div 
              className="input flex items-center justify-between cursor-pointer h-8 px-3 text-sm"
              onClick={openEndDatePicker}
            >
              <span style={{ color: endDate ? 'rgb(var(--color-foreground))' : 'rgb(var(--color-muted-foreground))' }}>
                {formatDate(endDate)}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 