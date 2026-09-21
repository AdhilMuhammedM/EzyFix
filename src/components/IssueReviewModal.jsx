import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ThumbsDown } from 'lucide-react';
import { ISSUE_TAGS, STORAGE_KEYS, AREAS } from '../lib/config.js';
import { validateIssueReview } from '../lib/validation.js';
import { addIssueReview, getContact } from '../data/repo.js';

export default function IssueReviewModal({ pro, isOpen, onClose, onIssueSubmitted }) {
  const [customer, setCustomer] = useState(null);
  const [contactExists, setContactExists] = useState(false);
  const [checkingContact, setCheckingContact] = useState(true);

  const [formData, setFormData] = useState({
    jobDone: '',
    jobMonth: new Date().toISOString().substring(0, 7),
    issueTags: [],
    feedback: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !pro) return;

    // Check device customer
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name && parsed.phone) {
          setCustomer(parsed);
          checkContact(parsed.phone);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    setCustomer(null);
    setContactExists(false);
    setCheckingContact(false);
  }, [isOpen, pro?.id]);

  const checkContact = async (phone) => {
    setCheckingContact(true);
    try {
      const contact = await getContact(pro.id, phone);
      setContactExists(Boolean(contact));
    } catch {
      setContactExists(false);
    } finally {
      setCheckingContact(false);
    }
  };

  const handleTagToggle = (tag) => {
    if (formData.issueTags.includes(tag)) {
      setFormData({
        ...formData,
        issueTags: formData.issueTags.filter((t) => t !== tag),
      });
    } else {
      if (formData.issueTags.length < 5) {
        setFormData({
          ...formData,
          issueTags: [...formData.issueTags, tag],
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer) return;

    const payload = {
      proId: pro.id,
      reviewerName: customer.name,
      reviewerPhone: customer.phone,
      reviewerArea: customer.area || AREAS[0],
      jobDone: formData.jobDone,
      jobMonth: formData.jobMonth,
      issueTags: formData.issueTags,
      feedback: formData.feedback,
      consent: formData.consent,
    };

    const validation = validateIssueReview(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const newIssue = await addIssueReview(payload);
      if (onIssueSubmitted) {
        onIssueSubmitted(newIssue);
      }
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !pro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#E6E6E0] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-900">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ThumbsDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold">Report an Issue or Bad Experience</h2>
              <p className="text-[11px] text-rose-700">For {pro.fullName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {checkingContact ? (
            <div className="py-8 text-center text-gray-500">
              Verifying previous contact record...
            </div>
          ) : !customer ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Contact required first</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                To keep reviews accountable and prevent anonymous slander, EzyFix requires you to contact the pro through the app before reporting an issue.
              </p>
              <p className="text-[11px] text-amber-800">
                Please tap <strong>Call</strong> on the profile first to identify yourself.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-[#072339] text-white text-xs font-semibold rounded-lg"
                >
                  Understood
                </button>
              </div>
            </div>
          ) : !contactExists ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>No logged contact found</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You are registered as <strong>{customer.name}</strong>, but our records show no contact call made to {pro.fullName} from this device.
              </p>
              <p className="text-[11px] text-amber-800">
                Tap the <strong>Call</strong> button first so your contact is logged.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-[#072339] text-white text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Reviewer Note */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 flex items-center justify-between">
                <span>Reporting as: <strong>{customer.name}</strong> ({customer.area})</span>
                <span className="text-[10px] text-gray-500">Verified Contact</span>
              </div>

              {/* Job Done */}
              <div>
                <label className="block font-semibold text-[#072339] mb-1">
                  Job requested / attempted <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={formData.jobDone}
                  onChange={(e) => setFormData({ ...formData, jobDone: e.target.value })}
                  placeholder="e.g. Bathroom pipe replacement, wiring repair"
                  className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                />
                {errors.jobDone && <p className="text-red-500 text-[11px] mt-0.5">{errors.jobDone}</p>}
              </div>

              {/* Job Month */}
              <div>
                <label className="block font-semibold text-[#072339] mb-1">
                  Month of incident <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  required
                  max={new Date().toISOString().substring(0, 7)}
                  value={formData.jobMonth}
                  onChange={(e) => setFormData({ ...formData, jobMonth: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                />
                {errors.jobMonth && <p className="text-red-500 text-[11px] mt-0.5">{errors.jobMonth}</p>}
              </div>

              {/* Issue Tags */}
              <div>
                <label className="block font-semibold text-[#072339] mb-1">
                  What went wrong? (Select 1 to 5) <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ISSUE_TAGS.map((tag) => {
                    const isSelected = formData.issueTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-semibold'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {errors.issueTags && <p className="text-red-500 text-[11px] mt-1">{errors.issueTags}</p>}
              </div>

              {/* Detailed Feedback */}
              <div>
                <label className="block font-semibold text-[#072339] mb-1">
                  Detailed explanation (20 to 500 characters) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Explain what happened objectively. Describe the work done or not done, issues encountered, and costs."
                  className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Minimum 20 characters</span>
                  <span>{formData.feedback.length} / 500</span>
                </div>
                {errors.feedback && <p className="text-red-500 text-[11px] mt-0.5">{errors.feedback}</p>}
              </div>

              {/* Consent Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-gray-700 leading-tight">
                    I verify this is an authentic report based on direct contact. Show my name and area on this pro's profile. My phone number stays private.
                  </span>
                </label>
                {errors.consent && <p className="text-red-500 text-[11px] mt-1">{errors.consent}</p>}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow"
                >
                  {submitting ? 'Submitting...' : 'Post Critical Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
