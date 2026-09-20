import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar.jsx';
import ProCard from '../components/ProCard.jsx';
import HowRankingWorksModal from '../components/HowRankingWorksModal.jsx';
import { listPros, listRawVouchesForPro, listRawQualificationsForPro } from '../data/repo.js';
import { enrichPro, filterPros, sortPros } from '../lib/scoring.js';
import { SearchX } from 'lucide-react';

export default function Find() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prosWithStats, setProsWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHowModalOpen, setIsHowModalOpen] = useState(false);

  // Extract filters from URL query parameters
  const filters = useMemo(() => ({
    search: searchParams.get('q') || '',
    service: searchParams.get('service') || 'all',
    area: searchParams.get('area') || 'all',
    trustBadge: searchParams.get('trust') || 'all',
    minSkillLevel: searchParams.get('minSkill') !== null ? searchParams.get('minSkill') : 'all',
    availableNow: searchParams.get('available') === 'true',
    sort: searchParams.get('sort') || 'best',
  }), [searchParams]);

  // Update URL search parameters when filters change
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.service && newFilters.service !== 'all') params.set('service', newFilters.service);
    if (newFilters.area && newFilters.area !== 'all') params.set('area', newFilters.area);
    if (newFilters.trustBadge && newFilters.trustBadge !== 'all') params.set('trust', newFilters.trustBadge);
    if (newFilters.minSkillLevel !== undefined && newFilters.minSkillLevel !== '' && newFilters.minSkillLevel !== 'all') {
      params.set('minSkill', newFilters.minSkillLevel);
    }
    if (newFilters.availableNow) params.set('available', 'true');
    if (newFilters.sort && newFilters.sort !== 'best') params.set('sort', newFilters.sort);

    setSearchParams(params);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const rawPros = await listPros();

      // Enrich each pro with computed trust, skill, and score
      const enriched = await Promise.all(
        rawPros.map(async (p) => {
          const vouches = await listRawVouchesForPro(p.id);
          const quals = await listRawQualificationsForPro(p.id);
          return enrichPro(p, vouches, quals);
        })
      );

      setProsWithStats(enriched);
    } catch (err) {
      console.error('Error loading pros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort pros
  const displayedPros = useMemo(() => {
    const filtered = filterPros(prosWithStats, filters);
    return sortPros(filtered, filters.sort);
  }, [prosWithStats, filters]);

  const proPros = useMemo(() => displayedPros.filter((p) => p.isPro), [displayedPros]);
  const freePros = useMemo(() => displayedPros.filter((p) => !p.isPro), [displayedPros]);

  const serviceLabel =
    filters.service && filters.service !== 'all'
      ? `${filters.service.toLowerCase()}s`
      : 'pros';

  let countText = '';
  if (proPros.length > 0 && freePros.length > 0) {
    countText = `Showing ${proPros.length} ranked ${serviceLabel} and ${freePros.length} unranked`;
  } else if (proPros.length > 0) {
    countText = `Showing ${proPros.length} ranked ${serviceLabel}`;
  } else if (freePros.length > 0) {
    countText = `Showing ${freePros.length} unranked ${serviceLabel}`;
  } else {
    countText = `Showing 0 ${serviceLabel}`;
  }

  return (
    <div className="flex-1 pb-12">
      {/* Filters Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenHowRankingWorks={() => setIsHowModalOpen(true)}
      />

      {/* Results Header */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-[#072339]">
        <div className="font-semibold">
          {loading ? <span>Finding professionals...</span> : <span>{countText}</span>}
        </div>
      </div>

      {/* Pro List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-card border border-[#E6E6E0] p-4 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : displayedPros.length > 0 ? (
          <>
            {proPros.map((pro, idx) => (
              <ProCard key={pro.id} pro={pro} rankIndex={idx + 1} />
            ))}

            {freePros.length > 0 && (
              <>
                <div className="pt-3 pb-1">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-[#E6E6E0] flex-1" />
                    <span className="font-serif text-xs font-semibold text-[#072339] uppercase tracking-wider">
                      Not ranked
                    </span>
                    <div className="h-px bg-[#E6E6E0] flex-1" />
                  </div>
                  <p className="text-[11px] text-gray-500 text-center mt-1">
                    These pros are on the free plan. They are listed but not ranked.
                  </p>
                </div>

                {freePros.map((pro) => (
                  <ProCard key={pro.id} pro={pro} rankIndex={null} />
                ))}
              </>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-card border border-[#E6E6E0] p-8 text-center space-y-3 my-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#072339]">
              No professionals found
            </h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
              Try widening your filters, choosing "All services", or resetting area constraints to find more matching pros.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({
                    search: '',
                    service: 'all',
                    area: 'all',
                    trustBadge: 'all',
                    minSkillLevel: 'all',
                    availableNow: false,
                    sort: 'best',
                  })
                }
                className="px-4 py-2 bg-[#072339] text-white text-xs font-semibold rounded-lg hover:bg-[#0D3352] transition-colors"
              >
                Reset all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How Ranking Works Modal */}
      <HowRankingWorksModal
        isOpen={isHowModalOpen}
        onClose={() => setIsHowModalOpen(false)}
      />
    </div>
  );
}
