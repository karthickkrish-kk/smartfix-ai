import React, { useState } from 'react';
import type { CurrencyCode } from '../../types';
import type { MonthlySpendPoint } from '../../utils/calculations';
import { formatCurrency } from '../../utils/calculations';

interface SpendingChartProps {
  data: MonthlySpendPoint[];
  currency: CurrencyCode;
}

export function SpendingChart({ data, currency }: SpendingChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(
    Math.max(0, data.length - 1)
  );

  const maxVal = Math.max(...data.map((d) => d.total), 100);
  const niceMax = Math.ceil(maxVal / 50) * 50;
  const activePoint = data[activeIndex] ?? data[data.length - 1];
  const hasAnySpending = data.some((d) => d.total > 0);

  if (!hasAnySpending) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-[#0F1D33]">
          No spending logged in the last 6 months
        </p>
        <p className="text-xs text-[#64748B] mt-1">
          Record maintenance or repair expenses to visualize monthly trends.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div>
          <span className="text-xs text-[#64748B]">
            Selected month · {activePoint?.label}
          </span>
          <p className="font-mono text-xl font-semibold text-[#0F1D33] tabular-nums mt-0.5">
            {formatCurrency(activePoint?.total ?? 0, currency)}
          </p>
        </div>
        <span className="text-xs text-[#64748B] tabular-nums">
          Peak {formatCurrency(maxVal, currency)}
        </span>
      </div>

      <div
        className="relative h-48 flex items-end justify-between gap-2 sm:gap-3 pt-4 pb-1"
        role="group"
        aria-label="Monthly maintenance spending chart"
      >
        {/* Subtle horizontal reference guidelines */}
        <div
          className="pointer-events-none absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between"
          aria-hidden="true"
        >
          <div className="border-t border-dashed border-[#ECE9E2]" />
          <div className="border-t border-dashed border-[#ECE9E2]" />
          <div className="border-t border-[#E6E3DC]" />
        </div>

        {data.map((point, idx) => {
          const pct = Math.max(
            point.total > 0 ? 8 : 2,
            Math.round((point.total / niceMax) * 100)
          );
          const isSelected = idx === activeIndex;
          return (
            <button
              key={point.monthKey}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onFocus={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
              aria-label={`${point.label}: ${formatCurrency(point.total, currency)}`}
              className="relative z-10 flex-1 flex flex-col items-center justify-end h-full group min-w-[36px]"
            >
              <div className="w-full max-w-[44px] flex-1 flex items-end justify-center pb-2">
                <div
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-lg transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#0D7A7A]'
                      : point.total > 0
                        ? 'bg-[#C7DFDF] group-hover:bg-[#7DB8B8]'
                        : 'bg-[#ECE9E2]'
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-1 tabular-nums transition-colors ${
                  isSelected
                    ? 'font-semibold text-[#0F1D33]'
                    : 'text-[#64748B]'
                }`}
              >
                {point.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
