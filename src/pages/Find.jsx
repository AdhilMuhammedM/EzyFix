import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar.jsx';
import ProCard from '../components/ProCard.jsx';
import HowRankingWorksModal from '../components/HowRankingWorksModal.jsx';
import { listPros, listRawVouchesForPro, listRawQualificationsForPro } from '../data/repo.js';
import { enrichPro, filterPros, sortPros } from '../lib/scoring.js';
import { SearchX, Sparkles } from 'lucide-react';

export default function Find() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prosWithStats, setProsWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHowModalOpen, setIsHowModalOpen] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('ezyfix_demo_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

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

    const updateSession = () => {
      try {
        const raw = localStorage.getItem('ezyfix_demo_session');
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
    };

    window.addEventListener('storage', updateSession);
    window.addEventListener('ezyfix-session-update', updateSession);
    return () => {
      window.removeEventListener('storage', updateSession);
      window.removeEventListener('ezyfix-session-update', updateSession);
    };
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
    <div className="flex-1 pb-16 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column / Sidebar on Desktop */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-4 mb-4 lg:mb-0">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenHowRankingWorks={() => setIsHowModalOpen(true)}
          />
        </div>

        {/* Right Column / Results on Desktop */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Active Demo Session Banner (Presentation Demo) */}
          {session && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#072339]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Active Session: <strong>{session.name}</strong> ({session.role === 'user' ? 'Customer' : 'Worker'}) • Area: <strong>{session.place}</strong>
                </span>
              </div>
              <Link
                to="/login"
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline flex items-center gap-1"
              >
                <span>Switch / Re-login</span>
                <span>→</span>
              </Link>
            </div>
          )}

          {/* Results Header */}
          <div className="py-1 flex items-center justify-between text-xs sm:text-sm text-[#072339]">
            <div className="font-semibold">
              {loading ? <span>Finding professionals...</span> : <span>{countText}</span>}
            </div>
          </div>

          {/* Pro Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-card border border-[#E6E6E0] p-4 h-36 animate-pulse"
                />
              ))
            ) : displayedPros.length > 0 ? (
              <>
                {proPros.map((pro, idx) => (
                  <ProCard key={pro.id} pro={pro} rankIndex={idx + 1} />
                ))}

                {freePros.length > 0 && (
                  <>
                    <div className="col-span-full pt-4 pb-2">
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
              <div className="col-span-full bg-white rounded-card border border-[#E6E6E0] p-8 text-center space-y-3 my-4 shadow-sm">
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
        </div>
      </div>

      {/* How Ranking Works Modal */}
      <HowRankingWorksModal
        isOpen={isHowModalOpen}
        onClose={() => setIsHowModalOpen(false)}
      />
    </div>
  );
}
