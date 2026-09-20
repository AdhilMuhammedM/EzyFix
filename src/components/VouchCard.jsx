import React from 'react';
import { CheckCircle2, Calendar, MapPin } from 'lucide-react';

export default function VouchCard({ vouch }) {
  const formattedDate = vouch.createdAt
    ? new Date(vouch.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-white rounded-xl border border-[#E6E6E0] p-3.5 shadow-sm space-y-2.5">
      {/* Header: Voucher name, area, and checkmark */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-xs text-[#072339]">
              {vouch.voucherName}
            </h4>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified contact
            </span>
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{vouch.voucherArea}</span>
          </p>
        </div>

        <span className="text-[10px] text-gray-400 font-medium">
          {formattedDate}
        </span>
      </div>

      {/* Job Done & Month */}
      <div className="bg-[#F8F8F6] px-2.5 py-1.5 rounded-lg border border-[#E6E6E0]/70 flex items-center justify-between text-xs text-[#072339]">
        <span className="font-medium truncate pr-2">
          {vouch.jobDone}
        </span>
        <span className="text-[11px] text-gray-500 whitespace-nowrap flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          {vouch.jobMonth}
        </span>
      </div>

      {/* Tags */}
      {Array.isArray(vouch.tags) && vouch.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {vouch.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Written Feedback */}
      <p className="text-xs text-gray-700 leading-relaxed italic">
        "{vouch.feedback}"
      </p>
    </div>
  );
}
