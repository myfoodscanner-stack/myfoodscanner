import React, { useState } from 'react';
import {
  UserPlus,
  Lock,
  Mail,
  User,
  Globe,
  ArrowRight,
  ShieldCheck,
  Baby,
  Heart,
  AlertTriangle,
  Sparkles,
  Check,
  Save,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserDietProfile } from '../../types';

interface RegisterPageProps {
  onNavigate: (page: string, user?: any) => void;
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
  'Reduce industrial emulsifiers (E471, E407)'
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, updateProfile } = useAuth();

  // Wizard Step: 1 = Account Credentials, 2 = Health Profile Onboarding
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('EU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Health Profile state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [regimes, setRegimes] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Step 1: Submit account registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await register(name, email, password, region);
    setLoading(false);

    if (res.success && res.user) {
      // Transition directly to Step 2: Health Profile personalization before pricing
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

  // Step 2: Submit and save Health Profile, then proceed to Pricing
  const handleSaveHealthProfileAndContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);

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
      pathologies: isDiabetic ? ['Diabetes'] : [],
    };

    try {
      await updateProfile({
        name,
        region,
        diet_profile,
      });
    } catch (err) {
      console.error('Error updating profile during onboarding:', err);
    } finally {
      setSavingProfile(false);
      // Navigate to pricing plan selection
      onNavigate('pricing');
    }
  };

  const handleSkipToPricing = () => {
    onNavigate('pricing');
  };

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className={`${step === 1 ? 'max-w-md' : 'max-w-3xl'} w-full mx-auto space-y-6 transition-all duration-300`}>
        {/* Onboarding Step Progress Tracker */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${step === 1 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Account</span>
          </div>

          <div className="w-4 sm:w-8 h-0.5 bg-[#253f25]" />

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${step === 2 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-[#142314] border-[#223a22] text-emerald-400/50'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Health Profile</span>
          </div>

          <div className="w-4 sm:w-8 h-0.5 bg-[#253f25]" />

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#142314] border-[#223a22] text-emerald-400/50">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Plan Selection</span>
          </div>
        </div>

        {/* ================= STEP 1: ACCOUNT CREDENTIALS ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Create Your Account
              </h2>
              <p className="text-xs text-emerald-200/70">
                Start scanning food labels and protect your family's health.
              </p>
            </div>

            <div className="bg-[#142314] border border-[#274227] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950 space-y-5">
              {error && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Full Name / First Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sarah Johnson"
                      className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Region / Food Health Regulations
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="US">United States (FDA / USDA Standards)</option>
                      <option value="EU">European Union (EFSA Standards)</option>
                      <option value="UK">United Kingdom (FSA Standards)</option>
                      <option value="CA">Canada (Health Canada Standards)</option>
                      <option value="OTHER">International / Global Standards</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer mt-2"
                >
                  {loading ? 'Creating account...' : 'Next: Set Up Health Profile'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-emerald-300/70">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: HEALTH PROFILE ONBOARDING ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                Set Up Your Health Profile
              </h2>
              <p className="text-xs text-emerald-200/70 max-w-lg mx-auto">
                Configure your dietary restrictions, allergies, and family health filters. Every future scan will automatically alert you to relevant toxic chemicals and allergens.
              </p>
            </div>

            <form onSubmit={handleSaveHealthProfileAndContinue} className="space-y-6">
              {/* Section 1: Family & Vulnerable Health Conditions */}
              <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Baby className="w-4 h-4 text-emerald-400" />
                  Family & Specific Health Conditions
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
                      Flags lipophilic pollutants, chemical solvents, and toxic processing residues.
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

              {/* Section 2: Major Allergens */}
              <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                  Major Food Allergens (Select Any)
                </h3>
                <p className="text-xs text-emerald-200/70">
                  Select allergens to trigger prominent warning alerts whenever scanned in an ingredients list.
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

              {/* Section 3: Diets & Lifestyles */}
              <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Diets & Health Lifestyles
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

              {/* Section 4: Health Objectives */}
              <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Health Priorities & Goals
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OBJECTIVES_OPTIONS.map((obj) => {
                    const isSelected = objectives.includes(obj);
                    return (
                      <button
                        type="button"
                        key={obj}
                        onClick={() => toggleArrayItem(objectives, setObjectives, obj)}
                        className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                            : 'bg-[#0f1b0f] border-[#203620] text-emerald-200/80 hover:border-emerald-500/30'
                        }`}
                      >
                        <span>{obj}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving profile...' : 'Save and continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSkipToPricing}
                    className="text-xs text-emerald-400/60 hover:text-emerald-300 underline cursor-pointer py-1"
                  >
                    Skip for now (you can configure your profile anytime later)
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#111e11] border border-[#243d24] rounded-2xl text-[11px] text-emerald-300/70 text-center flex items-center justify-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>You can always update or modify this profile anytime in your <strong>Health Profile</strong> tab.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
