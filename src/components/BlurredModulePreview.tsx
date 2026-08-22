import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface BlurredModulePreviewProps {
  title: string;
  description: string;
  onUnlock: () => void;
  children: React.ReactNode;
}

export const BlurredModulePreview: React.FC<BlurredModulePreviewProps> = ({
  title,
  description,
  onUnlock,
  children,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-emerald-800/40 bg-[#122012] shadow-xl">
      {/* Blurred background content */}
      <div className="absolute inset-0 filter blur-md select-none pointer-events-none opacity-25 p-6 overflow-hidden">
        {children}
      </div>

      {/* Lock Overlay - In normal flow to always guarantee proper card height */}
      <div className="relative bg-[#0b140b]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 sm:p-8 text-center z-10 w-full min-h-[260px]">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950/50">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold font-display text-white mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-emerald-200/80 max-w-lg mb-5 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onUnlock}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Unlock Full Access — $4.99/mo
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};


