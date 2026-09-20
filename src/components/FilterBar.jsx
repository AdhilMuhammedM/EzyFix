import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, ArrowUpDown, HelpCircle, Check } from 'lucide-react';
import { SERVICES, AREAS, SORT_MODES, TRUST_LEVELS, SKILL_LEVELS } from '../lib/config.js';

export default function FilterBar({
  filters,
  onFilterChange,
  onOpenHowRankingWorks,
}) {
  const [showExtraFilters, setShowExtraFilters] = useState(false);

  const currentSort = SORT_MODES.find((s) => s.id === filters.sort) || SORT_MODES[0];

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.service && filters.service !== 'all') ||
    Boolean(filters.area && filters.area !== 'all') ||
    Boolean(filters.trustBadge && filters.trustBadge !== 'all') ||
    Boolean(filters.minSkillLevel && filters.minSkillLevel !== 'all') ||
    Boolean(filters.availableNow);

  const clearFilters = () => {
    onFilterChange({
      search: '',
      service: 'all',
      area: 'all',
      trustBadge: 'all',
      minSkillLevel: 'all',
      availableNow: false,
      sort: 'best',
    });
  };

  return (
    <div className="bg-white border-b border-[#E6E6E0] p-4 space-y-3.5 shadow-sm">
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="search-input" className="sr-only">Search professional by name</label>
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="search-input"
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Search professional by name..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072339]/20 focus:border-[#072339] text-[#072339] placeholder-gray-400"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Service Pills (Scrollable horizontally) */}
      <div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, service: 'all' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              !filters.service || filters.service === 'all'
                ? 'bg-[#072339] text-white border-[#072339]'
                : 'bg-[#F8F8F6] text-[#072339] border-[#E6E6E0] hover:bg-gray-100'
            }`}
          >
            All services
          </button>
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onFilterChange({ ...filters, service: s })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                filters.service === s
                  ? 'bg-[#072339] text-white border-[#072339]'
                  : 'bg-[#F8F8F6] text-[#072339] border-[#E6E6E0] hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Row: Area Select + Available Now Toggle + Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor="area-select" className="sr-only">Filter by area</label>
          <select
            id="area-select"
            value={filters.area || 'all'}
            onChange={(e) => onFilterChange({ ...filters, area: e.target.value })}
            className="w-full text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg px-2.5 py-2 text-[#072339] focus:outline-none focus:ring-1 focus:ring-[#072339]"
          >
            <option value="all">All areas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Available now button */}
        <button
          type="button"
          onClick={() => onFilterChange({ ...filters, availableNow: !filters.availableNow })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            filters.availableNow
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
              : 'bg-[#F8F8F6] text-[#072339] border-[#E6E6E0] hover:bg-gray-100'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              filters.availableNow ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span>Available now</span>
        </button>

        {/* Extra filters toggle */}
        <button
          type="button"
          onClick={() => setShowExtraFilters(!showExtraFilters)}
          className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
            showExtraFilters || filters.trustBadge !== 'all' || filters.minSkillLevel !== 'all'
              ? 'bg-[#072339] text-white border-[#072339]'
              : 'bg-[#F8F8F6] text-[#072339] border-[#E6E6E0] hover:bg-gray-100'
          }`}
          title="More filters"
          aria-label="More filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Extra Filters (Trust & Skill level) */}
      {showExtraFilters && (
        <div className="p-3 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="trust-select" className="block text-[11px] font-semibold text-[#072339] mb-1">
                Trust badge
              </label>
              <select
                id="trust-select"
                value={filters.trustBadge || 'all'}
                onChange={(e) => onFilterChange({ ...filters, trustBadge: e.target.value })}
                className="w-full text-xs bg-white border border-[#E6E6E0] rounded-md px-2 py-1.5 text-[#072339] focus:outline-none"
              >
                <option value="all">Any trust badge</option>
                {TRUST_LEVELS.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="skill-select" className="block text-[11px] font-semibold text-[#072339] mb-1">
                Min skill level
              </label>
              <select
                id="skill-select"
                value={filters.minSkillLevel !== undefined ? filters.minSkillLevel : 'all'}
                onChange={(e) => onFilterChange({ ...filters, minSkillLevel: e.target.value })}
                className="w-full text-xs bg-white border border-[#E6E6E0] rounded-md px-2 py-1.5 text-[#072339] focus:outline-none"
              >
                <option value="all">Any skill level</option>
                <option value="0">Starter (0+ pts)</option>
                <option value="1">Skilled (1+ pt)</option>
                <option value="2">Expert (2+ pts)</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-red-600 hover:underline font-medium"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort Row */}
      <div className="pt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#072339]/80 font-medium">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
          <span>Sort by:</span>
        </div>
        <label htmlFor="sort-select" className="sr-only">Sort professionals</label>
        <select
          id="sort-select"
          value={filters.sort || 'best'}
          onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
          className="text-xs font-semibold bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg px-2.5 py-1.5 text-[#072339] focus:outline-none focus:ring-1 focus:ring-[#072339]"
        >
          {SORT_MODES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Hint & "How ranking works" Sheet Link */}
      <div className="bg-[#F8F8F6] p-2 rounded-lg border border-[#E6E6E0]/80 flex items-start gap-2 text-xs">
        <p className="flex-1 text-[11px] text-[#072339]/80 leading-relaxed">
          Ranked by {currentSort.label}. Free pros listed below in alphabetical order.
        </p>
        <button
          type="button"
          onClick={onOpenHowRankingWorks}
          className="text-[11px] font-semibold text-[#072339] hover:text-amber-600 underline whitespace-nowrap flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber" />
          <span>How ranking works</span>
        </button>
      </div>
    </div>
  );
}
