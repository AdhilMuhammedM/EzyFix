import {
  SERVICES,
  AREAS,
  LANGUAGES,
  QUALIFICATION_TYPES,
  VOUCH_TAGS,
  MAX_DOCUMENT_SIZE_BYTES,
} from './config.js';

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates a 10-digit Indian mobile number.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return INDIAN_PHONE_REGEX.test(phone.trim());
}

/**
 * Validates Pro registration / update payload.
 *
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validatePro(data) {
  const errors = {};

  // fullName: 2 to 60 chars
  const name = data.fullName ? data.fullName.trim() : '';
  if (!name || name.length < 2 || name.length > 60) {
    errors.fullName = 'Full name must be between 2 and 60 characters.';
  }

  // phone: 10-digit Indian mobile
  if (!isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
  }

  // service: one of SERVICES
  if (!data.service || !SERVICES.includes(data.service)) {
    errors.service = `Please select a valid service (${SERVICES.join(', ')}).`;
  }

  // homeArea: one of AREAS
  if (!data.homeArea || !AREAS.includes(data.homeArea)) {
    errors.homeArea = `Please select a valid home area (${AREAS.join(', ')}).`;
  }

  // areasServed: array of AREAS, must include homeArea
  if (!Array.isArray(data.areasServed) || data.areasServed.length === 0) {
    errors.areasServed = 'Please select at least one served area.';
  } else {
    const validAreas = data.areasServed.every((a) => AREAS.includes(a));
    if (!validAreas) {
      errors.areasServed = 'One or more selected served areas are invalid.';
    } else if (data.homeArea && !data.areasServed.includes(data.homeArea)) {
      errors.areasServed = 'Areas served must include your home area.';
    }
  }

  // yearsExperience: integer 0 to 60
  const yrs = Number(data.yearsExperience);
  if (
    data.yearsExperience === undefined ||
    data.yearsExperience === '' ||
    isNaN(yrs) ||
    !Number.isInteger(yrs) ||
    yrs < 0 ||
    yrs > 60
  ) {
    errors.yearsExperience = 'Years of experience must be an integer between 0 and 60.';
  }

  // languages: array of LANGUAGES, at least 1
  if (!Array.isArray(data.languages) || data.languages.length === 0) {
    errors.languages = 'Please select at least one language.';
  } else {
    const validLangs = data.languages.every((l) => LANGUAGES.includes(l));
    if (!validLangs) {
      errors.languages = 'One or more selected languages are invalid.';
    }
  }

  // skills: array of free-text tags, max 6, each max 24 chars
  if (data.skills) {
    if (!Array.isArray(data.skills)) {
      errors.skills = 'Skills must be an array of tags.';
    } else if (data.skills.length > 6) {
      errors.skills = 'Maximum 6 skills allowed.';
    } else {
      const invalidTag = data.skills.find(
        (s) => typeof s !== 'string' || s.trim().length === 0 || s.trim().length > 24
      );
      if (invalidTag !== undefined) {
        errors.skills = 'Each skill tag must be between 1 and 24 characters.';
      }
    }
  }

  // bio: max 300 chars
  if (data.bio && typeof data.bio === 'string' && data.bio.length > 300) {
    errors.bio = 'Bio cannot exceed 300 characters.';
  }

  // visitCharge: optional number in rupees >= 0
  if (data.visitCharge !== undefined && data.visitCharge !== '' && data.visitCharge !== null) {
    const charge = Number(data.visitCharge);
    if (isNaN(charge) || charge < 0) {
      errors.visitCharge = 'Visit charge must be a non-negative number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates qualification data.
 *
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateQualification(data) {
  const errors = {};

  // type: one of QUALIFICATION_TYPES
  if (!data.type || !QUALIFICATION_TYPES[data.type]) {
    errors.type = 'Please select a valid qualification type.';
  }

  // title: 3 to 80 chars
  const title = data.title ? data.title.trim() : '';
  if (!title || title.length < 3 || title.length > 80) {
    errors.title = 'Title must be between 3 and 80 characters.';
  }

  // issuer: 2 to 80 chars
  const issuer = data.issuer ? data.issuer.trim() : '';
  if (!issuer || issuer.length < 2 || issuer.length > 80) {
    errors.issuer = 'Issuer must be between 2 and 80 characters.';
  }

  // year: 1980 to current year
  const currentYear = new Date().getFullYear();
  const yr = Number(data.year);
  if (
    !data.year ||
    isNaN(yr) ||
    !Number.isInteger(yr) ||
    yr < 1980 ||
    yr > currentYear
  ) {
    errors.year = `Year must be an integer between 1980 and ${currentYear}.`;
  }

  // document size check if provided
  if (data.documentDataUrl && typeof data.documentDataUrl === 'string') {
    // base64 data url approximate byte length
    const base64Part = data.documentDataUrl.split(',')[1] || '';
    const approxBytes = Math.ceil((base64Part.length * 3) / 4);
    if (approxBytes > MAX_DOCUMENT_SIZE_BYTES) {
      errors.documentDataUrl = 'Attached document exceeds 2 MB limit.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates customer identification.
 *
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateCustomer(data) {
  const errors = {};

  const name = data.name ? data.name.trim() : '';
  if (!name || name.length < 2 || name.length > 60) {
    errors.name = 'Name must be between 2 and 60 characters.';
  }

  if (!isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
  }

  if (!data.area || !AREAS.includes(data.area)) {
    errors.area = 'Please select a valid area.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates vouch input data.
 *
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateVouch(data) {
  const errors = {};

  // voucherName: 2 to 60 chars
  const name = data.voucherName ? data.voucherName.trim() : '';
  if (!name || name.length < 2 || name.length > 60) {
    errors.voucherName = 'Your name must be between 2 and 60 characters.';
  }

  // voucherPhone: valid 10-digit mobile
  if (!isValidPhone(data.voucherPhone)) {
    errors.voucherPhone = 'A valid 10-digit phone number is required.';
  }

  // voucherArea: one of AREAS
  if (!data.voucherArea || !AREAS.includes(data.voucherArea)) {
    errors.voucherArea = 'Please select your area.';
  }

  // jobDone: 3 to 80 chars
  const job = data.jobDone ? data.jobDone.trim() : '';
  if (!job || job.length < 3 || job.length > 80) {
    errors.jobDone = 'Job description must be between 3 and 80 characters.';
  }

  // jobMonth: YYYY-MM, not in future
  if (!data.jobMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.jobMonth)) {
    errors.jobMonth = 'Please select a valid job month (YYYY-MM).';
  } else {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (data.jobMonth > currentMonth) {
      errors.jobMonth = 'Job month cannot be in the future.';
    }
  }

  // tags: array from VOUCH_TAGS, max 5
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.tags = 'Tags must be an array.';
    } else if (data.tags.length > 5) {
      errors.tags = 'Maximum 5 tags allowed.';
    } else {
      const invalidTag = data.tags.find((t) => !VOUCH_TAGS.includes(t));
      if (invalidTag) {
        errors.tags = `Invalid tag: ${invalidTag}.`;
      }
    }
  }

  // feedback: 20 to 500 chars
  const fb = data.feedback ? data.feedback.trim() : '';
  if (!fb || fb.length < 20 || fb.length > 500) {
    errors.feedback = 'Feedback must be between 20 and 500 characters.';
  }

  // consent line
  if (!data.consent) {
    errors.consent = 'You must consent to displaying your name and area on this profile.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
