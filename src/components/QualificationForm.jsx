import React, { useState } from 'react';
import { X, Award, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { QUALIFICATION_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '../lib/config.js';
import { validateQualification } from '../lib/validation.js';
import { addQualification } from '../data/repo.js';

export default function QualificationForm({
  proId,
  manageCode,
  isOpen,
  onClose,
  onQualificationAdded,
}) {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    type: 'iti_diploma',
    title: '',
    issuer: '',
    year: currentYear,
    credentialNumber: '',
    documentDataUrl: '',
  });

  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData({ ...formData, documentDataUrl: '' });
      setFileName('');
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setErrors({ documentDataUrl: 'Document file size must be under 2 MB.' });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, documentDataUrl: reader.result });
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.documentDataUrl;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateQualification(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const created = await addQualification(proId, manageCode, formData);
      if (onQualificationAdded) {
        onQualificationAdded(created);
      }
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E6E6E0] shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#072339] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FDB60C]" />
            <h3 className="font-serif text-sm font-semibold text-white">
              Add Qualification
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {errors.form && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errors.form}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Submit verified technical certificates, trade licences, or diplomas to earn skill points.
          </p>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Qualification type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            >
              {Object.entries(QUALIFICATION_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Title / Degree / Course name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. ITI Craftsman Plumbing Certificate"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.title && <p className="text-[11px] text-red-600 mt-0.5">{errors.title}</p>}
          </div>

          {/* Issuer */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Issuing authority / Institution <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="e.g. Govt ITI / State Licensing Board"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.issuer && <p className="text-[11px] text-red-600 mt-0.5">{errors.issuer}</p>}
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Year of completion / issuance <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1980}
              max={currentYear}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.year && <p className="text-[11px] text-red-600 mt-0.5">{errors.year}</p>}
          </div>

          {/* Credential Number (Optional, private) */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Certificate / Licence number <span className="text-gray-400 font-normal">(private, optional)</span>
            </label>
            <input
              type="text"
              maxLength={60}
              value={formData.credentialNumber}
              onChange={(e) => setFormData({ ...formData, credentialNumber: e.target.value })}
              placeholder="e.g. ITI-KL-2018-9923"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
          </div>

          {/* Document Upload (Optional, max 2MB) */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Supporting document or photo <span className="text-gray-400 font-normal">(max 2 MB)</span>
            </label>
            <div className="border border-dashed border-[#E6E6E0] rounded-lg p-3 text-center bg-[#F8F8F6]">
              <input
                type="file"
                id="qual-doc-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="qual-doc-upload" className="cursor-pointer block">
                {fileName ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#072339] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="truncate max-w-[200px]">{fileName}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-4 h-4 text-gray-400 mx-auto" />
                    <p className="text-xs text-[#072339] font-medium">Attach Certificate or Photo</p>
                    <p className="text-[10px] text-gray-400">PNG, JPG or PDF up to 2 MB</p>
                  </div>
                )}
              </label>
            </div>
            {errors.documentDataUrl && (
              <p className="text-[11px] text-red-600 mt-1">{errors.documentDataUrl}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Add qualification'}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Will be placed in 'Pending review' until checked by an admin.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
