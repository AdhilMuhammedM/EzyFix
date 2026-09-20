import {
  TRUST_LEVELS,
  SKILL_LEVELS,
  QUALIFICATION_TYPES,
  MAX_SKILL_POINTS,
  FREE_VISIBLE_VOUCHES,
} from './config.js';

/**
 * Checks if a professional has an active Pro subscription.
 * A pro is Pro only while proUntil is in the future.
 * Missing or null means Free.
 *
 * @param {Object} pro
 * @param {Date|string|number} now
 * @returns {boolean}
 */
export function isProActive(pro, now = new Date()) {
  if (!pro || !pro.proUntil) return false;
  const expiryTime = new Date(pro.proUntil).getTime();
  if (isNaN(expiryTime)) return false;
  const currentTime = new Date(now).getTime();
  return expiryTime > currentTime;
}

/**
 * Computes trust stats from vouches.
 * Only vouches with status = 'active' count, deduplicated by distinct voucherPhone.
 * Pro affects ranking and visibility only, never trust or skill levels.
 *
 * @param {Array} vouches
 * @returns {{ count: number, level: number, label: string, bg: string }}
 */
export function computeTrust(vouches = []) {
  const activeVouches = vouches.filter((v) => v && v.status === 'active');
  const distinctPhones = new Set();
  activeVouches.forEach((v) => {
    const key = v.voucherPhone || v.id;
    if (key) {
      distinctPhones.add(key);
    }
  });

  const count = distinctPhones.size;
  const config =
    TRUST_LEVELS.find((tl) => count >= tl.minVouches) ||
    TRUST_LEVELS[TRUST_LEVELS.length - 1];

  return {
    count,
    level: config.level,
    label: config.label,
    bg: config.bg,
  };
}

/**
 * Computes skill stats from qualifications.
 * Only qualifications with status = 'approved' count.
 * Each qualification gives points by type, capped at MAX_SKILL_POINTS.
 * Pro affects ranking and visibility only, never trust or skill levels.
 *
 * @param {Array} qualifications
 * @returns {{ points: number, level: number, label: string, bg: string, pips: number, totalApproved: number }}
 */
export function computeSkill(qualifications = []) {
  const approved = qualifications.filter((q) => q && q.status === 'approved');

  let rawPoints = 0;
  for (const q of approved) {
    const pointValue = QUALIFICATION_TYPES[q.type]?.points ?? 1;
    rawPoints += pointValue;
  }

  const points = Math.min(MAX_SKILL_POINTS, rawPoints);
  const config =
    SKILL_LEVELS.find((sl) => points >= sl.minPoints) ||
    SKILL_LEVELS[SKILL_LEVELS.length - 1];

  return {
    points,
    level: config.level,
    label: config.label,
    bg: config.bg,
    pips: config.pips,
    totalApproved: approved.length,
  };
}

/**
 * Score = trustLevel + skillLevel (0 to 4)
 *
 * @param {number} trustLevel (0, 1, 2)
 * @param {number} skillLevel (0, 1, 2)
 * @returns {number}
 */
export function computeScore(trustLevel, skillLevel) {
  return (trustLevel || 0) + (skillLevel || 0);
}

/**
 * Enriches a pro with calculated stats (trust, skill, score, isPro).
 * Computed values are never permanently stored on the raw pro.
 *
 * @param {Object} pro
 * @param {Array} vouches
 * @param {Array} qualifications
 * @param {Date|string|number} now
 * @returns {Object}
 */
export function enrichPro(pro, vouches = [], qualifications = [], now = new Date()) {
  const trust = computeTrust(vouches);
  const skill = computeSkill(qualifications);
  const score = computeScore(trust.level, skill.level);
  const isPro = isProActive(pro, now);

  return {
    ...pro,
    isPro,
    trust,
    skill,
    score,
    vouchCount: trust.count,
    skillPoints: skill.points,
  };
}

export const computeProStats = enrichPro;

/**
 * Sorts pros with stats:
 * - Pro pros are ranked and listed first, using the specified sort mode with tiebreakers.
 * - Free pros are listed after them, unranked, sorted by fullName asc in every sort mode.
 *
 * @param {Array} prosWithStats
 * @param {string} mode ('best' | 'trust' | 'skill')
 * @param {Date|string|number} now
 * @returns {Array} sorted array
 */
export function sortPros(prosWithStats, mode = 'best', now = new Date()) {
  const copy = [...prosWithStats];

  const proPros = [];
  const freePros = [];

  for (const p of copy) {
    if (isProActive(p, now)) {
      proPros.push(p);
    } else {
      freePros.push(p);
    }
  }

  // Sort Pro pros using mode tiebreakers
  proPros.sort((a, b) => {
    const nameDiff = (a.fullName || '').localeCompare(b.fullName || '');

    if (mode === 'best') {
      if (b.score !== a.score) return b.score - a.score;
      if (b.vouchCount !== a.vouchCount) return b.vouchCount - a.vouchCount;
      if (b.skillPoints !== a.skillPoints) return b.skillPoints - a.skillPoints;
      return nameDiff;
    }

    if (mode === 'trust') {
      if (b.vouchCount !== a.vouchCount) return b.vouchCount - a.vouchCount;
      if (b.skillPoints !== a.skillPoints) return b.skillPoints - a.skillPoints;
      return nameDiff;
    }

    if (mode === 'skill') {
      if (b.skillPoints !== a.skillPoints) return b.skillPoints - a.skillPoints;
      if (b.vouchCount !== a.vouchCount) return b.vouchCount - a.vouchCount;
      return nameDiff;
    }

    return nameDiff;
  });

  // Free pros are always sorted by fullName asc across all sort modes
  freePros.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  return [...proPros, ...freePros];
}

/**
 * Filters pros with stats by manual criteria combining with AND:
 * - name (contains, case-insensitive)
 * - service (exact)
 * - area (matches homeArea or any of areasServed)
 * - trustBadge (matches trust label or trust level)
 * - minSkillLevel (pro.skill.level >= minSkillLevel)
 * - availableNow (boolean)
 *
 * @param {Array} prosWithStats
 * @param {Object} filters
 * @returns {Array}
 */
export function filterPros(prosWithStats, filters = {}) {
  return prosWithStats.filter((pro) => {
    // Name search
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      if (!pro.fullName || !pro.fullName.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Service filter
    if (filters.service && filters.service !== 'all' && filters.service.trim()) {
      if (pro.service !== filters.service) {
        return false;
      }
    }

    // Area filter (matches homeArea or any of areasServed)
    if (filters.area && filters.area !== 'all' && filters.area.trim()) {
      const inHome = pro.homeArea === filters.area;
      const inServed =
        Array.isArray(pro.areasServed) && pro.areasServed.includes(filters.area);
      if (!inHome && !inServed) {
        return false;
      }
    }

    // Trust badge filter
    if (filters.trustBadge && filters.trustBadge !== 'all') {
      if (typeof filters.trustBadge === 'number') {
        if (pro.trust.level < filters.trustBadge) return false;
      } else {
        if (pro.trust.label !== filters.trustBadge) return false;
      }
    }

    // Min skill level
    if (filters.minSkillLevel !== undefined && filters.minSkillLevel !== '' && filters.minSkillLevel !== 'all') {
      const minLevel = Number(filters.minSkillLevel);
      if (pro.skill.level < minLevel) {
        return false;
      }
    }

    // Available now
    if (filters.availableNow) {
      if (!pro.availableNow) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates the 1-based position in a 'best'-sorted list of Pro pros with the same service.
 * Returns null for a Free pro, and only counts Pro pros of the same service.
 *
 * @param {string} proId
 * @param {Array} allProsWithStats
 * @param {Date|string|number} now
 * @returns {number|null} 1-based rank or null if Free or not found
 */
export function rankOf(proId, allProsWithStats = [], now = new Date()) {
  const target = allProsWithStats.find((p) => p.id === proId);
  if (!target) return null;
  if (!isProActive(target, now)) return null;

  // Filter for active Pro pros with the same service
  const peers = allProsWithStats.filter(
    (p) => p.service === target.service && isProActive(p, now)
  );
  const sorted = sortPros(peers, 'best', now);

  const index = sorted.findIndex((p) => p.id === proId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Calculates the 1-based rank the pro would have if they were on the Pro plan
 * among same-service Pro pros (used on the Free pro's dashboard to encourage upgrade).
 *
 * @param {string} proId
 * @param {Array} allProsWithStats
 * @param {Date|string|number} now
 * @returns {number|null} projected 1-based rank or null if not found
 */
export function projectedRank(proId, allProsWithStats = [], now = new Date()) {
  const target = allProsWithStats.find((p) => p.id === proId);
  if (!target) return null;

  // Gather active Pro peers of same service, plus the target pro treated as Pro
  const peers = allProsWithStats.filter(
    (p) => p.service === target.service && (p.id === proId || isProActive(p, now))
  );

  // Sort peers using 'best' tiebreakers
  peers.sort((a, b) => {
    const nameDiff = (a.fullName || '').localeCompare(b.fullName || '');
    if (b.score !== a.score) return b.score - a.score;
    if (b.vouchCount !== a.vouchCount) return b.vouchCount - a.vouchCount;
    if (b.skillPoints !== a.skillPoints) return b.skillPoints - a.skillPoints;
    return nameDiff;
  });

  const index = peers.findIndex((p) => p.id === proId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Returns visible vouches and hidden count based on plan:
 * - Pro returns all vouches, hiddenCount: 0.
 * - Free returns the newest FREE_VISIBLE_VOUCHES, and the count of hidden vouches.
 *
 * @param {Array} vouches
 * @param {boolean} isPro
 * @returns {{ visible: Array, hiddenCount: number }}
 */
export function getVisibleVouches(vouches = [], isPro = false) {
  if (!Array.isArray(vouches)) {
    return { visible: [], hiddenCount: 0 };
  }
  if (isPro) {
    return { visible: [...vouches], hiddenCount: 0 };
  }
  const visible = vouches.slice(0, FREE_VISIBLE_VOUCHES);
  const hiddenCount = Math.max(0, vouches.length - visible.length);
  return { visible, hiddenCount };
}
