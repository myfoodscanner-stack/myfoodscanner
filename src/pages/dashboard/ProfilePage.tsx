import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Baby,
  Heart,
  AlertTriangle,
  Sparkles,
  Check,
  Save,
  Globe,
  Activity,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserDietProfile } from '../../types';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

const ALLERGEN_OPTIONS = [
  'Gluten',
  'Crustaceans',
  'Eggs',
  'Fish',
  'Peanuts',
  'Soybeans',
  'Milk & Lactose',
  'Tree Nuts',
  'Celery',
  'Mustard',
  'Sesame Seeds',
  'Sulfites (>10mg/kg)',
  'Lupin',
  'Molluscs'
];

const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Lactose-Free',
  'Ketogenic (Keto)',
  'Paleo',
  'Halal',
  'Kosher',
  'Low Sodium (Hypertension)',
  'Low Sugar (Low GI)'
];

const OBJECTIVES_OPTIONS = [
  'Avoid carcinogenic additives',
  'Protect children from neurotoxins',
  'Eliminate endocrine disruptors',
  'Prioritize whole raw foods (NOVA 1)',
  'Control blood glucose & diabetes',
  'Reduce saturated fat intake'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [region, setRegion] = useState(user?.region || 'EU');
  const [allergies, setAllergies] = useState<string[]>(user?.diet_profile?.allergies || []);
  const [regimes, setRegimes] = useState<string[]>(user?.diet_profile?.regime || []);
  const [objectives, setObjectives] = useState<string[]>(user?.diet_profile?.objectives || []);
  const [hasChildren, setHasChildren] = useState(user?.diet_profile?.has_children || false);
  const [childrenAges, setChildrenAges] = useState<string[]>(user?.diet_profile?.children_ages || []);
  const [isPregnant, setIsPregnant] = useState(user?.diet_profile?.is_pregnant || false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(user?.diet_profile?.is_breastfeeding || false);
  const [isDiabetic, setIsDiabetic] = useState(user?.diet_profile?.is_diabetic || false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRegion(user.region);
      setAllergies(user.diet_profile?.allergies || []);
      setRegimes(user.diet_profile?.regime || []);
      setObjectives(user.diet_profile?.objectives || []);
      setHasChildren(user.diet_profile?.has_children || false);
      setChildrenAges(user.diet_profile?.children_ages || []);
      setIsPregnant(user.diet_profile?.is_pregnant || false);
      setIsBreastfeeding(user.diet_profile?.is_breastfeeding || false);
      setIsDiabetic(user.diet_profile?.is_diabetic || false);
    }
  }, [user]);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const diet_profile: UserDietProfile = {
      allergies,
      intolerances: [],
      regime: regimes,
      objectives,
      has_children: hasChildren,
      children_ages: childrenAges,
      is_pregnant: isPregnant,
      is_breastfeeding: isBreastfeeding,
      is_diabetic: isDiabetic,
      pathologies: isDiabetic ? ['Diabetes'] : []
    };

    const ok = await updateProfile({
      name,
      region,
      diet_profile
    });

    setSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-6 px-4 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Health Profile & Personalization
          </h1>
          <p className="text-xs text-emerald-200/70">
            Every scan automatically adapts to your allergies, family needs, and health goals.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs flex items-center justify-center gap-2 shadow-lg">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>Health profile saved successfully! Your future scans will be personalized.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: General info */}
          <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d180d] border border-[#243f24] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                  Regulations & Standards
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d180d] border border-[#243f24] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="US">United States (FDA / USDA Standards)</option>
                  <option value="EU">European Union (EFSA Standards)</option>
                  <option value="UK">United Kingdom (FSA Standards)</option>
                  <option value="CA">Canada (Health Canada Standards)</option>
                  <option value="OTHER">International / Global Standards</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Family Protection & Conditions */}
          <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Baby className="w-4 h-4 text-emerald-400" />
              Family Protection & Health Conditions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Children Toggle */}
              <div className={`p-4 rounded-2xl border transition-colors ${hasChildren ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-[#0f1b0f] border-[#223822]'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Children in Household</span>
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Instant alerts on additives linked to hyperactivity (azo dyes, sodium benzoate).
                </p>
                {hasChildren && (
                  <div className="mt-3 pt-2 border-t border-emerald-500/20 flex gap-2">
                    {['Under 3 yrs', '3 - 12 yrs', 'Teens'].map((age) => (
                      <button
                        type="button"
                        key={age}
                        onClick={() => toggleArrayItem(childrenAges, setChildrenAges, age)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                          childrenAges.includes(age)
                            ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                            : 'bg-[#182918] text-emerald-300 border-[#2b472b]'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pregnancy Toggle */}
              <div className={`p-4 rounded-2xl border transition-colors ${isPregnant ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-[#0f1b0f] border-[#223822]'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Current Pregnancy</span>
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Heightened vigilance on endocrine disruptors, phthalates, and artificial sweeteners.
                </p>
              </div>

              {/* Breastfeeding Toggle */}
              <div className={`p-4 rounded-2xl border transition-colors ${isBreastfeeding ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-[#0f1b0f] border-[#223822]'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Breastfeeding</span>
                  <input
                    type="checkbox"
                    checked={isBreastfeeding}
                    onChange={(e) => setIsBreastfeeding(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Flags lipophilic pollutants, harsh chemical solvents, and toxic processing residues.
                </p>
              </div>

              {/* Diabetic Toggle */}
              <div className={`p-4 rounded-2xl border transition-colors ${isDiabetic ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-[#0f1b0f] border-[#223822]'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Diabetes (Type 1 or 2)</span>
                  <input
                    type="checkbox"
                    checked={isDiabetic}
                    onChange={(e) => setIsDiabetic(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Precise glycemic impact scoring and alerts on hidden high-fructose corn syrups.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 14 Major Allergens */}
          <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              Major Food Allergens
            </h3>
            <p className="text-xs text-emerald-200/70">
              Select items to highlight in prominent red badges on every scanned food label.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALLERGEN_OPTIONS.map((alg) => {
                const isSelected = allergies.includes(alg);
                return (
                  <button
                    type="button"
                    key={alg}
                    onClick={() => toggleArrayItem(allergies, setAllergies, alg)}
                    className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/60 border-red-500/60 text-red-200'
                        : 'bg-[#0f1b0f] border-[#203620] text-emerald-200/80 hover:border-emerald-500/30'
                    }`}
                  >
                    <span>{alg}</span>
                    {isSelected && <span className="text-red-400 font-bold">✗</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Diets & Priorities */}
          <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Diets & Health Priorities
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DIET_OPTIONS.map((diet) => {
                const isSelected = regimes.includes(diet);
                return (
                  <button
                    type="button"
                    key={diet}
                    onClick={() => toggleArrayItem(regimes, setRegimes, diet)}
                    className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                        : 'bg-[#0f1b0f] border-[#203620] text-emerald-200/80 hover:border-emerald-500/30'
                    }`}
                  >
                    <span>{diet}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Health Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
