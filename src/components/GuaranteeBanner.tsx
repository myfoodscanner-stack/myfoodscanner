import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface GuaranteeBannerProps {
  compact?: boolean;
}

export const GuaranteeBanner: React.FC<GuaranteeBannerProps> = ({ compact = false }) => {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-900/90 via-[#1e441e] to-emerald-950/90 border-y border-emerald-500/30 py-3.5 px-4 text-emerald-100 shadow-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center sm:text-left">
        <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-wide">
            48-Hour Money-Back Guarantee (First Payment Only)*
            <span className="font-normal text-emerald-200 ml-1">
              — Not 100% satisfied? Full refund with 1-click in your settings, no questions asked.
            </span>
          </p>
          {!compact && (
            <p className="text-[11px] text-emerald-300/80 mt-0.5 font-medium">
              *Strictly applicable to the initial first payment within 48 hours of subscription. Subsequent renewals or subsequent billing cycles are non-refundable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
