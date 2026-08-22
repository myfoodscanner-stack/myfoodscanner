import React, { useState } from 'react';
import { ShieldCheck, Check, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { PayPalButton } from '../components/PayPalButton';
import { GuaranteeBanner } from '../components/GuaranteeBanner';
import { useAuth } from '../context/AuthContext';

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { user, isPro } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  const proFeatures = [
    'Unlimited label scans with Gemini Vision AI (Gemini 3.7 Flash)',
    'Full detection of hazardous chemical additives & E-numbers',
    'Radar for endocrine disruptors & neoformed contaminants',
    'Scientific NOVA 1 to 4 processing scale scoring',
    'Personalized Family alerts (Children, Pregnancy, Nursing, Diabetes)',
    '3 Healthier alternative recommendations (rated 90+) for every item',
    'Comprehensive scan history & personal health analytics',
    'Weekly food safety hazard alerts by email',
    '48-hour 100% money-back guarantee (1st payment only)'
  ];

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <button
            onClick={() => onNavigate(user ? 'scan' : 'landing')}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <Crown className="w-4 h-4 text-amber-400" />
            Unlimited Access — Cancel Anytime
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
            Invest in your food health & safety
          </h1>
          <p className="text-sm text-emerald-200/80 max-w-lg mx-auto">
            Get instant access to all AI food label detection features on your smartphone.
          </p>
        </div>

        {/* 48h Guarantee Banner */}
        <GuaranteeBanner />

        {/* Plan Selector Toggle */}
        <div className="flex items-center justify-center">
          <div className="bg-[#142314] p-1.5 rounded-2xl border border-[#274027] flex items-center gap-2">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedPlan === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Monthly — $4.99/mo
            </button>

            <button
              onClick={() => setSelectedPlan('annual')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                selectedPlan === 'annual'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <span className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                Save 50%
              </span>
              Annual — $29.99/yr
            </button>
          </div>
        </div>

        {/* Main Pricing Box */}
        <div className="bg-gradient-to-b from-[#162716] to-[#121f12] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#254025] pb-6 mb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Recommended Pro Plan
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-1">
                {selectedPlan === 'annual' ? 'Annual Pro Membership' : 'Monthly Pro Membership'}
              </h3>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                {selectedPlan === 'annual' ? 'Billed $29.99 per year (~$2.49/mo). Cancel anytime.' : 'Billed $4.99 per month. Cancel anytime.'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-4xl font-extrabold font-display text-white">
                {selectedPlan === 'annual' ? '$29.99' : '$4.99'}
              </span>
              <span className="text-xs text-emerald-400/80 block font-semibold">
                {selectedPlan === 'annual' ? '/ year' : '/ month'}
              </span>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              What is included in your plan:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {proFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-emerald-100/90">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action / Payment area */}
          {isPro ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-base font-bold text-white">Your Pro Membership is already active!</h4>
              <p className="text-xs text-emerald-200/80">
                You already enjoy unlimited AI scans and all premium health modules.
              </p>
              <button
                onClick={() => onNavigate('scan')}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Go to Scanner
              </button>
            </div>
          ) : user ? (
            <div className="space-y-3">
              <PayPalButton
                plan={selectedPlan}
                onSuccess={() => onNavigate('scan')}
              />
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-xs text-emerald-300/80 mb-2">
                Create your account to finalize Pro activation:
              </p>
              <button
                onClick={() => onNavigate('register')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Create Account & Activate Pro ({selectedPlan === 'annual' ? '$29.99/yr' : '$4.99/mo'})
              </button>
              <p className="text-[11px] text-emerald-400/70">
                Already registered? <button onClick={() => onNavigate('login')} className="text-emerald-300 underline font-semibold cursor-pointer">Sign in</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
