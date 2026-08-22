import React, { useState } from 'react';
import {
  Scan,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FlaskConical,
  Heart,
  Baby,
  Scale,
  Apple,
  History,
  CheckCircle2,
  Lock,
  Smartphone,
  Info
} from 'lucide-react';
import { GuaranteeBanner } from '../components/GuaranteeBanner';
import { ScoreGauge } from '../components/ScoreGauge';
import { BlurredModulePreview } from '../components/BlurredModulePreview';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, isPro } = useAuth();
  const [showPwaModal, setShowPwaModal] = useState(false);

  const featureCards = [
    {
      title: 'AI Label Scan',
      desc: 'Scan any food label or packaging — results in seconds using Gemini Vision AI.',
      icon: Scan,
      tag: 'Instant'
    },
    {
      title: 'Health Score',
      desc: 'Get a complete multi-dimensional health score (0-100) for every scanned product.',
      icon: Sparkles,
      tag: '0-100'
    },
    {
      title: 'Additives & E-Numbers',
      desc: 'Identify controversial additives, chemical preservatives and their proven health risks.',
      icon: FlaskConical,
      tag: 'E-Numbers'
    },
    {
      title: 'Endocrine Disruptors',
      desc: 'Detect hormone-disrupting chemicals and thermal neoformed compounds hidden in food.',
      icon: Heart,
      tag: 'Hormonal'
    },
    {
      title: 'Family Protection',
      desc: 'Personalized alerts for children (hyperactivity risk) and pregnant / nursing women.',
      icon: Baby,
      tag: 'Kids & Pregnancy'
    },
    {
      title: 'NOVA Score',
      desc: 'Know how ultra-processed your food really is with the scientific NOVA 1-4 scale.',
      icon: Scale,
      tag: 'Processing'
    },
    {
      title: 'Healthy Alternatives',
      desc: 'Get 3 healthier 90+ rated alternatives for every ultra-processed product scanned.',
      icon: Apple,
      tag: '3 Substitutes'
    },
    {
      title: 'Scan History',
      desc: 'Keep track of every product scanned with statistics on toxic additives avoided.',
      icon: History,
      tag: 'Tracking'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 flex flex-col">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-10 pb-16 px-4 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#182d18] border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen AI Food Label Scanner
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display text-white tracking-tight leading-[1.15]">
            Do you really know <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500">
              what's in your food?
            </span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-200/80 max-w-2xl mx-auto leading-relaxed">
            Scan any food label instantly. AI-powered analysis of additives, endocrine disruptors, allergens and ultra-processing — personalized for you and your family.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate(user ? (isPro ? 'scan' : 'pricing') : 'pricing')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-extrabold text-base tracking-wide shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2.5 transition-transform transform active:scale-95 cursor-pointer"
            >
              <Scan className="w-5 h-5" />
              Start scanning — $4.99/mo
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowPwaModal(true)}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#172b17] hover:bg-[#1e381e] border border-[#2b4b2b] text-emerald-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Install on Smartphone
            </button>
          </div>

          {/* Interactive Phone Mockup Preview */}
          <div className="pt-8 max-w-sm sm:max-w-md mx-auto">
            <div className="relative mx-auto border-4 border-[#243c24] bg-[#101c10] rounded-[36px] p-3.5 shadow-2xl shadow-emerald-950/80">
              <div className="w-24 h-4 bg-[#243c24] rounded-full mx-auto mb-3" />
              
              <div className="bg-[#142314] rounded-2xl p-4 border border-[#263e26] text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Live Analysis
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                    NOVA 4 Ultra-processed
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <ScoreGauge score={24} size="sm" showLabel={false} />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Chocolate Filled Cereals</h4>
                    <p className="text-[11px] text-red-400 font-semibold mt-0.5">Score 24/100 • 2 High-risk additives</p>
                    <p className="text-[10px] text-emerald-300/70">34g sugar / 100g • Contains E150d</p>
                  </div>
                </div>

                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-2.5 text-[11px] text-red-200">
                  ⚠️ <strong>Family Alert:</strong> Not recommended for children under 3 (sugar & dye E150d).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 48-HOUR GUARANTEE BANNER ================= */}
      <GuaranteeBanner />

      {/* ================= 8 FEATURE CARDS ================= */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Comprehensive scientific analysis in 3 seconds
          </h2>
          <p className="text-sm text-emerald-200/70">
            No more unreadable ingredient statements. My Food Scanner decodes industrial formulations into clear, actionable health insights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#132213] border border-[#233a23] hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:translate-y-[-2px] group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1c331c] text-emerald-300 border border-[#2b4b2b]">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display text-white mb-1.5">{card.title}</h3>
                  <p className="text-xs text-emerald-200/70 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= MODULES PREVIEWS (LOCKED TEASERS) ================= */}
      <section className="py-12 px-4 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest">
            Module Previews
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Discover our in-depth nutritional reports
          </h2>
          <p className="text-xs text-emerald-200/70">
            Preview of what you unlock for every scanned food label.
          </p>
        </div>

        {/* Blurred Preview 1: Additives & Endocrine */}
        <BlurredModulePreview
          title="Additives & Endocrine Disruptors Radar"
          description="Access official scientific assessments from EFSA, WHO, and ANSES for every ingredient and preservative."
          onUnlock={() => onNavigate('pricing')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b2f1b] border border-[#2f502f]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black font-mono font-bold text-red-400">E150d</span>
                <span className="font-bold text-white">Ammonia caramel</span>
              </div>
              <span className="text-xs font-bold text-red-400">High Risk (4-MEI)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b2f1b] border border-[#2f502f]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black font-mono font-bold text-amber-400">E471</span>
                <span className="font-bold text-white">Mono- and diglycerides of fatty acids</span>
              </div>
              <span className="text-xs font-bold text-amber-400">Intestinal inflammation</span>
            </div>
          </div>
        </BlurredModulePreview>

        {/* Blurred Preview 2: Healthier Alternatives */}
        <BlurredModulePreview
          title="Top 3 Healthier Alternatives"
          description="Instantly find 3 equivalent 90+ rated products free of controversial additives in your grocery store."
          onUnlock={() => onNavigate('pricing')}
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#1b2f1b] border border-[#2f502f] flex items-center justify-between">
              <div>
                <h5 className="font-bold text-white text-sm">Organic Oat & Pure Cocoa Muesli</h5>
                <p className="text-xs text-emerald-400 font-semibold">Zero added sugar • NOVA 1 • No additives</p>
              </div>
              <span className="text-base font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40">
                Score 94
              </span>
            </div>
          </div>
        </BlurredModulePreview>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#111f11] to-[#0d160d] border-t border-[#203620] text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950">
            <Scan className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
            Take control of your food and health today
          </h2>

          <p className="text-sm text-emerald-200/80 leading-relaxed">
            Join thousands of health-conscious families who scan their groceries in stores and protect their loved ones every day.
          </p>

          <button
            onClick={() => onNavigate('pricing')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-extrabold text-base tracking-wide shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 mx-auto transition-transform transform active:scale-95 cursor-pointer"
          >
            Start scanning — $4.99/mo
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-emerald-400/80 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            48-hour 100% money-back guarantee (1st payment only)
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto bg-[#091009] border-t border-[#1b2e1b] py-8 px-4 text-xs text-emerald-300/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-white text-sm">myfoodscanner.com</span>
            <p className="text-[11px] mt-0.5">© 2026 My Food Scanner. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            <span className="text-emerald-300/80">Privacy Policy</span>
            <span>•</span>
            <span className="text-emerald-300/80">Terms of Service</span>
            <span>•</span>
            <span className="text-emerald-300/80">Medical Disclaimer</span>
            <span>•</span>
            <a href="mailto:contact@myfoodscanner.com" className="text-emerald-400 hover:underline">
              contact@myfoodscanner.com
            </a>
          </div>
        </div>
      </footer>

      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
