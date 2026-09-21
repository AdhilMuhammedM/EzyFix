import React, { useState, useEffect } from 'react';
import { X, Flag, AlertCircle, ShieldAlert } from 'lucide-react';
import { FLAG_REASONS, STORAGE_KEYS } from '../lib/config.js';
import { validateFlag } from '../lib/validation.js';
import { flagEntity } from '../data/repo.js';

export default function FlagModal({
  isOpen,
  onClose,
  targetType = 'pro', // 'pro' | 'vouch'
  targetId,
  targetTitle,
  onFlagSubmitted,
}) {
  const [reason, setReason] = useState(FLAG_REASONS[0]);
  const [details, setDetails] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Prefill phone from customer session if available
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.phone) {
          setReporterPhone(parsed.phone);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      targetType,
      targetId,
      reason,
      details,
      reporterPhone,
    };

    const validation = validateFlag(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const flag = await flagEntity(payload);
      if (onFlagSubmitted) {
        onFlagSubmitted(flag);
      }
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#E6E6E0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-950">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold">
                {targetType === 'vouch' ? 'Flag Suspicious Vouch' : 'Flag Professional'}
              </h2>
              {targetTitle && <p className="text-[11px] text-amber-800 truncate">{targetTitle}</p>}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Flagged reports are sent directly to EzyFix administrators for manual moderation. False reports or abuse of the flagging system are strictly investigated.
            </span>
          </div>

          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block font-semibold text-[#072339] mb-1">
              Reason for flagging <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] text-[#072339]"
            >
              {FLAG_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.reason && <p className="text-red-500 text-[11px] mt-0.5">{errors.reason}</p>}
          </div>

          {/* Details */}
          <div>
            <label className="block font-semibold text-[#072339] mb-1">
              Details & Evidence <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain specifically why you are flagging this pro or vouch..."
              className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Minimum 10 characters</span>
              <span>{details.length} / 500</span>
            </div>
            {errors.details && <p className="text-red-500 text-[11px] mt-0.5">{errors.details}</p>}
          </div>

          {/* Reporter Phone */}
          <div>
            <label className="block font-semibold text-[#072339] mb-1">
              Your phone number (verification) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">
              Kept strictly private for admin verification purposes.
            </p>
            {errors.reporterPhone && <p className="text-red-500 text-[11px] mt-0.5">{errors.reporterPhone}</p>}
          </div>

          {/* Buttons */}
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
              className="flex-1 py-2 px-3 bg-[#072339] hover:bg-[#0D3352] disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow"
            >
              {submitting ? 'Submitting...' : 'Submit Flag to Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
