import React, { useState } from 'react';
import { LogIn, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: string, user?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setError(null);

    const res = await login(targetEmail, targetPass);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.role === 'admin') {
        onNavigate('admin-dashboard', res.user);
      } else if (res.user.tier === 'pro') {
        onNavigate('scan', res.user);
      } else {
        onNavigate('pricing', res.user);
      }
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Sign In to My Food Scanner
          </h2>
          <p className="text-xs text-emerald-200/70">
            Access your scan history and personalized nutritional health reports.
          </p>
        </div>

        <div className="bg-[#142314] border border-[#274227] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-950/90 border border-red-500/50 rounded-xl text-red-200 text-xs space-y-2">
              <p className="font-medium leading-relaxed">{error}</p>
              {error.includes('No account was found') && (
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Create Account Now →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#0d180d] border border-[#243f24] rounded-xl text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-emerald-300/70">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Discreet link to Admin Portal */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('admin-login')}
            className="text-[11px] text-emerald-400/50 hover:text-emerald-400 underline transition-colors cursor-pointer"
          >
            Admin Portal Access
          </button>
        </div>
      </div>
    </div>
  );
};
