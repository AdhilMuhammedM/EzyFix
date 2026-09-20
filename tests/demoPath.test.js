import { describe, it, expect, beforeEach } from 'vitest';
import * as repo from '../src/data/localRepo.js';
import {
  enrichPro,
  filterPros,
  sortPros,
  rankOf,
  projectedRank,
  getVisibleVouches,
  isProActive,
} from '../src/lib/scoring.js';
import { DEFAULT_ADMIN_PASSCODE } from '../src/lib/config.js';

describe('Whole-prototype demo path (Section 12 Acceptance Test with Mock Pro Plan)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await repo.resetDemoData(DEFAULT_ADMIN_PASSCODE);
  });

  // Helper to load and enrich all pros
  async function loadEnrichedPros() {
    const pros = await repo.listPros();
    return Promise.all(
      pros.map(async (p) => {
        const vouches = await repo.listRawVouchesForPro(p.id);
        const quals = await repo.listRawQualificationsForPro(p.id);
        return enrichPro(p, vouches, quals);
      })
    );
  }

  it('executes steps 1 through 7 of the Section 12 acceptance test', async () => {
    // -------------------------------------------------------------
    // Step 1: Find, Plumber: ranked Anil #1, Kiran #2, Shibu #3, then a separate
    // "Not ranked" group with Biju and Jomon and no rank numbers.
    // -------------------------------------------------------------
    let allPros = await loadEnrichedPros();
    let plumbers = filterPros(allPros, { service: 'Plumber' });
    let bestPlumbers = sortPros(plumbers, 'best');

    // Check Pro group (ranked)
    const rankedPlumbers = bestPlumbers.filter((p) => p.isPro);
    expect(rankedPlumbers.map((p) => p.fullName)).toEqual([
      'Anil Varghese',
      'Kiran Das',
      'Shibu Raj',
    ]);
    expect(rankOf(rankedPlumbers[0].id, allPros)).toBe(1);
    expect(rankOf(rankedPlumbers[1].id, allPros)).toBe(2);
    expect(rankOf(rankedPlumbers[2].id, allPros)).toBe(3);

    // Check Free group (unranked, sorted by fullName asc)
    const unrankedPlumbers = bestPlumbers.filter((p) => !p.isPro);
    expect(unrankedPlumbers.map((p) => p.fullName)).toEqual([
      'Biju Thomas',
      'Jomon K',
    ]);
    expect(rankOf(unrankedPlumbers[0].id, allPros)).toBeNull();
    expect(rankOf(unrankedPlumbers[1].id, allPros)).toBeNull();

    // -------------------------------------------------------------
    // Step 2: Sort Most skilled: Shibu first among ranked. Biju and Jomon still below.
    // -------------------------------------------------------------
    let skilledPlumbers = sortPros(plumbers, 'skill');
    const skilledRanked = skilledPlumbers.filter((p) => p.isPro);
    const skilledUnranked = skilledPlumbers.filter((p) => !p.isPro);

    expect(skilledRanked[0].fullName).toBe('Shibu Raj');
    expect(skilledRanked.map((p) => p.fullName)).toEqual([
      'Shibu Raj',
      'Anil Varghese',
      'Kiran Das',
    ]);
    expect(skilledUnranked.map((p) => p.fullName)).toEqual([
      'Biju Thomas',
      'Jomon K',
    ]);

    // -------------------------------------------------------------
    // Step 3: Open Biju's profile: Community vouched chip, 2 vouches counted,
    // only 1 vouch shown, plus a note that 1 more is hidden because Biju is on the free plan.
    // Open Anil: all 5 vouches shown.
    // -------------------------------------------------------------
    const bijuId = 'pro-2';
    const bijuRawVouches = await repo.listRawVouchesForPro(bijuId);
    expect(bijuRawVouches.length).toBe(2);

    const bijuVisibility = getVisibleVouches(bijuRawVouches, false);
    expect(bijuVisibility.visible.length).toBe(1);
    expect(bijuVisibility.hiddenCount).toBe(1);

    const anilId = 'pro-1';
    const anilRawVouches = await repo.listRawVouchesForPro(anilId);
    expect(anilRawVouches.length).toBe(5);

    const anilVisibility = getVisibleVouches(anilRawVouches, true);
    expect(anilVisibility.visible.length).toBe(5);
    expect(anilVisibility.hiddenCount).toBe(0);

    // -------------------------------------------------------------
    // Step 4: Call Anil, then vouch with feedback. It appears with name, area, feedback.
    // -------------------------------------------------------------
    const custData = {
      name: 'Adhil Dev',
      phone: '9847123456',
      area: 'Lake View',
    };

    // Log contact on Call
    await repo.addContact({
      proId: anilId,
      customerName: custData.name,
      customerPhone: custData.phone,
      customerArea: custData.area,
    });

    const revealedPhone = await repo.getCallNumber(anilId, custData.phone);
    expect(revealedPhone).toBe('9000000001');

    // Vouch for Anil
    const newVouch = await repo.addVouch({
      proId: anilId,
      voucherName: custData.name,
      voucherPhone: custData.phone,
      voucherArea: custData.area,
      jobDone: 'Fixed leaking bathroom mixer tap',
      jobMonth: '2024-02',
      tags: ['On time', 'Clean work'],
      feedback: 'Anil did a wonderful job fixing our bathroom pipes promptly. Very clean work and fair price.',
      consent: true,
    });

    expect(newVouch.voucherName).toBe('Adhil Dev');
    expect(newVouch.voucherArea).toBe('Lake View');
    expect(newVouch.voucherPhone).toBeUndefined(); // private

    const anilVouches = await repo.listVouches(anilId);
    expect(anilVouches.length).toBe(6);
    expect(anilVouches[0].voucherName).toBe('Adhil Dev'); // newest first

    // -------------------------------------------------------------
    // Step 5: /manage as Jomon (DEMO01): Free plan, not ranked,
    // message "With Pro you would rank #4 of 4 plumbers".
    // Add two qualifications: Pending review, nothing changes.
    // -------------------------------------------------------------
    const jomonPhone = '9000000004';
    const jomonCode = 'DEMO01';
    const jomonPro = await repo.getProByManageAccess({ phone: jomonPhone, manageCode: jomonCode });
    expect(jomonPro).toBeDefined();
    expect(isProActive(jomonPro)).toBe(false); // Free plan

    allPros = await loadEnrichedPros();
    expect(rankOf(jomonPro.id, allPros)).toBeNull(); // not ranked
    expect(projectedRank(jomonPro.id, allPros)).toBe(4); // "With Pro you would rank #4 of 4 plumbers"

    // Add first qualification
    const q1 = await repo.addQualification(jomonPro.id, jomonCode, {
      type: 'iti_diploma',
      title: 'ITI Plumbing Trade Certificate',
      issuer: 'Govt ITI Kalamassery',
      year: 2021,
    });
    expect(q1.status).toBe('pending');

    // Add second qualification
    const q2 = await repo.addQualification(jomonPro.id, jomonCode, {
      type: 'trade_licence',
      title: 'Municipal Plumber Licence Grade 1',
      issuer: 'City Corporation',
      year: 2022,
    });
    expect(q2.status).toBe('pending');

    // Qualifications in owner scope show as pending
    const jomonQualsOwner = await repo.listQualifications(jomonPro.id, { scope: 'owner' });
    expect(jomonQualsOwner.length).toBe(2);
    expect(jomonQualsOwner[0].status).toBe('pending');
    expect(jomonQualsOwner[1].status).toBe('pending');

    // Rank remains null, projected rank remains 4
    allPros = await loadEnrichedPros();
    expect(rankOf(jomonPro.id, allPros)).toBeNull();
    expect(projectedRank(jomonPro.id, allPros)).toBe(4);

    // -------------------------------------------------------------
    // Step 6: /admin: approve both. Jomon is Expert but still not ranked in Find.
    // -------------------------------------------------------------
    await repo.reviewQualification(DEFAULT_ADMIN_PASSCODE, q1.id, 'approved');
    await repo.reviewQualification(DEFAULT_ADMIN_PASSCODE, q2.id, 'approved');

    allPros = await loadEnrichedPros();
    const updatedJomon = allPros.find((p) => p.id === jomonPro.id);
    expect(updatedJomon.skill.points).toBe(2);
    expect(updatedJomon.skill.level).toBe(2);
    expect(updatedJomon.skill.label).toBe('Expert');
    expect(updatedJomon.score).toBe(2); // trust 0 + skill 2

    // Still Free, so still not ranked in Find
    expect(rankOf(jomonPro.id, allPros)).toBeNull();
    // But projected rank with 2 points is now #3 of 4 plumbers (ahead of Shibu)
    expect(projectedRank(jomonPro.id, allPros)).toBe(3);

    // -------------------------------------------------------------
    // Step 7: Jomon opens /plans, taps "Start Pro (demo)", confirms.
    // Find now shows ranked: Anil, Kiran, Jomon, Shibu, then Biju unranked.
    // -------------------------------------------------------------
    const upgradedJomon = await repo.subscribePro(jomonPro.id, jomonCode, { days: 30 });
    expect(upgradedJomon.proUntil).toBeTruthy();

    allPros = await loadEnrichedPros();
    plumbers = filterPros(allPros, { service: 'Plumber' });
    bestPlumbers = sortPros(plumbers, 'best');

    const finalRanked = bestPlumbers.filter((p) => p.isPro);
    const finalUnranked = bestPlumbers.filter((p) => !p.isPro);

    expect(finalRanked.map((p) => p.fullName)).toEqual([
      'Anil Varghese', // Score 3
      'Kiran Das',     // Score 2, vouches 3
      'Jomon K',       // Score 2, vouches 0, skill 2 (alphabetical J before S)
      'Shibu Raj',     // Score 2, vouches 0, skill 2
    ]);

    expect(finalUnranked.map((p) => p.fullName)).toEqual([
      'Biju Thomas',
    ]);

    expect(rankOf(jomonPro.id, allPros)).toBe(3);
    expect(rankOf('pro-2', allPros)).toBeNull(); // Biju still unranked
  });
});
