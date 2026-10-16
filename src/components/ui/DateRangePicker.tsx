import React, { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns';
import { Calendar } from 'lucide-react';
import { formatDateInput } from '../../lib/formatters';

export type PresetRange = 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRange {
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('this_month');

  const applyPreset = (preset: PresetRange) => {
    setSelectedPreset(preset);
    const now = new Date();

    if (preset === 'this_month') {
      onChange({
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    } else if (preset === 'last_month') {
      const prev = subMonths(now, 1);
      onChange({
        startDate: format(startOfMonth(prev), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(prev), 'yyyy-MM-dd'),
      });
    } else if (preset === 'this_year') {
      onChange({
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfYear(now), 'yyyy-MM-dd'),
      });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Preset Buttons */}
      <div className="inline-flex rounded-lg border border-border bg-white p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => applyPreset('this_month')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedPreset === 'this_month'
              ? 'bg-[#FF8C00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last_month')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedPreset === 'last_month'
              ? 'bg-[#FF8C00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Last Month
        </button>
        <button
          type="button"
          onClick={() => applyPreset('this_year')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedPreset === 'this_year'
              ? 'bg-[#FF8C00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          This Year
        </button>
        <button
          type="button"
          onClick={() => setSelectedPreset('custom')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedPreset === 'custom'
              ? 'bg-[#FF8C00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Date Inputs if Custom */}
      {selectedPreset === 'custom' && (
        <div className="flex items-center gap-2 animate-in fade-in">
          <div className="relative">
            <input
              type="date"
              value={formatDateInput(value.startDate)}
              onChange={e => onChange({ ...value, startDate: e.target.value })}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-neutral-800 shadow-sm focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
            />
          </div>
          <span className="text-xs text-neutral-400 font-medium">to</span>
          <div className="relative">
            <input
              type="date"
              value={formatDateInput(value.endDate)}
              onChange={e => onChange({ ...value, endDate: e.target.value })}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-neutral-800 shadow-sm focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
