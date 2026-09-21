import {
  STORAGE_KEYS,
  DEFAULT_ADMIN_PASSCODE,
  MAX_VOUCHES_PER_PHONE_PER_DAY,
  MIN_HOURS_AFTER_CONTACT,
  MAX_QUALIFICATIONS_PER_PRO,
  PRO_DURATION_DAYS,
} from '../lib/config.js';
import { generateSeedData } from './seed.js';
import {
  validatePro,
  validateQualification,
  validateVouch,
  validateCustomer,
  isValidPhone,
  validateIssueReview,
  validateFlag,
} from '../lib/validation.js';

function getAdminPasscode() {
  return import.meta.env?.VITE_ADMIN_PASSCODE || DEFAULT_ADMIN_PASSCODE;
}

function verifyAdmin(passcode) {
  const expected = getAdminPasscode();
  if (!passcode || passcode.trim() !== expected.trim()) {
    throw new Error('Invalid admin passcode.');
  }
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateManageCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Sanitizes a Pro object for public views (removes phone & manageCode, includes proUntil)
 */
export function sanitizePro(pro) {
  if (!pro) return null;
  const { phone, manageCode, proUntil, ...publicFields } = pro;
  return {
    ...publicFields,
    proUntil: proUntil || null,
  };
}

/**
 * Sanitizes a Vouch object for public views (removes voucherPhone)
 */
export function sanitizeVouch(vouch) {
  if (!vouch) return null;
  const { voucherPhone, ...publicFields } = vouch;
  return publicFields;
}

/**
 * Sanitizes an Issue review for public views (removes reviewerPhone)
 */
export function sanitizeIssueReview(issue) {
  if (!issue) return null;
  const { reviewerPhone, ...publicFields } = issue;
  return publicFields;
}

/**
 * Sanitizes a Qualification object based on scope
 */
export function sanitizeQualification(qual, scope = 'public') {
  if (!qual) return null;
  if (scope === 'public') {
    const { credentialNumber, documentDataUrl, rejectReason, ...publicFields } = qual;
    return publicFields;
  }
  return qual;
}

/**
 * Loads entire database from localStorage or initializes with seed
 */
function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DB);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.issues) parsed.issues = [];
      if (!parsed.flags) parsed.flags = [];
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse localStorage db:', err);
  }

  const initial = generateSeedData();
  saveDb(initial);
  return initial;
}

/**
 * Saves database state to localStorage
 */
function saveDb(db) {
  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(db));
}

// -------------------------------------------------------------
// REPO IMPLEMENTATION (All functions are async)
// -------------------------------------------------------------

/**
 * Returns all pros with public fields only (phone and manageCode stripped).
 * @returns {Promise<Array>}
 */
export async function listPros() {
  const db = loadDb();
  return db.pros.map(sanitizePro);
}

/**
 * Returns a single pro by ID with public fields only.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getPro(id) {
  const db = loadDb();
  const pro = db.pros.find((p) => p.id === id);
  return pro ? sanitizePro(pro) : null;
}

/**
 * Creates a new Pro.
 * @param {Object} data
 * @returns {Promise<{ pro: Object, manageCode: string }>}
 */
export async function createPro(data) {
  const validation = validatePro(data);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid pro data.');
  }

  const db = loadDb();
  const existing = db.pros.find((p) => p.phone === data.phone.trim());
  if (existing) {
    throw new Error('A professional with this phone number is already registered.');
  }

  const manageCode = generateManageCode();
  const newPro = {
    id: generateId('pro'),
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    service: data.service,
    homeArea: data.homeArea,
    areasServed: [...data.areasServed],
    yearsExperience: Number(data.yearsExperience),
    languages: [...data.languages],
    skills: Array.isArray(data.skills) ? [...data.skills] : [],
    bio: data.bio ? data.bio.trim() : '',
    visitCharge:
      data.visitCharge !== undefined && data.visitCharge !== ''
        ? Number(data.visitCharge)
        : null,
    availableNow: Boolean(data.availableNow),
    manageCode,
    proUntil: null, // New pros start on Free plan
    createdAt: new Date().toISOString(),
  };

  db.pros.push(newPro);
  saveDb(db);

  return {
    pro: sanitizePro(newPro),
    manageCode,
  };
}

/**
 * Looks up pro by private phone and manage code.
 * @param {{ phone: string, manageCode: string }} credentials
 * @returns {Promise<Object|null>}
 */
export async function getProByManageAccess({ phone, manageCode }) {
  if (!phone || !manageCode) return null;
  const db = loadDb();
  const targetPhone = phone.trim();
  const targetCode = manageCode.trim().toUpperCase();

  const pro = db.pros.find(
    (p) => p.phone === targetPhone && p.manageCode.toUpperCase() === targetCode
  );
  return pro ? { ...pro } : null;
}

/**
 * Updates an existing pro given valid manageCode.
 * @param {string} id
 * @param {string} manageCode
 * @param {Object} patch
 * @returns {Promise<Object>}
 */
export async function updatePro(id, manageCode, patch) {
  const db = loadDb();
  const proIndex = db.pros.findIndex((p) => p.id === id);
  if (proIndex === -1) {
    throw new Error('Professional not found.');
  }

  const pro = db.pros[proIndex];
  if (pro.manageCode.toUpperCase() !== manageCode.trim().toUpperCase()) {
    throw new Error('Invalid manage code.');
  }

  // Merge allowed editable fields
  const updated = {
    ...pro,
    ...(patch.fullName !== undefined && { fullName: patch.fullName.trim() }),
    ...(patch.service !== undefined && { service: patch.service }),
    ...(patch.homeArea !== undefined && { homeArea: patch.homeArea }),
    ...(patch.areasServed !== undefined && { areasServed: [...patch.areasServed] }),
    ...(patch.yearsExperience !== undefined && { yearsExperience: Number(patch.yearsExperience) }),
    ...(patch.languages !== undefined && { languages: [...patch.languages] }),
    ...(patch.skills !== undefined && { skills: [...patch.skills] }),
    ...(patch.bio !== undefined && { bio: patch.bio.trim() }),
    ...(patch.visitCharge !== undefined && {
      visitCharge: patch.visitCharge !== '' && patch.visitCharge !== null ? Number(patch.visitCharge) : null,
    }),
    ...(patch.availableNow !== undefined && { availableNow: Boolean(patch.availableNow) }),
  };

  const validation = validatePro(updated);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid pro data.');
  }

  db.pros[proIndex] = updated;
  saveDb(db);

  return sanitizePro(updated);
}

/**
 * Subscribes a pro to the mock Pro plan.
 * Sets proUntil to max(now, current proUntil) + PRO_DURATION_DAYS.
 * No payment data is collected or stored.
 *
 * @param {string} id
 * @param {string} manageCode
 * @param {{ days?: number }} options
 * @returns {Promise<Object>}
 */
export async function subscribePro(id, manageCode, { days = PRO_DURATION_DAYS } = {}) {
  const db = loadDb();
  const proIndex = db.pros.findIndex((p) => p.id === id);
  if (proIndex === -1) {
    throw new Error('Professional not found.');
  }

  const pro = db.pros[proIndex];
  if (!manageCode || pro.manageCode.toUpperCase() !== manageCode.trim().toUpperCase()) {
    throw new Error('Invalid manage code.');
  }

  const nowMs = Date.now();
  const currentUntilMs = pro.proUntil ? new Date(pro.proUntil).getTime() : 0;
  const baseMs = Math.max(nowMs, isNaN(currentUntilMs) ? 0 : currentUntilMs);
  const durationDays = Number(days) || PRO_DURATION_DAYS;
  const addMs = durationDays * 24 * 60 * 60 * 1000;

  pro.proUntil = new Date(baseMs + addMs).toISOString();
  db.pros[proIndex] = pro;
  saveDb(db);

  return sanitizePro(pro);
}

/**
 * Cancels a pro's Pro subscription, returning them to the Free plan.
 * Sets proUntil to null.
 *
 * @param {string} id
 * @param {string} manageCode
 * @returns {Promise<Object>}
 */
export async function cancelPro(id, manageCode) {
  const db = loadDb();
  const proIndex = db.pros.findIndex((p) => p.id === id);
  if (proIndex === -1) {
    throw new Error('Professional not found.');
  }

  const pro = db.pros[proIndex];
  if (!manageCode || pro.manageCode.toUpperCase() !== manageCode.trim().toUpperCase()) {
    throw new Error('Invalid manage code.');
  }

  pro.proUntil = null;
  db.pros[proIndex] = pro;
  saveDb(db);

  return sanitizePro(pro);
}

/**
 * Lists qualifications for a pro.
 * @param {string} proId
 * @param {{ scope?: 'public' | 'owner' | 'admin' }} options
 * @returns {Promise<Array>}
 */
export async function listQualifications(proId, { scope = 'public' } = {}) {
  const db = loadDb();
  let list = db.qualifications.filter((q) => q.proId === proId);

  if (scope === 'public') {
    list = list.filter((q) => q.status === 'approved');
  }

  return list.map((q) => sanitizeQualification(q, scope));
}

/**
 * Adds a new qualification in 'pending' status.
 * @param {string} proId
 * @param {string} manageCode
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function addQualification(proId, manageCode, data) {
  const db = loadDb();
  const pro = db.pros.find((p) => p.id === proId);
  if (!pro || pro.manageCode.toUpperCase() !== manageCode.trim().toUpperCase()) {
    throw new Error('Unauthorized pro access.');
  }

  // Check maximum 8 submitted qualifications per pro
  const existingCount = db.qualifications.filter((q) => q.proId === proId).length;
  if (existingCount >= MAX_QUALIFICATIONS_PER_PRO) {
    throw new Error(`Maximum limit of ${MAX_QUALIFICATIONS_PER_PRO} qualifications reached.`);
  }

  const validation = validateQualification(data);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid qualification details.');
  }

  const newQual = {
    id: generateId('qual'),
    proId,
    type: data.type,
    title: data.title.trim(),
    issuer: data.issuer.trim(),
    year: Number(data.year),
    credentialNumber: data.credentialNumber ? data.credentialNumber.trim() : null,
    documentDataUrl: data.documentDataUrl || null,
    status: 'pending',
    rejectReason: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
  };

  db.qualifications.push(newQual);
  saveDb(db);

  return newQual;
}

/**
 * Deletes a qualification (pending status only).
 * @param {string} id
 * @param {string} manageCode
 * @returns {Promise<void>}
 */
export async function deleteQualification(id, manageCode) {
  const db = loadDb();
  const qualIndex = db.qualifications.findIndex((q) => q.id === id);
  if (qualIndex === -1) {
    throw new Error('Qualification not found.');
  }

  const qual = db.qualifications[qualIndex];
  const pro = db.pros.find((p) => p.id === qual.proId);
  if (!pro || pro.manageCode.toUpperCase() !== manageCode.trim().toUpperCase()) {
    throw new Error('Unauthorized to delete this qualification.');
  }

  if (qual.status !== 'pending') {
    throw new Error('Only pending qualifications can be deleted by the owner.');
  }

  db.qualifications.splice(qualIndex, 1);
  saveDb(db);
}

/**
 * Lists all pending qualifications across all pros for admin review.
 * @param {string} adminPasscode
 * @returns {Promise<Array>}
 */
export async function listPendingQualifications(adminPasscode) {
  verifyAdmin(adminPasscode);
  const db = loadDb();
  const pending = db.qualifications.filter((q) => q.status === 'pending');

  return pending.map((q) => {
    const pro = db.pros.find((p) => p.id === q.proId);
    return {
      ...q,
      proName: pro ? pro.fullName : 'Unknown Pro',
      proService: pro ? pro.service : '',
    };
  });
}

/**
 * Reviews a qualification (approve or reject with reason).
 * @param {string} adminPasscode
 * @param {string} id
 * @param {'approved' | 'rejected'} decision
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
export async function reviewQualification(adminPasscode, id, decision, reason = '') {
  verifyAdmin(adminPasscode);
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error("Decision must be either 'approved' or 'rejected'.");
  }

  const db = loadDb();
  const qualIndex = db.qualifications.findIndex((q) => q.id === id);
  if (qualIndex === -1) {
    throw new Error('Qualification not found.');
  }

  const qual = db.qualifications[qualIndex];
  qual.status = decision;
  qual.reviewedAt = new Date().toISOString();
  qual.rejectReason = decision === 'rejected' ? (reason ? reason.trim() : 'Document does not meet verification criteria.') : null;

  db.qualifications[qualIndex] = qual;
  saveDb(db);

  return qual;
}

/**
 * Lists vouches for a pro, sorted newest first.
 * Voucher phone is never returned in public objects.
 * @param {string} proId
 * @param {{ includeRemoved?: boolean }} options
 * @returns {Promise<Array>}
 */
export async function listVouches(proId, { includeRemoved = false } = {}) {
  const db = loadDb();
  let list = db.vouches.filter((v) => v.proId === proId);

  if (!includeRemoved) {
    list = list.filter((v) => v.status === 'active');
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return list.map(sanitizeVouch);
}

/**
 * Internal helper to retrieve raw vouches with voucherPhone (for scoring / verification)
 */
export async function listRawVouchesForPro(proId) {
  const db = loadDb();
  return db.vouches.filter((v) => v.proId === proId && v.status === 'active');
}

/**
 * Internal helper to retrieve raw qualifications for scoring
 */
export async function listRawQualificationsForPro(proId) {
  const db = loadDb();
  return db.qualifications.filter((q) => q.proId === proId && q.status === 'approved');
}

/**
 * Logs a contact when a customer taps Call.
 * One contact per (proId, customerPhone). If exists, updates lastContactedAt.
 * @param {Object} data { proId, customerName, customerPhone, customerArea }
 * @returns {Promise<Object>}
 */
export async function addContact(data) {
  const customerValidation = validateCustomer({
    name: data.customerName,
    phone: data.customerPhone,
    area: data.customerArea,
  });
  if (!customerValidation.isValid) {
    const firstMsg = Object.values(customerValidation.errors)[0];
    throw new Error(firstMsg || 'Invalid customer details.');
  }

  const db = loadDb();
  const pro = db.pros.find((p) => p.id === data.proId);
  if (!pro) {
    throw new Error('Professional not found.');
  }

  const custPhone = data.customerPhone.trim();
  const existingIndex = db.contacts.findIndex(
    (c) => c.proId === data.proId && c.customerPhone === custPhone
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    db.contacts[existingIndex].lastContactedAt = now;
    db.contacts[existingIndex].customerName = data.customerName.trim();
    db.contacts[existingIndex].customerArea = data.customerArea;
    saveDb(db);
    return db.contacts[existingIndex];
  }

  const newContact = {
    id: generateId('contact'),
    proId: data.proId,
    customerName: data.customerName.trim(),
    customerPhone: custPhone,
    customerArea: data.customerArea,
    createdAt: now,
    lastContactedAt: now,
  };

  db.contacts.push(newContact);
  saveDb(db);

  return newContact;
}

/**
 * Returns contact record for a pro and customer phone.
 * @param {string} proId
 * @param {string} customerPhone
 * @returns {Promise<Object|null>}
 */
export async function getContact(proId, customerPhone) {
  if (!proId || !customerPhone) return null;
  const db = loadDb();
  const contact = db.contacts.find(
    (c) => c.proId === proId && c.customerPhone === customerPhone.trim()
  );
  return contact || null;
}

/**
 * Adds a vouch adhering strictly to Section 7 domain rules.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function addVouch(data) {
  const validation = validateVouch(data);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid vouch details.');
  }

  const db = loadDb();
  const pro = db.pros.find((p) => p.id === data.proId);
  if (!pro) {
    throw new Error('Professional not found.');
  }

  const vPhone = data.voucherPhone.trim();

  // Rule 2: A contact must exist for this pro and this customer phone
  const contact = db.contacts.find(
    (c) => c.proId === data.proId && c.customerPhone === vPhone
  );
  if (!contact) {
    throw new Error('You can vouch after you contact this pro through EzyFix.');
  }

  // Rule 4: voucherPhone must not equal pro's phone
  if (vPhone === pro.phone) {
    throw new Error('You cannot vouch for your own profile.');
  }

  // Rule 3: One active vouch per phone per pro
  const existingActiveVouch = db.vouches.find(
    (v) => v.proId === data.proId && v.voucherPhone === vPhone && v.status === 'active'
  );
  if (existingActiveVouch) {
    throw new Error('You have already submitted an active vouch for this professional.');
  }

  // Rule 5: At most MAX_VOUCHES_PER_PHONE_PER_DAY = 3 per phone per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentVouchesByPhone = db.vouches.filter(
    (v) =>
      v.voucherPhone === vPhone &&
      v.status === 'active' &&
      v.createdAt >= oneDayAgo
  );
  if (recentVouchesByPhone.length >= MAX_VOUCHES_PER_PHONE_PER_DAY) {
    throw new Error(
      `Daily vouch limit reached (maximum ${MAX_VOUCHES_PER_PHONE_PER_DAY} vouches per day).`
    );
  }

  // Rule 6: MIN_HOURS_AFTER_CONTACT check
  if (MIN_HOURS_AFTER_CONTACT > 0) {
    const hoursSinceContact =
      (Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceContact < MIN_HOURS_AFTER_CONTACT) {
      throw new Error(
        `Vouching is available ${MIN_HOURS_AFTER_CONTACT} hour(s) after initial contact.`
      );
    }
  }

  const newVouch = {
    id: generateId('vouch'),
    proId: data.proId,
    contactId: contact.id,
    voucherName: data.voucherName.trim(),
    voucherPhone: vPhone, // stored privately in db
    voucherArea: data.voucherArea,
    jobDone: data.jobDone.trim(),
    jobMonth: data.jobMonth,
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    feedback: data.feedback.trim(),
    status: 'active',
    removedReason: null,
    createdAt: new Date().toISOString(),
  };

  db.vouches.push(newVouch);
  saveDb(db);

  return sanitizeVouch(newVouch);
}

/**
 * Removes a vouch with a reason (Admin only).
 * @param {string} adminPasscode
 * @param {string} id
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export async function removeVouch(adminPasscode, id, reason) {
  verifyAdmin(adminPasscode);
  const db = loadDb();
  const vouchIndex = db.vouches.findIndex((v) => v.id === id);
  if (vouchIndex === -1) {
    throw new Error('Vouch not found.');
  }

  const vouch = db.vouches[vouchIndex];
  vouch.status = 'removed';
  vouch.removedReason = reason ? reason.trim() : 'Removed by administrator.';

  db.vouches[vouchIndex] = vouch;
  saveDb(db);

  return sanitizeVouch(vouch);
}

/**
 * Returns pro's phone ONLY if a contact exists for (proId, customerPhone).
 * @param {string} proId
 * @param {string} customerPhone
 * @returns {Promise<string|null>}
 */
export async function getCallNumber(proId, customerPhone) {
  if (!proId || !customerPhone) return null;
  const db = loadDb();
  const contact = db.contacts.find(
    (c) => c.proId === proId && c.customerPhone === customerPhone.trim()
  );
  if (!contact) return null;

  const pro = db.pros.find((p) => p.id === proId);
  return pro ? pro.phone : null;
}

/**
 * Lists all vouches across all pros for Admin screen.
 * @param {string} adminPasscode
 * @returns {Promise<Array>}
 */
export async function listAllVouchesForAdmin(adminPasscode) {
  verifyAdmin(adminPasscode);
  const db = loadDb();
  return db.vouches.map((v) => {
    const pro = db.pros.find((p) => p.id === v.proId);
    return {
      ...v,
      proName: pro ? pro.fullName : 'Unknown Pro',
      proService: pro ? pro.service : '',
    };
  });
}

/**
 * Resets database to initial seed dataset.
 * @param {string} adminPasscode
 * @returns {Promise<void>}
 */
export async function resetDemoData(adminPasscode) {
  verifyAdmin(adminPasscode);
  const seed = generateSeedData();
  saveDb(seed);
}

// -------------------------------------------------------------
// BAD REVIEWS / ISSUES
// -------------------------------------------------------------

/**
 * Adds an issue / critical review for a pro after contact verification.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function addIssueReview(data) {
  const validation = validateIssueReview(data);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid review details.');
  }

  const db = loadDb();
  const pro = db.pros.find((p) => p.id === data.proId);
  if (!pro) {
    throw new Error('Professional not found.');
  }

  const rPhone = data.reviewerPhone.trim();

  // Contact must exist
  const contact = db.contacts.find(
    (c) => c.proId === data.proId && c.customerPhone === rPhone
  );
  if (!contact) {
    throw new Error('You can report an issue after you contact this pro through EzyFix.');
  }

  if (rPhone === pro.phone) {
    throw new Error('You cannot review your own profile.');
  }

  const existingActive = db.issues.find(
    (i) => i.proId === data.proId && i.reviewerPhone === rPhone && i.status === 'active'
  );
  if (existingActive) {
    throw new Error('You have already submitted an active review for this professional.');
  }

  const newIssue = {
    id: generateId('issue'),
    proId: data.proId,
    contactId: contact.id,
    reviewerName: data.reviewerName.trim(),
    reviewerPhone: rPhone,
    reviewerArea: data.reviewerArea,
    jobDone: data.jobDone.trim(),
    jobMonth: data.jobMonth,
    issueTags: Array.isArray(data.issueTags) ? [...data.issueTags] : [],
    feedback: data.feedback.trim(),
    status: 'active',
    removedReason: null,
    createdAt: new Date().toISOString(),
  };

  db.issues.push(newIssue);
  saveDb(db);

  return sanitizeIssueReview(newIssue);
}

/**
 * Lists public issues / bad reviews for a pro, sorted newest first.
 * @param {string} proId
 * @param {{ includeRemoved?: boolean }} options
 * @returns {Promise<Array>}
 */
export async function listIssuesForPro(proId, { includeRemoved = false } = {}) {
  const db = loadDb();
  let list = (db.issues || []).filter((i) => i.proId === proId);

  if (!includeRemoved) {
    list = list.filter((i) => i.status === 'active');
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list.map(sanitizeIssueReview);
}

/**
 * Internal helper to retrieve raw issues with reviewer phone
 */
export async function listRawIssuesForPro(proId) {
  const db = loadDb();
  return (db.issues || []).filter((i) => i.proId === proId && i.status === 'active');
}

/**
 * Removes an issue review (Admin only).
 * @param {string} adminPasscode
 * @param {string} id
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export async function removeIssueReview(adminPasscode, id, reason = '') {
  verifyAdmin(adminPasscode);
  const db = loadDb();
  const index = (db.issues || []).findIndex((i) => i.id === id);
  if (index === -1) {
    throw new Error('Issue review not found.');
  }

  const issue = db.issues[index];
  issue.status = 'removed';
  issue.removedReason = reason ? reason.trim() : 'Removed by administrator.';

  db.issues[index] = issue;
  saveDb(db);

  return sanitizeIssueReview(issue);
}

// -------------------------------------------------------------
// FLAGGING & MODERATION
// -------------------------------------------------------------

/**
 * Flags a pro or vouch for administrator investigation.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function flagEntity(data) {
  const validation = validateFlag(data);
  if (!validation.isValid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Invalid flag report details.');
  }

  const db = loadDb();

  // Check target exists
  if (data.targetType === 'pro') {
    const pro = db.pros.find((p) => p.id === data.targetId);
    if (!pro) throw new Error('Professional not found.');
  } else if (data.targetType === 'vouch') {
    const vouch = db.vouches.find((v) => v.id === data.targetId);
    if (!vouch) throw new Error('Vouch not found.');
  }

  const newFlag = {
    id: generateId('flag'),
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason,
    details: data.details.trim(),
    reporterPhone: data.reporterPhone.trim(),
    status: 'pending', // pending | resolved | dismissed
    resolutionNote: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  db.flags.push(newFlag);
  saveDb(db);

  return newFlag;
}

/**
 * Lists all flags for the Admin dashboard.
 * @param {string} adminPasscode
 * @returns {Promise<Array>}
 */
export async function listFlagsForAdmin(adminPasscode) {
  verifyAdmin(adminPasscode);
  const db = loadDb();

  return (db.flags || []).map((f) => {
    let targetName = 'Unknown';
    let targetContext = '';

    if (f.targetType === 'pro') {
      const pro = db.pros.find((p) => p.id === f.targetId);
      if (pro) {
        targetName = pro.fullName;
        targetContext = `${pro.service} · ${pro.homeArea}`;
      }
    } else if (f.targetType === 'vouch') {
      const vouch = db.vouches.find((v) => v.id === f.targetId);
      if (vouch) {
        const pro = db.pros.find((p) => p.id === vouch.proId);
        targetName = `Vouch by ${vouch.voucherName}`;
        targetContext = `For ${pro ? pro.fullName : 'Pro'}: "${vouch.feedback.substring(0, 60)}..."`;
      }
    }

    return {
      ...f,
      targetName,
      targetContext,
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Resolves or dismisses a flag (Admin only).
 * @param {string} adminPasscode
 * @param {string} id
 * @param {'resolved' | 'dismissed'} decision
 * @param {string} note
 * @returns {Promise<Object>}
 */
export async function resolveFlag(adminPasscode, id, decision, note = '') {
  verifyAdmin(adminPasscode);
  if (decision !== 'resolved' && decision !== 'dismissed') {
    throw new Error("Decision must be 'resolved' or 'dismissed'.");
  }

  const db = loadDb();
  const index = (db.flags || []).findIndex((f) => f.id === id);
  if (index === -1) {
    throw new Error('Flag not found.');
  }

  const flag = db.flags[index];
  flag.status = decision;
  flag.resolutionNote = note ? note.trim() : null;
  flag.resolvedAt = new Date().toISOString();

  db.flags[index] = flag;
  saveDb(db);

  return flag;
}
