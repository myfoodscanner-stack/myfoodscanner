import React, { useState } from 'react';
import { FoodScanResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Activity,
  Heart,
  Baby,
  Sparkles,
  Info,
  BookOpen,
  ArrowRight,
  Share2,
  Download,
  Flame,
  Wheat,
  Scale
} from 'lucide-react';

interface ScanResultCardProps {
  scan: FoodScanResult;
  onScanAnother?: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ scan, onScanAnother }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'additives' | 'nutrition' | 'alternatives'>('overview');
  const [copied, setCopied] = useState(false);

  const getNovaColor = (score: number) => {
    switch (score) {
      case 1:
        return 'bg-emerald-500 text-gray-950';
      case 2:
        return 'bg-teal-500 text-gray-950';
      case 3:
        return 'bg-amber-500 text-gray-950';
      case 4:
      default:
        return 'bg-red-500 text-white';
    }
  };

  const getNovaLabel = (score: number) => {
    switch (score) {
      case 1:
        return 'NOVA 1: Unprocessed / Minimally processed';
      case 2:
        return 'NOVA 2: Processed culinary ingredients';
      case 3:
        return 'NOVA 3: Processed food';
      case 4:
      default:
        return 'NOVA 4: Ultra-processed food formulation';
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${scan.product_name} — Health Score ${scan.scores.global}/100`,
        text: `I analyzed ${scan.product_name} on My Food Scanner. Score: ${scan.scores.global}/100, NOVA ${scan.nova_score}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${scan.product_name} - Score: ${scan.scores.global}/100 on My Food Scanner`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#142114] border border-[#263e26] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl pb-4 sm:pb-6">
      {/* Top Header Card */}
      <div className="relative bg-gradient-to-b from-[#1c331c] to-[#142114] p-4 sm:p-6 border-b border-[#263e26]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-1.5">
              {scan.brand || 'Food Product'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white leading-tight break-words">
              {scan.product_name}
            </h2>
            {scan.barcode && (
              <p className="text-[11px] sm:text-xs text-emerald-300/60 mt-1 font-mono">
                Barcode: {scan.barcode}
              </p>
            )}
          </div>

          <button
            onClick={handleShare}
            className="p-2 sm:p-2.5 rounded-xl bg-[#1d301d] text-emerald-300 hover:text-white border border-[#2b472b] transition-colors cursor-pointer shrink-0"
            title="Share analysis"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* Global Score Display Section */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-around bg-[#101a10] border border-[#203620] rounded-2xl p-4 sm:p-5 gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-1.5">
              Global Health Score
            </span>
            <ScoreGauge score={scan.scores.global} size="md" />
          </div>

          <div className="w-full sm:w-auto flex-1 flex flex-col gap-2.5">
            {/* NOVA Badge */}
            <div className="flex items-center justify-between bg-[#192b19] p-2.5 sm:p-3 rounded-xl border border-[#2c472c]">
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 ${getNovaColor(scan.nova_score)}`}>
                  {scan.nova_score}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">Processing Level</p>
                  <p className="text-[10px] sm:text-[11px] text-emerald-200/70 truncate">{getNovaLabel(scan.nova_score)}</p>
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${
                scan.children_safe
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}>
                <Baby className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{scan.children_safe ? 'Child Safe' : 'Child Caution'}</span>
              </div>

              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${
                scan.palm_oil
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              }`}>
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{scan.palm_oil ? 'Palm Oil Present' : 'No Palm Oil'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[#233823] px-3 sm:px-4 pt-2 bg-[#111c11] overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Overview & Alerts' },
          { key: 'additives', label: `Additives (${scan.additives.length})` },
          { key: 'nutrition', label: 'Nutrition' },
          { key: 'alternatives', label: 'Alternatives (3)' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-emerald-200/60 hover:text-emerald-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-3.5 sm:p-5 space-y-5 sm:space-y-6">
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Personalized Alerts Banner */}
            {scan.alerts && scan.alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Personalized Health Alerts
                </h4>
                <div className="space-y-1.5">
                  {scan.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs sm:text-sm text-red-200 flex items-start gap-2.5"
                    >
                      <span className="shrink-0 text-red-400 font-bold">●</span>
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6 Detailed Scores Bar Grid */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                6 Health Evaluation Dimensions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Additives & Preservatives', score: scan.scores.additives, icon: FlaskConical },
                  { label: 'Endocrine Disruptors', score: scan.scores.endocrine_disruptors, icon: Heart },
                  { label: 'NOVA Ultra-processing Score', score: scan.scores.nova, icon: Scale },
                  { label: 'Glycemic & Sugar Impact', score: scan.scores.glycemic_impact, icon: Activity },
                  { label: 'Environmental Score', score: scan.scores.environmental, icon: Sparkles },
                  { label: 'Nutritional Density Score', score: scan.scores.nutrition || 60, icon: Wheat },
                ].map((item, index) => {
                  const ItemIcon = item.icon;
                  const scoreVal = item.score;
                  const isHigh = scoreVal >= 70;
                  const isMed = scoreVal >= 40 && scoreVal < 70;
                  const barColor = isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-red-500';
                  const textClass = isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-red-400';

                  return (
                    <div key={index} className="bg-[#192b19] border border-[#284228] p-3 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-emerald-100 flex items-center gap-1.5">
                          <ItemIcon className="w-3.5 h-3.5 text-emerald-400/80" />
                          {item.label}
                        </span>
                        <span className={`font-bold ${textClass}`}>{scoreVal}/100</span>
                      </div>
                      <div className="w-full h-2 bg-[#0e170e] rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${scoreVal}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Positive and Negative Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Positives */}
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4">
                <h5 className="text-xs uppercase font-bold tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Positive Points
                </h5>
                {scan.positive_points.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-emerald-100/90">
                    {scan.positive_points.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-300/50 italic">No notable positive point detected.</p>
                )}
              </div>

              {/* Negatives */}
              <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4">
                <h5 className="text-xs uppercase font-bold tracking-wider text-red-400 mb-2.5 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Negative Points
                </h5>
                {scan.negative_points.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-red-100/90">
                    {scan.negative_points.map((n, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400">✗</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-300/50 italic">No major negative point detected.</p>
                )}
              </div>
            </div>

            {/* NOVA Explanation */}
            <div className="bg-[#172717] border border-[#294429] rounded-2xl p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                Industrial Processing Analysis
              </h5>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                {scan.nova_explanation}
              </p>
            </div>
          </div>
        )}

        {/* ================= ADDITIVES & ENDOCRINE TAB ================= */}
        {activeTab === 'additives' && (
          <div className="space-y-6">
            {/* Additives Section */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-3 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                Detected Food Additives ({scan.additives.length})
              </h4>

              {scan.additives.length === 0 ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-100 text-sm">Zero additives detected</p>
                  <p className="text-xs text-emerald-300/70 mt-0.5">This product contains no listed food additive or E-number.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scan.additives.map((add, idx) => {
                    const isHigh = add.risk_level === 'high';
                    const isMed = add.risk_level === 'medium';
                    const badgeClass = isHigh
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : isMed
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

                    return (
                      <div key={idx} className="bg-[#172717] border border-[#2a452a] rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white px-2 py-0.5 rounded bg-[#101b10] border border-[#2b472b]">
                              {add.code}
                            </span>
                            <span className="font-semibold text-sm text-emerald-100">{add.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {add.risk_level === 'high' ? 'High Risk' : add.risk_level === 'medium' ? 'Moderate Risk' : 'Low Risk'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/80 leading-relaxed mb-2">
                          {add.description}
                        </p>
                        {add.sources && add.sources.length > 0 && (
                          <div className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Scientific sources: {add.sources.join(' • ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Endocrine Disruptors Section */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-400" />
                Endocrine Disruptors ({scan.endocrine_disruptors.length})
              </h4>

              {scan.endocrine_disruptors.length === 0 ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center">
                  <p className="text-xs text-emerald-200 font-semibold">No direct endocrine disruptor identified.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scan.endocrine_disruptors.map((ed, idx) => (
                    <div key={idx} className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-amber-200">{ed.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Hormonal Risk
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/80 leading-relaxed">
                        {ed.description}
                      </p>
                      <p className="text-[10px] text-amber-300/60 mt-1">
                        Concerned ingredient: {ed.ingredient}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= NUTRITION TAB ================= */}
        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            {/* Macro values table */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-3 flex items-center gap-1.5">
                <Wheat className="w-4 h-4 text-emerald-400" />
                Average Nutritional Values (per 100g)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Calories', val: `${scan.nutrition_per_100g.calories} kcal`, alert: false },
                  { label: 'Total Fat', val: `${scan.nutrition_per_100g.fat} g`, alert: scan.nutrition_per_100g.fat > 20 },
                  { label: 'of which saturates', val: `${scan.nutrition_per_100g.saturated_fat} g`, alert: scan.nutrition_per_100g.saturated_fat > 5 },
                  { label: 'Carbohydrates', val: `${scan.nutrition_per_100g.carbohydrates} g`, alert: false },
                  { label: 'of which sugars', val: `${scan.nutrition_per_100g.sugars} g`, alert: scan.nutrition_per_100g.sugars > 15 },
                  { label: 'Fiber', val: `${scan.nutrition_per_100g.fiber} g`, alert: false },
                  { label: 'Protein', val: `${scan.nutrition_per_100g.protein} g`, alert: false },
                  { label: 'Salt / Sodium', val: `${scan.nutrition_per_100g.salt} g`, alert: scan.nutrition_per_100g.salt > 1.2 },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      m.alert
                        ? 'bg-red-950/40 border-red-500/30'
                        : 'bg-[#182a18] border-[#294429]'
                    }`}
                  >
                    <span className="text-[11px] text-emerald-300/70 block mb-0.5">{m.label}</span>
                    <span className={`text-base font-bold font-display ${m.alert ? 'text-red-400' : 'text-white'}`}>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Glycemic Index Analysis */}
            <div className="bg-[#172717] border border-[#2b472b] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Glycemic Index & Load
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GI: {scan.glycemic_index ?? 50} / 100
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                {scan.glycemic_explanation}
              </p>
            </div>

            {/* Ingredients Raw list */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-2">
                Full Ingredient Statement
              </h4>
              <div className="bg-[#101b10] border border-[#223822] rounded-xl p-3.5 text-xs text-emerald-200/80 leading-relaxed">
                {scan.ingredients_raw || scan.ingredients.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* ================= ALTERNATIVES TAB ================= */}
        {activeTab === 'alternatives' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-300/80 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                3 Healthier Recommended Alternatives
              </h4>
              <p className="text-xs text-emerald-300/60 mb-3">
                Equivalent products with higher global health scores and zero controversial additives:
              </p>
            </div>

            <div className="space-y-3">
              {scan.alternatives.map((alt, idx) => (
                <div
                  key={idx}
                  className="bg-[#182918] border border-[#2c472c] rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      {alt.brand || 'Recommended Alternative'}
                    </span>
                    <h5 className="font-bold text-sm text-white">{alt.name}</h5>
                    <p className="text-xs text-emerald-200/80 mt-1 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✓</span> {alt.why_better}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-center">
                    <ScoreGauge score={alt.score} size="sm" showLabel={false} />
                    <span className="text-[10px] text-emerald-300/80 font-bold mt-1">Score {alt.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scientific References & Medical Disclaimer */}
      <div className="px-5 pt-3 pb-2 border-t border-[#233a23] space-y-3">
        {scan.scientific_sources && scan.scientific_sources.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-300/60 flex-wrap">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sources:</span>
            {scan.scientific_sources.map((s, i) => (
              <span key={i} className="bg-[#182b18] px-2 py-0.5 rounded text-[10px] text-emerald-300 border border-[#284428]">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="bg-[#111c11] rounded-xl p-3 border border-[#203320] flex items-start gap-2 text-[11px] text-emerald-400/70">
          <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>
            <strong>Mandatory Medical Disclaimer:</strong> This food label analysis is provided for informational and educational purposes only. It does not constitute medical advice or personalized nutritional diagnosis by a licensed healthcare provider.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {onScanAnother && (
        <div className="p-5 pt-3">
          <button
            onClick={onScanAnother}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Scan another food item
          </button>
        </div>
      )}
    </div>
  );
};
