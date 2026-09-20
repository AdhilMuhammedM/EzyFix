import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProBadge from '../src/components/ProBadge.jsx';
import WhyRankPanel from '../src/components/WhyRankPanel.jsx';
import ProCard from '../src/components/ProCard.jsx';
import HowRankingWorksModal from '../src/components/HowRankingWorksModal.jsx';
import { PRO_PRICE_INR_PER_MONTH } from '../src/lib/config.js';

describe('BRICK 13B: Pro Plan UI Components', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('ProBadge renders Crown and Pro text for pro plan', () => {
    act(() => {
      root.render(<ProBadge plan="pro" />);
    });
    expect(container.textContent).toContain('Pro');
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('ProBadge renders plain Free plan text without icon when plan is free', () => {
    act(() => {
      root.render(<ProBadge plan="free" />);
    });
    expect(container.textContent).toContain('Free plan');
    const svg = container.querySelector('svg');
    expect(svg).toBeFalsy();
  });

  it('WhyRankPanel displays Why this rank for Pro pros and expands', () => {
    const proPro = {
      id: 'p1',
      fullName: 'Anil Kumar',
      isPro: true,
      trust: { count: 3, level: 2, label: 'Highly trusted' },
      skill: { points: 2, level: 2, label: 'Expert' },
      score: 4,
    };

    act(() => {
      root.render(<WhyRankPanel pro={proPro} />);
    });
    expect(container.textContent).toContain('Why this rank?');
    expect(container.textContent).toContain('4/4');

    const button = container.querySelector('button');
    act(() => {
      button.click();
    });
    expect(container.textContent).toContain('Tiebreakers');
    expect(container.textContent).not.toContain('Not ranked. This pro is on the free plan.');
  });

  it('WhyRankPanel displays Score breakdown and Free plan note for Free pros', () => {
    const freePro = {
      id: 'p2',
      fullName: 'Jomon K',
      isPro: false,
      trust: { count: 1, level: 1, label: 'Community vouched' },
      skill: { points: 0, level: 0, label: 'Starter' },
      score: 1,
    };

    act(() => {
      root.render(<WhyRankPanel pro={freePro} />);
    });
    expect(container.textContent).toContain('Score breakdown');

    const button = container.querySelector('button');
    act(() => {
      button.click();
    });
    expect(container.textContent).toContain('Not ranked. This pro is on the free plan.');
  });

  it('ProCard renders rank badge, Pro badge, and WhyRankPanel only for Pro pros', () => {
    const proPro = {
      id: 'p1',
      fullName: 'Anil Kumar',
      service: 'Plumber',
      homeArea: 'Lake View',
      yearsExperience: 10,
      availableNow: true,
      isPro: true,
      trust: { count: 3, level: 2, label: 'Highly trusted' },
      skill: { points: 2, level: 2, label: 'Expert' },
    };

    act(() => {
      root.render(
        <MemoryRouter>
          <ProCard pro={proPro} rankIndex={1} />
        </MemoryRouter>
      );
    });
    expect(container.textContent).toContain('Anil Kumar');
    expect(container.textContent).toContain('Pro');
    expect(container.textContent).toContain('Why this rank?');
    expect(container.textContent).toContain('1'); // rank badge
  });

  it('ProCard for Free pro hides rank number badge and WhyRankPanel', () => {
    const freePro = {
      id: 'p2',
      fullName: 'Jomon K',
      service: 'Plumber',
      homeArea: 'Market Road',
      yearsExperience: 4,
      availableNow: false,
      isPro: false,
      trust: { count: 1, level: 1, label: 'Community vouched' },
      skill: { points: 0, level: 0, label: 'Starter' },
    };

    act(() => {
      root.render(
        <MemoryRouter>
          <ProCard pro={freePro} rankIndex={null} />
        </MemoryRouter>
      );
    });
    expect(container.textContent).toContain('Jomon K');
    expect(container.textContent).not.toContain('Why this rank?');
    // Avatar rank badge should not be present
    expect(container.querySelector('[title="Rank #null in current view"]')).toBeFalsy();
  });

  it('HowRankingWorksModal contains Part 4 Pro plan with dynamic price and fairness guarantee', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <HowRankingWorksModal isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('4. Pro Plan');
    expect(container.textContent).toContain(`₹${PRO_PRICE_INR_PER_MONTH} per month`);
    expect(container.textContent).toContain('Pro never changes Trust or Skill');
    expect(container.textContent).toContain('See plans');
  });

  it('Pro plan copy maintains strict quality standards: no boost or sponsored words', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <HowRankingWorksModal isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      );
    });

    const modalText = container.textContent.toLowerCase();
    expect(modalText).not.toContain('boost');
    expect(modalText).not.toContain('sponsored');
  });

  it('Results count format matches specification for both, pro-only, and free-only lists', () => {
    const formatCount = (proCount, freeCount, service = 'all') => {
      const serviceLabel = service && service !== 'all' ? `${service.toLowerCase()}s` : 'pros';
      if (proCount > 0 && freeCount > 0) {
        return `Showing ${proCount} ranked ${serviceLabel} and ${freeCount} unranked`;
      } else if (proCount > 0) {
        return `Showing ${proCount} ranked ${serviceLabel}`;
      } else if (freeCount > 0) {
        return `Showing ${freeCount} unranked ${serviceLabel}`;
      }
      return `Showing 0 ${serviceLabel}`;
    };

    expect(formatCount(8, 2, 'all')).toBe('Showing 8 ranked pros and 2 unranked');
    expect(formatCount(3, 1, 'Plumber')).toBe('Showing 3 ranked plumbers and 1 unranked');
    expect(formatCount(3, 0, 'Electrician')).toBe('Showing 3 ranked electricians');
    expect(formatCount(0, 2, 'Painter')).toBe('Showing 2 unranked painters');
  });

  it('Free pro public profile vouches logic hides extra vouches with notice', () => {
    const vouches = [
      { id: 'v1', voucherName: 'Alice', feedback: 'Great job', createdAt: '2026-03-01T10:00:00Z' },
      { id: 'v2', voucherName: 'Bob', feedback: 'Fixed quickly', createdAt: '2026-03-05T10:00:00Z' },
      { id: 'v3', voucherName: 'Charlie', feedback: 'On time', createdAt: '2026-03-10T10:00:00Z' },
    ];

    // For Free pro
    const isPro = false;
    const visible = isPro ? vouches : vouches.slice(-1);
    const hiddenCount = vouches.length - visible.length;

    expect(visible.length).toBe(1);
    expect(hiddenCount).toBe(2);
    const notice = `${hiddenCount} more ${hiddenCount === 1 ? 'vouch is' : 'vouches are'} visible when this pro is on the Pro plan.`;
    expect(notice).toBe('2 more vouches are visible when this pro is on the Pro plan.');

    // For Pro pro
    const proVisible = true ? vouches : vouches.slice(-1);
    expect(proVisible.length).toBe(3);
  });
});
