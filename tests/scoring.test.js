import { describe, it, expect } from 'vitest';
import {
  computeTrust,
  computeSkill,
  computeScore,
  isProActive,
  sortPros,
  filterPros,
  rankOf,
  projectedRank,
  getVisibleVouches,
  enrichPro,
} from '../src/lib/scoring.js';

describe('Plans & Pro Active State', () => {
  const now = new Date('2024-03-01T12:00:00.000Z');

  it('identifies future proUntil as active Pro', () => {
    const pro = { proUntil: '2024-04-01T12:00:00.000Z' };
    expect(isProActive(pro, now)).toBe(true);
  });

  it('identifies expired proUntil as Free', () => {
    const pro = { proUntil: '2024-02-01T12:00:00.000Z' };
    expect(isProActive(pro, now)).toBe(false);
  });

  it('identifies missing or null proUntil as Free', () => {
    expect(isProActive({}, now)).toBe(false);
    expect(isProActive({ proUntil: null }, now)).toBe(false);
    expect(isProActive(null, now)).toBe(false);
  });

  it('pro plan never alters trust or skill levels', () => {
    const vouches = [
      { id: 'v1', voucherPhone: '9100000001', status: 'active' },
      { id: 'v2', voucherPhone: '9100000002', status: 'active' },
      { id: 'v3', voucherPhone: '9100000003', status: 'active' },
    ];
    const qualifications = [
      { id: 'q1', type: 'iti_diploma', status: 'approved' },
      { id: 'q2', type: 'trade_licence', status: 'approved' },
    ];

    const freePro = enrichPro(
      { id: 'p-free', fullName: 'Free Person', proUntil: null },
      vouches,
      qualifications,
      now
    );
    const proPro = enrichPro(
      { id: 'p-pro', fullName: 'Pro Person', proUntil: '2024-05-01T00:00:00.000Z' },
      vouches,
      qualifications,
      now
    );

    expect(freePro.trust.level).toBe(proPro.trust.level); // Both 2
    expect(freePro.trust.label).toBe(proPro.trust.label); // Both 'Highly trusted'
    expect(freePro.skill.level).toBe(proPro.skill.level); // Both 2
    expect(freePro.skill.label).toBe(proPro.skill.label); // Both 'Expert'
    expect(freePro.score).toBe(proPro.score);             // Both 4
  });
});

describe('Scoring & Trust Logic', () => {
  it('computes trust level 0 (New) for 0 vouches', () => {
    const result = computeTrust([]);
    expect(result.level).toBe(0);
    expect(result.label).toBe('New');
    expect(result.count).toBe(0);
  });

  it('computes trust level 1 (Community vouched) for 1 or 2 vouches', () => {
    const v1 = [{ id: '1', voucherPhone: '9100000001', status: 'active' }];
    expect(computeTrust(v1).level).toBe(1);
    expect(computeTrust(v1).label).toBe('Community vouched');

    const v2 = [
      { id: '1', voucherPhone: '9100000001', status: 'active' },
      { id: '2', voucherPhone: '9100000002', status: 'active' },
    ];
    expect(computeTrust(v2).level).toBe(1);
  });

  it('computes trust level 2 (Highly trusted) for 3+ vouches', () => {
    const v3 = [
      { id: '1', voucherPhone: '9100000001', status: 'active' },
      { id: '2', voucherPhone: '9100000002', status: 'active' },
      { id: '3', voucherPhone: '9100000003', status: 'active' },
    ];
    expect(computeTrust(v3).level).toBe(2);
    expect(computeTrust(v3).label).toBe('Highly trusted');
  });

  it('deduplicates vouches by voucherPhone and ignores non-active', () => {
    const mixed = [
      { id: '1', voucherPhone: '9100000001', status: 'active' },
      { id: '2', voucherPhone: '9100000001', status: 'active' }, // duplicate phone
      { id: '3', voucherPhone: '9100000002', status: 'removed' }, // removed
    ];
    const result = computeTrust(mixed);
    expect(result.count).toBe(1);
    expect(result.level).toBe(1);
  });
});

describe('Scoring & Skill Logic', () => {
  it('computes skill level 0 (Starter) for 0 approved qualifications', () => {
    const result = computeSkill([]);
    expect(result.points).toBe(0);
    expect(result.level).toBe(0);
    expect(result.label).toBe('Starter');
    expect(result.pips).toBe(1);
  });

  it('computes skill level 1 (Skilled) for 1 point', () => {
    const q1 = [{ id: '1', type: 'iti_diploma', status: 'approved' }];
    const result = computeSkill(q1);
    expect(result.points).toBe(1);
    expect(result.level).toBe(1);
    expect(result.label).toBe('Skilled');
    expect(result.pips).toBe(2);
  });

  it('computes skill level 2 (Expert) for 2+ points and caps at 4 points', () => {
    const q5 = [
      { id: '1', type: 'iti_diploma', status: 'approved' },
      { id: '2', type: 'trade_licence', status: 'approved' },
      { id: '3', type: 'training_course', status: 'approved' },
      { id: '4', type: 'professional_certification', status: 'approved' },
      { id: '5', type: 'work_reference', status: 'approved' },
    ];
    const result = computeSkill(q5);
    expect(result.points).toBe(4); // capped at MAX_SKILL_POINTS = 4
    expect(result.level).toBe(2);
    expect(result.label).toBe('Expert');
    expect(result.pips).toBe(3);
  });

  it('ignores pending and rejected qualifications', () => {
    const mixed = [
      { id: '1', type: 'iti_diploma', status: 'pending' },
      { id: '2', type: 'trade_licence', status: 'rejected' },
      { id: '3', type: 'training_course', status: 'approved' },
    ];
    const result = computeSkill(mixed);
    expect(result.points).toBe(1);
    expect(result.level).toBe(1);
  });
});

describe('Pro Plan Ranking, Visibility & Section 10 Seed Tests', () => {
  const testNow = new Date('2024-03-01T12:00:00.000Z');
  const futureExpiry = '2025-01-01T00:00:00.000Z';

  // Seeded Plumbers (Anil, Shibu, Kiran are Pro; Biju, Jomon are Free)
  const anil = enrichPro(
    { id: 'pro-1', fullName: 'Anil Varghese', service: 'Plumber', proUntil: futureExpiry },
    [
      { id: 'v1', voucherPhone: '9100000001', status: 'active' },
      { id: 'v2', voucherPhone: '9100000002', status: 'active' },
      { id: 'v3', voucherPhone: '9100000003', status: 'active' },
      { id: 'v4', voucherPhone: '9100000004', status: 'active' },
      { id: 'v5', voucherPhone: '9100000005', status: 'active' },
    ],
    [{ id: 'q1', type: 'iti_diploma', status: 'approved' }],
    testNow
  ); // Pro, trust 2, skill 1 -> score 3, vouches 5, skillPoints 1

  const biju = enrichPro(
    { id: 'pro-2', fullName: 'Biju Thomas', service: 'Plumber', proUntil: null },
    [
      { id: 'v6', voucherPhone: '9100000006', status: 'active' },
      { id: 'v7', voucherPhone: '9100000007', status: 'active' },
    ],
    [],
    testNow
  ); // Free, trust 1, skill 0 -> score 1, vouches 2, skillPoints 0

  const shibu = enrichPro(
    { id: 'pro-3', fullName: 'Shibu Raj', service: 'Plumber', proUntil: futureExpiry },
    [],
    [
      { id: 'q2', type: 'iti_diploma', status: 'approved' },
      { id: 'q3', type: 'trade_licence', status: 'approved' },
    ],
    testNow
  ); // Pro, trust 0, skill 2 -> score 2, vouches 0, skillPoints 2

  const jomon = enrichPro(
    { id: 'pro-4', fullName: 'Jomon K', service: 'Plumber', proUntil: null },
    [],
    [],
    testNow
  ); // Free, trust 0, skill 0 -> score 0, vouches 0, skillPoints 0

  const kiran = enrichPro(
    { id: 'pro-5', fullName: 'Kiran Das', service: 'Plumber', proUntil: futureExpiry },
    [
      { id: 'v8', voucherPhone: '9100000008', status: 'active' },
      { id: 'v9', voucherPhone: '9100000009', status: 'active' },
      { id: 'v10', voucherPhone: '9100000010', status: 'active' },
    ],
    [],
    testNow
  ); // Pro, trust 2, skill 0 -> score 2, vouches 3, skillPoints 0

  it('a Pro pro with score 0 ranks above a Free pro with score 4 (Pro group always first)', () => {
    const proZero = enrichPro(
      { id: 'p-0', fullName: 'Zack Pro', service: 'Plumber', proUntil: futureExpiry },
      [],
      [],
      testNow
    ); // score 0
    const freeMax = enrichPro(
      { id: 'p-4', fullName: 'Aaron Free', service: 'Plumber', proUntil: null },
      [
        { id: 'v1', voucherPhone: '9100000001', status: 'active' },
        { id: 'v2', voucherPhone: '9100000002', status: 'active' },
        { id: 'v3', voucherPhone: '9100000003', status: 'active' },
      ],
      [
        { id: 'q1', type: 'iti_diploma', status: 'approved' },
        { id: 'q2', type: 'trade_licence', status: 'approved' },
      ],
      testNow
    ); // score 4

    const sorted = sortPros([freeMax, proZero], 'best', testNow);
    expect(sorted[0].fullName).toBe('Zack Pro');
    expect(sorted[1].fullName).toBe('Aaron Free');
  });

  it('Free pros are never given a rank (rankOf returns null)', () => {
    const plumbers = [biju, jomon, anil, shibu, kiran];
    expect(rankOf('pro-2', plumbers, testNow)).toBeNull(); // Biju (Free)
    expect(rankOf('pro-4', plumbers, testNow)).toBeNull(); // Jomon (Free)

    // Pro pros receive rank among same-service Pro pros
    expect(rankOf('pro-1', plumbers, testNow)).toBe(1); // Anil #1
    expect(rankOf('pro-5', plumbers, testNow)).toBe(2); // Kiran #2
    expect(rankOf('pro-3', plumbers, testNow)).toBe(3); // Shibu #3
  });

  it('Free pros are sorted by name in all three sort modes', () => {
    const plumbers = [biju, jomon, anil, shibu, kiran];

    ['best', 'trust', 'skill'].forEach((mode) => {
      const sorted = sortPros(plumbers, mode, testNow);
      const freeSection = sorted.filter((p) => !isProActive(p, testNow));
      const freeNames = freeSection.map((p) => p.fullName);
      expect(freeNames).toEqual(['Biju Thomas', 'Jomon K']);
    });
  });

  it('matches Section 10 seed plumber order for Best match: Anil, Kiran, Shibu, Biju, Jomon', () => {
    const plumbers = [biju, jomon, anil, shibu, kiran];
    const sorted = sortPros(plumbers, 'best', testNow);
    const names = sorted.map((p) => p.fullName);

    expect(names).toEqual([
      'Anil Varghese', // Pro #1
      'Kiran Das',     // Pro #2
      'Shibu Raj',      // Pro #3
      'Biju Thomas',   // Free (unranked)
      'Jomon K',       // Free (unranked)
    ]);
  });

  it('sorts by Most skilled: Shibu is first among Pro, then Anil, Kiran, then Free Biju, Jomon', () => {
    const plumbers = [anil, biju, shibu, jomon, kiran];
    const sorted = sortPros(plumbers, 'skill', testNow);
    const names = sorted.map((p) => p.fullName);

    expect(names).toEqual([
      'Shibu Raj',     // 2 skill points
      'Anil Varghese', // 1 skill point
      'Kiran Das',     // 0 skill points
      'Biju Thomas',   // Free
      'Jomon K',       // Free
    ]);
  });

  it('evaluates projectedRank for Jomon before and after qualifications (#4 of 4, then #3 of 4)', () => {
    const plumbers = [biju, jomon, anil, shibu, kiran];

    // Jomon with 0 score projected among Pro plumbers: Anil (3), Kiran (2), Shibu (2), Jomon (0) -> Rank 4
    expect(projectedRank('pro-4', plumbers, testNow)).toBe(4);

    // Jomon with 2 approved qualifications (score 2, vouches 0, skillPoints 2, name "Jomon K")
    const jomonWithQuals = enrichPro(
      { id: 'pro-4', fullName: 'Jomon K', service: 'Plumber', proUntil: null },
      [],
      [
        { id: 'jq1', type: 'iti_diploma', status: 'approved' },
        { id: 'jq2', type: 'trade_licence', status: 'approved' },
      ],
      testNow
    );

    const updatedPlumbers = [biju, jomonWithQuals, anil, shibu, kiran];
    // Projected among Pro plumbers: Anil (#1), Kiran (#2), Jomon (#3), Shibu (#4)
    expect(projectedRank('pro-4', updatedPlumbers, testNow)).toBe(3);
  });

  it('getVisibleVouches shows 1 for Free with rest counted as hidden, and all for Pro', () => {
    const fiveVouches = [
      { id: '1', jobDone: 'Job 1' },
      { id: '2', jobDone: 'Job 2' },
      { id: '3', jobDone: 'Job 3' },
      { id: '4', jobDone: 'Job 4' },
      { id: '5', jobDone: 'Job 5' },
    ];

    // Free pro
    const freeView = getVisibleVouches(fiveVouches, false);
    expect(freeView.visible.length).toBe(1);
    expect(freeView.visible[0].jobDone).toBe('Job 1');
    expect(freeView.hiddenCount).toBe(4);

    // Pro pro
    const proView = getVisibleVouches(fiveVouches, true);
    expect(proView.visible.length).toBe(5);
    expect(proView.hiddenCount).toBe(0);
  });
});
