import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface FilterBarProps {
  filters: any;
  setFilters: (filters: any) => void;
  resultCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, resultCount }) => {
  const propClasses = ['R', 'C', 'V', 'A', 'E', 'O'];

  const toggleClass = (cls: string) => {
    const newClasses = filters.propClasses.includes(cls)
      ? filters.propClasses.filter((c: string) => c !== cls)
      : [...filters.propClasses, cls];
    setFilters({ ...filters, propClasses: newClasses });
  };

  return (
    <div className="bg-[#16191d] border-b border-gray-800 p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by address or owner..."
            className="w-full bg-black/40 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-amber transition-colors"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Class</span>
          <div className="flex bg-black/40 p-1 rounded-lg border border-gray-700">
            {propClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={cn(
                  "w-8 h-8 rounded text-xs font-bold transition-all",
                  filters.propClasses.includes(cls)
                    ? "bg-accent-amber text-black"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={cn(
              "w-4 h-4 rounded border transition-all flex items-center justify-center",
              filters.absenteeOnly ? "bg-accent-amber border-accent-amber" : "border-gray-600 group-hover:border-gray-500"
            )}>
              {filters.absenteeOnly && <div className="w-2 h-2 bg-black rounded-sm" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={filters.absenteeOnly}
              onChange={(e) => setFilters({ ...filters, absenteeOnly: e.target.checked })}
            />
            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Absentee</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={cn(
              "w-4 h-4 rounded border transition-all flex items-center justify-center",
              filters.delinquentOnly ? "bg-distress-red border-distress-red" : "border-gray-600 group-hover:border-gray-500"
            )}>
              {filters.delinquentOnly && <div className="w-2 h-2 bg-black rounded-sm" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={filters.delinquentOnly}
              onChange={(e) => setFilters({ ...filters, delinquentOnly: e.target.checked })}
            />
            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Delinquent</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Value</span>
            <select
              className="bg-black/40 border border-gray-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-accent-amber"
              value={filters.valueRange}
              onChange={(e) => setFilters({ ...filters, valueRange: e.target.value })}
            >
              <option value="all">All Values</option>
              <option value="under300">Under $300k</option>
              <option value="300-600">$300k - $600k</option>
              <option value="600-1.2M">$600k - $1.2M</option>
              <option value="over1.2M">$1.2M+</option>
              <option value="custom">Custom Range</option>
            </select>
            {filters.valueRange === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-20 bg-black/40 border border-gray-700 rounded py-1 px-2 text-[10px] focus:outline-none focus:border-accent-amber"
                  value={filters.customValueMin}
                  onChange={(e) => setFilters({ ...filters, customValueMin: e.target.value })}
                />
                <span className="text-gray-600">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-20 bg-black/40 border border-gray-700 rounded py-1 px-2 text-[10px] focus:outline-none focus:border-accent-amber"
                  value={filters.customValueMax}
                  onChange={(e) => setFilters({ ...filters, customValueMax: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Year</span>
            <select
              className="bg-black/40 border border-gray-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-accent-amber"
              value={filters.yearBuilt}
              onChange={(e) => setFilters({ ...filters, yearBuilt: e.target.value })}
            >
              <option value="any">Any Year</option>
              <option value="pre1970">Pre-1970</option>
              <option value="1970-1990">1970 - 1990</option>
              <option value="1990-2005">1990 - 2005</option>
              <option value="2005plus">2005+</option>
              <option value="custom">Custom Year</option>
            </select>
            {filters.yearBuilt === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-16 bg-black/40 border border-gray-700 rounded py-1 px-2 text-[10px] focus:outline-none focus:border-accent-amber"
                  value={filters.customYearMin}
                  onChange={(e) => setFilters({ ...filters, customYearMin: e.target.value })}
                />
                <span className="text-gray-600">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-16 bg-black/40 border border-gray-700 rounded py-1 px-2 text-[10px] focus:outline-none focus:border-accent-amber"
                  value={filters.customYearMax}
                  onChange={(e) => setFilters({ ...filters, customYearMax: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Permits</span>
            <select
              className="bg-black/40 border border-gray-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-accent-amber"
              value={filters.permitType}
              onChange={(e) => setFilters({ ...filters, permitType: e.target.value })}
            >
              <option value="all">Any Permits</option>
              <option value="hvac">HVAC</option>
              <option value="electrical">Electrical</option>
              <option value="foundation">Foundation</option>
              <option value="plumbing">Plumbing</option>
              <option value="mechanical">Mechanical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-500">Sort</span>
            <select
              className="bg-black/40 border border-gray-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-accent-amber"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="valueDesc">Value: High to Low</option>
              <option value="valueAsc">Value: Low to High</option>
              <option value="yearDesc">Year: Newest First</option>
              <option value="yearAsc">Year: Oldest First</option>
              <option value="distressDesc">Distress: High to Low</option>
              <option value="distressAsc">Distress: Low to High</option>
              <option value="conditionDesc">Condition: High to Low</option>
              <option value="conditionAsc">Condition: Low to High</option>
              <option value="yoyAsc">YoY Change: Low to High</option>
              <option value="yoyDesc">YoY Change: High to Low</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-500">
          Showing <span className="text-accent-amber font-bold">{resultCount}</span> properties
        </div>
      </div>
    </div>
  );
};
