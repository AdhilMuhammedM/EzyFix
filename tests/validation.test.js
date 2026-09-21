import { describe, it, expect } from 'vitest';
import {
  isValidPhone,
  validatePro,
  validateQualification,
  validateCustomer,
  validateVouch,
  validateIssueReview,
  validateFlag,
} from '../src/lib/validation.js';

describe('Validation Logic', () => {
  describe('Phone Validation (Indian 10-digit mobile)', () => {
    it('accepts valid 10-digit mobile numbers starting with 6-9', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('8123456789')).toBe(true);
      expect(isValidPhone('7000000000')).toBe(true);
      expect(isValidPhone('6999999999')).toBe(true);
    });

    it('rejects invalid phones (too short, starting with <6, letters, symbols)', () => {
      expect(isValidPhone('5876543210')).toBe(false);
      expect(isValidPhone('987654321')).toBe(false); // 9 digits
      expect(isValidPhone('98765432100')).toBe(false); // 11 digits
      expect(isValidPhone('98765abcde')).toBe(false);
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  describe('Pro Validation', () => {
    const validPro = {
      fullName: 'Rahul Varma',
      phone: '9847012345',
      service: 'Electrician',
      homeArea: 'Market Road',
      areasServed: ['Market Road', 'Station Road'],
      yearsExperience: 8,
      languages: ['Malayalam', 'English'],
      skills: ['Wiring', 'Lighting'],
      bio: 'Experienced electrician for all home needs.',
      visitCharge: 200,
      availableNow: true,
    };

    it('validates a correct Pro payload', () => {
      const res = validatePro(validPro);
      expect(res.isValid).toBe(true);
    });

    it('fails if homeArea is not included in areasServed', () => {
      const res = validatePro({
        ...validPro,
        homeArea: 'Lake View',
        areasServed: ['Market Road'],
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.areasServed).toBeDefined();
    });

    it('fails if yearsExperience is negative or > 60', () => {
      expect(validatePro({ ...validPro, yearsExperience: -1 }).isValid).toBe(false);
      expect(validatePro({ ...validPro, yearsExperience: 65 }).isValid).toBe(false);
    });
  });

  describe('Qualification Validation', () => {
    it('validates valid qualification', () => {
      const res = validateQualification({
        type: 'iti_diploma',
        title: 'Diploma in Plumbing',
        issuer: 'State Technical Board',
        year: 2018,
      });
      expect(res.isValid).toBe(true);
    });

    it('fails if year is before 1980 or in the future', () => {
      expect(
        validateQualification({
          type: 'iti_diploma',
          title: 'Diploma in Plumbing',
          issuer: 'State Board',
          year: 1975,
        }).isValid
      ).toBe(false);

      expect(
        validateQualification({
          type: 'iti_diploma',
          title: 'Diploma in Plumbing',
          issuer: 'State Board',
          year: 2050,
        }).isValid
      ).toBe(false);
    });
  });

  describe('Vouch Validation', () => {
    const validVouch = {
      voucherName: 'Anand Kumar',
      voucherPhone: '9123456789',
      voucherArea: 'Lake View',
      jobDone: 'Fixed leaking bathroom tap',
      jobMonth: '2024-02',
      tags: ['On time', 'Clean work'],
      feedback: 'Excellent work done quickly and neatly. Highly recommended!',
      consent: true,
    };

    it('validates a compliant vouch', () => {
      const res = validateVouch(validVouch);
      expect(res.isValid).toBe(true);
    });

    it('rejects feedback with fewer than 20 characters', () => {
      const res = validateVouch({
        ...validVouch,
        feedback: 'Good work.', // < 20 chars
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.feedback).toBeDefined();
    });

    it('rejects if user does not consent', () => {
      const res = validateVouch({
        ...validVouch,
        consent: false,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.consent).toBeDefined();
    });
  });

  describe('Issue Review Validation', () => {
    const validIssue = {
      reviewerName: 'Priya Mohan',
      reviewerPhone: '9847112233',
      reviewerArea: 'Market Road',
      jobDone: 'Kitchen sink pipe repair',
      jobMonth: '2024-02',
      issueTags: ['Work not completed', 'Overcharged / Unfair price'],
      feedback: 'The technician did not complete the job and charged twice the agreed rate.',
      consent: true,
    };

    it('validates a compliant critical review', () => {
      const res = validateIssueReview(validIssue);
      expect(res.isValid).toBe(true);
    });

    it('rejects issue review without issue tags', () => {
      const res = validateIssueReview({ ...validIssue, issueTags: [] });
      expect(res.isValid).toBe(false);
      expect(res.errors.issueTags).toBeDefined();
    });

    it('rejects issue review with feedback under 20 chars', () => {
      const res = validateIssueReview({ ...validIssue, feedback: 'Bad work done.' });
      expect(res.isValid).toBe(false);
      expect(res.errors.feedback).toBeDefined();
    });

    it('rejects issue review without consent', () => {
      const res = validateIssueReview({ ...validIssue, consent: false });
      expect(res.isValid).toBe(false);
      expect(res.errors.consent).toBeDefined();
    });
  });

  describe('Flag Validation', () => {
    const validFlag = {
      targetType: 'pro',
      targetId: 'pro-1',
      reason: 'Safety or conduct concern',
      details: 'Professional displayed aggressive behavior at customer site.',
      reporterPhone: '9847112233',
    };

    it('validates a compliant flag submission', () => {
      const res = validateFlag(validFlag);
      expect(res.isValid).toBe(true);
    });

    it('rejects invalid targetType', () => {
      const res = validateFlag({ ...validFlag, targetType: 'qualification' });
      expect(res.isValid).toBe(false);
      expect(res.errors.targetType).toBeDefined();
    });

    it('rejects details shorter than 10 characters', () => {
      const res = validateFlag({ ...validFlag, details: 'bad' });
      expect(res.isValid).toBe(false);
      expect(res.errors.details).toBeDefined();
    });

    it('rejects invalid reporter phone', () => {
      const res = validateFlag({ ...validFlag, reporterPhone: '12345' });
      expect(res.isValid).toBe(false);
      expect(res.errors.reporterPhone).toBeDefined();
    });
  });
});
