import React, { useState } from 'react';
import Datepicker from "tailwind-datepicker-react";

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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleStartDateChange = (selectedDate: Date) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onStartDateChange(formattedDate);
  };

  const handleEndDateChange = (selectedDate: Date) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onEndDateChange(formattedDate);
  };

  const startDatePickerOptions = {
    title: "Select Start Date",
    autoHide: true,
    todayBtn: true,
    clearBtn: true,
    clearBtnText: "Clear",
    maxDate: endDate ? new Date(endDate) : new Date("2030-01-01"),
    minDate: new Date("2020-01-01"),
    theme: {
      background: "bg-white dark:bg-gray-800",
      todayBtn: "bg-blue-500 hover:bg-blue-600 text-white",
      clearBtn: "bg-gray-500 hover:bg-gray-600 text-white",
      icons: "text-gray-600 dark:text-gray-400",
      text: "text-gray-700 dark:text-white",
      disabledText: "text-gray-400",
      input: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      inputIcon: "text-gray-500",
      selected: "bg-blue-500 text-white",
    },
    icons: {
      prev: () => <span className="text-gray-600">‹</span>,
      next: () => <span className="text-gray-600">›</span>,
    },
    datepickerClassNames: "top-12 z-50",
    defaultDate: startDate ? new Date(startDate) : new Date(),
    language: "en",
    inputNameProp: "startDate",
    inputIdProp: "startDate",
    inputPlaceholderProp: "Select start date",
    inputDateFormatProp: {
      day: "numeric" as const,
      month: "short" as const,
      year: "numeric" as const
    }
  };

  const endDatePickerOptions = {
    title: "Select End Date",
    autoHide: true,
    todayBtn: true,
    clearBtn: true,
    clearBtnText: "Clear",
    maxDate: new Date("2030-01-01"),
    minDate: startDate ? new Date(startDate) : new Date("2020-01-01"),
    theme: {
      background: "bg-white dark:bg-gray-800",
      todayBtn: "bg-blue-500 hover:bg-blue-600 text-white",
      clearBtn: "bg-gray-500 hover:bg-gray-600 text-white",
      icons: "text-gray-600 dark:text-gray-400",
      text: "text-gray-700 dark:text-white",
      disabledText: "text-gray-400",
      input: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      inputIcon: "text-gray-500",
      selected: "bg-blue-500 text-white",
    },
    icons: {
      prev: () => <span className="text-gray-600">‹</span>,
      next: () => <span className="text-gray-600">›</span>,
    },
    datepickerClassNames: "top-12 z-50",
    defaultDate: endDate ? new Date(endDate) : new Date(),
    language: "en",
    inputNameProp: "endDate",
    inputIdProp: "endDate",
    inputPlaceholderProp: "Select end date",
    inputDateFormatProp: {
      day: "numeric" as const,
      month: "short" as const,
      year: "numeric" as const
    }
  };

  return (
    <div className="col-span-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-foreground))' }}>Date Range</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'rgb(var(--color-muted-foreground))' }}>Start Date</label>
          <Datepicker
            options={startDatePickerOptions}
            onChange={handleStartDateChange}
            show={showStartPicker}
            setShow={setShowStartPicker}
          >
            <div className="relative">
              <input
                type="text"
                className="input cursor-pointer"
                placeholder="Select start date"
                value={startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                onFocus={() => setShowStartPicker(true)}
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Datepicker>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'rgb(var(--color-muted-foreground))' }}>End Date</label>
          <Datepicker
            options={endDatePickerOptions}
            onChange={handleEndDateChange}
            show={showEndPicker}
            setShow={setShowEndPicker}
          >
            <div className="relative">
              <input
                type="text"
                className="input cursor-pointer"
                placeholder="Select end date"
                value={endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                onFocus={() => setShowEndPicker(true)}
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-muted-foreground))' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Datepicker>
        </div>
      </div>
    </div>
  );
}; 