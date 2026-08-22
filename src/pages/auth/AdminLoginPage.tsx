import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (page: string, user?: any) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setError(null);

    const res = await adminLogin(targetEmail, targetPass);
    setLoading(false);

    if (res.success && res.user?.role === 'admin') {
      onNavigate('admin-dashboard', res.user);
    } else {
      setError(res.error || 'Access denied. Administrator privileges required.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-emerald-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to public site
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-950">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Administrator Portal
          </h2>
          <p className="text-xs text-red-300/80 font-medium">
            Restricted secure access for My Food Scanner management.
          </p>
        </div>

        <div className="bg-[#121a12] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-950/90 border border-red-500/60 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@myfoodscanner.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a110a] border border-[#2d3a2d] rounded-xl text-sm text-white placeholder-emerald-400/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-300 mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a110a] border border-[#2d3a2d] rounded-xl text-sm text-white placeholder-emerald-400/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
            >
              {loading ? 'Verifying access...' : 'Access Admin Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
