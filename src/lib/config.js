export const SERVICES = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
];

export const AREAS = [
  'Lake View',
  'Market Road',
  'Church Junction',
  'Station Road',
];

export const LANGUAGES = [
  'Malayalam',
  'English',
  'Hindi',
  'Tamil',
];

export const VOUCH_TAGS = [
  'On time',
  'Fair price',
  'Clean work',
  'Good communication',
  'Would hire again',
];

export const TRUST_LEVELS = [
  { minVouches: 3, level: 2, label: 'Highly trusted', bg: '#D6E3D3' },
  { minVouches: 1, level: 1, label: 'Community vouched', bg: '#F8E3A6' },
  { minVouches: 0, level: 0, label: 'New', bg: '#F1D9D3' },
];

export const QUALIFICATION_TYPES = {
  professional_certification: {
    label: 'Professional certification',
    points: 1,
  },
  iti_diploma: {
    label: 'ITI, diploma or degree',
    points: 1,
  },
  trade_licence: {
    label: 'Trade licence',
    points: 1,
  },
  training_course: {
    label: 'Training course',
    points: 1,
  },
  work_reference: {
    label: 'Work reference',
    points: 1,
  },
};

export const MAX_SKILL_POINTS = 4;

export const SKILL_LEVELS = [
  { minPoints: 2, level: 2, label: 'Expert', pips: 3, bg: '#E4DFF5' },
  { minPoints: 1, level: 1, label: 'Skilled', pips: 2, bg: '#DCE8F5' },
  { minPoints: 0, level: 0, label: 'Starter', pips: 1, bg: '#ECEBE6' },
];

export const SORT_MODES = [
  { id: 'best', label: 'Best match', hint: 'Best match balances trust and verified skills. New pros with proof of skill still show up.' },
  { id: 'trust', label: 'Most trusted', hint: 'Ranked purely by verified community vouches, then skills.' },
  { id: 'skill', label: 'Most skilled', hint: 'Ranked by approved technical qualifications, then vouches.' },
];

export const PLANS = {
  free: {
    id: 'free',
    label: 'Free plan',
  },
  pro: {
    id: 'pro',
    label: 'Pro plan',
  },
};

export const PRO_DURATION_DAYS = 30;
export const PRO_PRICE_INR_PER_MONTH = 199; // display only (demo price)
export const FREE_VISIBLE_VOUCHES = 1;

export const MAX_VOUCHES_PER_PHONE_PER_DAY = 3;
export const MIN_HOURS_AFTER_CONTACT = 0;
export const MAX_QUALIFICATIONS_PER_PRO = 8;
export const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const STORAGE_KEYS = {
  DB: 'ezyfix.db.v1',
  CUSTOMER: 'ezyfix.customer',
  MANAGE: 'ezyfix.manage',
};

export const DEFAULT_ADMIN_PASSCODE = 'admin123';

export const COLORS = {
  navy: '#072339',
  amber: '#FDB60C',
  offWhite: '#F8F8F6',
  border: '#E6E6E0',
};
