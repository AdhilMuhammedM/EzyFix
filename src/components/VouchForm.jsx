import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { VOUCH_TAGS, STORAGE_KEYS, AREAS } from '../lib/config.js';
import { validateVouch } from '../lib/validation.js';
import { addVouch, getContact } from '../data/repo.js';

export default function VouchForm({ pro, isOpen, onClose, onVouchSubmitted }) {
  const [customer, setCustomer] = useState(null);
  const [contactExists, setContactExists] = useState(false);
  const [checkingContact, setCheckingContact] = useState(true);

  const [formData, setFormData] = useState({
    jobDone: '',
    jobMonth: new Date().toISOString().substring(0, 7), // current YYYY-MM
    tags: [],
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
    } catch (err) {
      setContactExists(false);
    } finally {
      setCheckingContact(false);
    }
  };

  const handleTagToggle = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t) => t !== tag),
      });
    } else {
      if (formData.tags.length < 5) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tag],
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer) return;

    const payload = {
      proId: pro.id,
      voucherName: customer.name,
      voucherPhone: customer.phone,
      voucherArea: customer.area,
      jobDone: formData.jobDone,
      jobMonth: formData.jobMonth,
      tags: formData.tags,
      feedback: formData.feedback,
      consent: formData.consent,
    };

    const validation = validateVouch(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const newVouch = await addVouch(payload);
      if (onVouchSubmitted) {
        onVouchSubmitted(newVouch);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E6E6E0] shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#072339] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FDB60C]" />
            <h3 className="font-serif text-sm font-semibold text-white">
              Vouch for {pro.fullName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {checkingContact ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Verifying contact history...
            </div>
          ) : !customer || !contactExists ? (
            /* Blocked state per Section 7 Rule 2 */
            <div className="py-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-sm font-semibold text-[#072339]">
                Contact required before vouching
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed px-2">
                You can vouch after you contact this pro through EzyFix. This keeps vouches authentic and prevents fake testimonials.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#072339] text-white text-xs font-medium rounded-lg"
                >
                  Understood
                </button>
              </div>
            </div>
          ) : (
            /* Compliant Vouch Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errors.form}
                </div>
              )}

              {/* Verified Voucher Info */}
              <div className="p-2.5 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] text-xs flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Vouching as: </span>
                  <span className="font-semibold text-[#072339]">{customer.name}</span>
                </div>
                <span className="text-gray-500 font-medium">{customer.area}</span>
              </div>

              {/* Job Done */}
              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  What work did they do? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={formData.jobDone}
                  onChange={(e) => setFormData({ ...formData, jobDone: e.target.value })}
                  placeholder="e.g. Fixed a leaking kitchen tap"
                  className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>3 to 80 characters</span>
                  <span>{formData.jobDone.length}/80</span>
                </div>
                {errors.jobDone && <p className="text-[11px] text-red-600 mt-0.5">{errors.jobDone}</p>}
              </div>

              {/* Month */}
              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  When was the work done? <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  required
                  max={new Date().toISOString().substring(0, 7)}
                  value={formData.jobMonth}
                  onChange={(e) => setFormData({ ...formData, jobMonth: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                />
                {errors.jobMonth && <p className="text-[11px] text-red-600 mt-0.5">{errors.jobMonth}</p>}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  Choose tags (up to 5)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VOUCH_TAGS.map((tag) => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-[#072339] text-white border-[#072339] font-medium'
                            : 'bg-[#F8F8F6] text-[#072339] border-[#E6E6E0] hover:bg-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {errors.tags && <p className="text-[11px] text-red-600 mt-0.5">{errors.tags}</p>}
              </div>

              {/* Written Feedback */}
              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  Your feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Share a couple sentences describing how the work went..."
                  className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>20 to 500 characters</span>
                  <span>{formData.feedback.length}/500</span>
                </div>
                {errors.feedback && <p className="text-[11px] text-red-600 mt-0.5">{errors.feedback}</p>}
              </div>

              {/* Consent Line per Section 7 Rule 9 */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded border-[#E6E6E0] text-[#072339] focus:ring-0"
                  />
                  <span className="leading-snug">
                    Show my name and area on this pro's profile. My phone stays private.
                  </span>
                </label>
                {errors.consent && <p className="text-[11px] text-red-600 mt-1">{errors.consent}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting vouch...' : `Vouch for ${pro.fullName}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
