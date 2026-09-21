import { describe, it, expect, beforeEach } from 'vitest';
import * as repo from '../src/data/localRepo.js';
import { STORAGE_KEYS, DEFAULT_ADMIN_PASSCODE } from '../src/lib/config.js';

describe('Local Repository & Privacy Rules', () => {
  beforeEach(async () => {
    localStorage.clear();
    await repo.resetDemoData(DEFAULT_ADMIN_PASSCODE);
  });

  it('listPros() exposes proUntil but never private phone or manageCode', async () => {
    const pros = await repo.listPros();
    expect(pros.length).toBe(12);
    pros.forEach((pro) => {
      expect(pro.phone).toBeUndefined();
      expect(pro.manageCode).toBeUndefined();
      expect(pro).toHaveProperty('proUntil');
    });

    // Check seed plans match section 10
    const anil = pros.find((p) => p.fullName === 'Anil Varghese');
    const biju = pros.find((p) => p.fullName === 'Biju Thomas');
    const shibu = pros.find((p) => p.fullName === 'Shibu Raj');
    const jomon = pros.find((p) => p.fullName === 'Jomon K');

    expect(anil.proUntil).toBeTruthy(); // Pro
    expect(biju.proUntil).toBeNull();   // Free
    expect(shibu.proUntil).toBeTruthy(); // Pro
    expect(jomon.proUntil).toBeNull();  // Free
  });

  it('getPro() exposes proUntil but never private phone or manageCode', async () => {
    const pro = await repo.getPro('pro-1');
    expect(pro).toBeDefined();
    expect(pro.fullName).toBe('Anil Varghese');
    expect(pro.phone).toBeUndefined();
    expect(pro.manageCode).toBeUndefined();
    expect(pro.proUntil).toBeTruthy();
  });

  it('listVouches() never exposes private voucherPhone', async () => {
    const vouches = await repo.listVouches('pro-1');
    expect(vouches.length).toBe(5);
    vouches.forEach((v) => {
      expect(v.voucherPhone).toBeUndefined();
      expect(v.voucherName).toBeDefined();
    });
  });

  it('getCallNumber() only returns pro phone after a contact is logged', async () => {
    const custPhone = '9998887776';
    // Before contact: null
    const before = await repo.getCallNumber('pro-1', custPhone);
    expect(before).toBeNull();

    // Log contact
    await repo.addContact({
      proId: 'pro-1',
      customerName: 'Test Customer',
      customerPhone: custPhone,
      customerArea: 'Lake View',
    });

    // After contact: returns Anil's phone
    const after = await repo.getCallNumber('pro-1', custPhone);
    expect(after).toBe('9000000001');
  });

  it('blocks vouching if no contact was logged first (Section 7 Rule 2)', async () => {
    const uncontactedPhone = '9888877777';
    await expect(
      repo.addVouch({
        proId: 'pro-1',
        voucherName: 'No Contact User',
        voucherPhone: uncontactedPhone,
        voucherArea: 'Lake View',
        jobDone: 'Tap repair work',
        jobMonth: '2024-02',
        tags: ['On time'],
        feedback: 'Great work done on our water pipes in the kitchen.',
        consent: true,
      })
    ).rejects.toThrow('You can vouch after you contact this pro through EzyFix.');
  });

  it('prevents a pro from vouching for themselves (Section 7 Rule 4)', async () => {
    const proPhone = '9000000001'; // Anil's phone

    // Log contact with Anil's own phone
    await repo.addContact({
      proId: 'pro-1',
      customerName: 'Anil Self',
      customerPhone: proPhone,
      customerArea: 'Lake View',
    });

    await expect(
      repo.addVouch({
        proId: 'pro-1',
        voucherName: 'Anil Varghese',
        voucherPhone: proPhone,
        voucherArea: 'Lake View',
        jobDone: 'Self work done',
        jobMonth: '2024-02',
        tags: ['On time'],
        feedback: 'I did a fantastic job on this customer plumbing.',
        consent: true,
      })
    ).rejects.toThrow('You cannot vouch for your own profile.');
  });

  it('allows owner to add qualification in pending status and delete it while pending', async () => {
    // Jomon K (pro-4, manageCode DEMO01)
    const newQual = await repo.addQualification('pro-4', 'DEMO01', {
      type: 'iti_diploma',
      title: 'Plumbing Craft Certification',
      issuer: 'Kerala ITI Board',
      year: 2021,
    });

    expect(newQual.status).toBe('pending');

    // Public list does not show pending
    const publicList = await repo.listQualifications('pro-4', { scope: 'public' });
    expect(publicList.length).toBe(0);

    // Owner list shows pending
    const ownerList = await repo.listQualifications('pro-4', { scope: 'owner' });
    expect(ownerList.length).toBe(1);

    // Delete while pending
    await repo.deleteQualification(newQual.id, 'DEMO01');
    const ownerListAfter = await repo.listQualifications('pro-4', { scope: 'owner' });
    expect(ownerListAfter.length).toBe(0);
  });

  it('subscribes a pro, extends expiry if active, and rejects wrong manage code', async () => {
    // Jomon K is Free (proUntil: null)
    await expect(repo.subscribePro('pro-4', 'WRONGCODE', { days: 30 })).rejects.toThrow(
      'Invalid manage code.'
    );

    const subscribed = await repo.subscribePro('pro-4', 'DEMO01', { days: 30 });
    expect(subscribed.proUntil).toBeTruthy();

    const expiry1 = new Date(subscribed.proUntil).getTime();
    expect(expiry1).toBeGreaterThan(Date.now());

    // Extending while already active extends from current expiry
    const extended = await repo.subscribePro('pro-4', 'DEMO01', { days: 30 });
    const expiry2 = new Date(extended.proUntil).getTime();
    expect(expiry2).toBeGreaterThanOrEqual(expiry1 + 29 * 24 * 60 * 60 * 1000);
  });

  it('cancels Pro subscription, returns pro to Free, and rejects wrong manage code', async () => {
    // Anil is initially Pro
    await expect(repo.cancelPro('pro-1', 'WRONGCODE')).rejects.toThrow('Invalid manage code.');

    const cancelled = await repo.cancelPro('pro-1', 'ANIL01');
    expect(cancelled.proUntil).toBeNull();

    const fetched = await repo.getPro('pro-1');
    expect(fetched.proUntil).toBeNull();
  });

  it('addIssueReview() blocks submission without prior contact and allows it with contact', async () => {
    const custPhone = '9847223344';

    // Without contact: throws
    await expect(
      repo.addIssueReview({
        proId: 'pro-1',
        reviewerName: 'Suresh P',
        reviewerPhone: custPhone,
        reviewerArea: 'Lake View',
        jobDone: 'Tap repair',
        jobMonth: '2024-02',
        issueTags: ['Work not completed'],
        feedback: 'Technician left before repairing the broken valve pipe.',
        consent: true,
      })
    ).rejects.toThrow('You can report an issue after you contact this pro through EzyFix.');

    // Log contact
    await repo.addContact({
      proId: 'pro-1',
      customerName: 'Suresh P',
      customerPhone: custPhone,
      customerArea: 'Lake View',
    });

    // With contact: succeeds
    const issue = await repo.addIssueReview({
      proId: 'pro-1',
      reviewerName: 'Suresh P',
      reviewerPhone: custPhone,
      reviewerArea: 'Lake View',
      jobDone: 'Tap repair',
      jobMonth: '2024-02',
      issueTags: ['Work not completed', 'Property damage'],
      feedback: 'Technician left before repairing the broken valve pipe and cracked a tile.',
      consent: true,
    });

    expect(issue).toBeDefined();
    expect(issue.reviewerPhone).toBeUndefined(); // private

    const proIssues = await repo.listIssuesForPro('pro-1');
    expect(proIssues.length).toBe(1);
    expect(proIssues[0].reviewerName).toBe('Suresh P');
    expect(proIssues[0].issueTags).toContain('Property damage');
  });

  it('flagEntity() records flags and allows admin to review and resolve/dismiss them', async () => {
    // 1. Flag a pro
    const proFlag = await repo.flagEntity({
      targetType: 'pro',
      targetId: 'pro-2',
      reason: 'Safety or conduct concern',
      details: 'Unprofessional behavior during service call at residence.',
      reporterPhone: '9847334455',
    });
    expect(proFlag.status).toBe('pending');

    // 2. Flag a vouch
    const vouchFlag = await repo.flagEntity({
      targetType: 'vouch',
      targetId: 'v-1',
      reason: 'Fraudulent or fake vouch',
      details: 'This vouch appears fabricated by a family member.',
      reporterPhone: '9847334455',
    });
    expect(vouchFlag.status).toBe('pending');

    // 3. Admin lists flags
    const adminFlags = await repo.listFlagsForAdmin(DEFAULT_ADMIN_PASSCODE);
    expect(adminFlags.length).toBeGreaterThanOrEqual(2);

    const foundProFlag = adminFlags.find((f) => f.id === proFlag.id);
    expect(foundProFlag.targetName).toBe('Biju Thomas');

    // 4. Resolve pro flag
    const resolved = await repo.resolveFlag(
      DEFAULT_ADMIN_PASSCODE,
      proFlag.id,
      'resolved',
      'Investigated and warned pro.'
    );
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolutionNote).toBe('Investigated and warned pro.');

    // 5. Dismiss vouch flag
    const dismissed = await repo.resolveFlag(
      DEFAULT_ADMIN_PASSCODE,
      vouchFlag.id,
      'dismissed',
      'Insufficient evidence.'
    );
    expect(dismissed.status).toBe('dismissed');
  });
});
