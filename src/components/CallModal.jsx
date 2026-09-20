import React, { useState, useEffect } from 'react';
import { X, Phone, User, MapPin, CheckCircle, Copy, Check } from 'lucide-react';
import { AREAS, STORAGE_KEYS } from '../lib/config.js';
import { validateCustomer } from '../lib/validation.js';
import { addContact, getCallNumber } from '../data/repo.js';

export default function CallModal({ pro, isOpen, onClose, onContactLogged }) {
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    area: AREAS[0],
  });
  const [isIdentified, setIsIdentified] = useState(false);
  const [proPhone, setProPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Check device storage for existing customer identification
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.phone && parsed.area) {
          setCustomer(parsed);
          setIsIdentified(true);
          // Directly log contact and fetch phone
          logAndFetchPhone(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Error reading customer identity:', err);
    }

    setIsIdentified(false);
    setProPhone(null);
  }, [isOpen, pro?.id]);

  const logAndFetchPhone = async (custData) => {
    try {
      setLoading(true);
      await addContact({
        proId: pro.id,
        customerName: custData.name,
        customerPhone: custData.phone,
        customerArea: custData.area,
      });

      const phone = await getCallNumber(pro.id, custData.phone);
      setProPhone(phone);
      if (onContactLogged) {
        onContactLogged(custData);
      }
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleIdentificationSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    try {
      // Save customer to device
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customer));
      setIsIdentified(true);
      await logAndFetchPhone(customer);
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  const handleCopy = () => {
    if (!proPhone) return;
    navigator.clipboard.writeText(proPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !pro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E6E6E0] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#072339] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FDB60C] text-[#072339] flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-white leading-tight">
                Call {pro.fullName}
              </h3>
              <p className="text-[11px] text-gray-300">{pro.service} · {pro.homeArea}</p>
            </div>
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

        <div className="p-5">
          {errors.form && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errors.form}
            </div>
          )}

          {!isIdentified && !proPhone ? (
            /* Identification Form (First time calling) */
            <form onSubmit={handleIdentificationSubmit} className="space-y-3.5">
              <p className="text-xs text-gray-600 leading-relaxed">
                Please enter your details once to connect with verified professionals.
                Your phone is kept private.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  Your name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  10-digit mobile number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#072339] mb-1">
                  Your area <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={customer.area}
                    onChange={(e) => setCustomer({ ...customer, area: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.area && <p className="text-[11px] text-red-600 mt-1">{errors.area}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Connecting...' : 'Continue to Call'}
                </button>
              </div>
            </form>
          ) : (
            /* Call Revealed Screen */
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Verified phone number</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-2xl font-bold font-serif text-[#072339] tracking-wider">
                    {proPhone || 'Connecting...'}
                  </span>
                  {proPhone && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                      title="Copy number"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {pro.visitCharge && (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1 mt-2 inline-block">
                    Standard visit inspection charge: ₹{pro.visitCharge}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {proPhone && (
                  <a
                    href={`tel:${proPhone}`}
                    className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-lg transition-colors shadow flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-4 border border-[#E6E6E0] hover:bg-gray-50 text-gray-700 text-xs rounded-lg font-medium"
                >
                  Done
                </button>
              </div>

              <p className="text-[11px] text-gray-400 leading-tight">
                Contact logged on this device. You can now vouch for {pro.fullName} after the work is done.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
