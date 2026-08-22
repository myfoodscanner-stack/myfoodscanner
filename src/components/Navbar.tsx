import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scan,
  Shield,
  Download,
  LogOut,
  LogIn,
  UserCheck,
  Crown,
  LayoutDashboard,
  Menu,
  X,
  History,
  User,
  Settings
} from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAdmin, isPro, logout } = useAuth();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0f1b0f]/95 backdrop-blur-md border-b border-[#213821]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            onClick={() => onNavigate(isAdmin ? 'admin-dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 p-0.5 shadow-md shadow-emerald-950 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#122212] rounded-[10px] flex items-center justify-center text-emerald-400">
                <Scan className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-white block">
                My Food <span className="text-emerald-400">Scanner</span>
              </span>
              <span className="text-[10px] text-emerald-300/70 font-medium tracking-wide block -mt-0.5">
                AI Food Label Nutrition Radar
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => onNavigate('landing')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'landing' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'pricing' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  Pricing ($4.99/mo)
                </button>

                {user && (
                  <>
                    <button
                      onClick={() => onNavigate('scan')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === 'scan' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      Scan
                    </button>
                    <button
                      onClick={() => onNavigate('history')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === 'history' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      History
                    </button>
                    <button
                      onClick={() => onNavigate('profile')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === 'profile' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      Health Profile
                    </button>
                    <button
                      onClick={() => onNavigate('settings')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === 'settings' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      Settings
                    </button>
                  </>
                )}
              </>
            ) : (
              /* Admin Navigation ONLY */
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-950 text-red-400 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider">
                  Administration
                </span>
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'admin-dashboard' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  MRR Stats
                </button>
                <button
                  onClick={() => onNavigate('admin-users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 'admin-users' ? 'bg-[#1e341e] text-emerald-400' : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  User Management
                </button>
              </div>
            )}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2.5">
            {/* Install PWA Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182c18] border border-[#2b4c2b] text-emerald-300 hover:text-white text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {isPro && !isAdmin && (
                  <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    PRO ACTIVE
                  </span>
                )}

                <button
                  onClick={() => {
                    logout();
                    onNavigate('landing');
                  }}
                  className="p-2 rounded-xl bg-[#192b19] border border-[#2c472c] text-emerald-300 hover:text-red-400 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-950 transition-transform transform active:scale-[0.98] cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#192b19] border border-[#2c472c] text-emerald-300 md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#112011] border-b border-[#243d24] px-4 py-4 space-y-2">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                >
                  Home
                </button>
                <button
                  onClick={() => { onNavigate('pricing'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                >
                  Pricing ($4.99/mo)
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => { onNavigate('scan'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                    >
                      Scan Product
                    </button>
                    <button
                      onClick={() => { onNavigate('history'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                    >
                      Scan History
                    </button>
                    <button
                      onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                    >
                      Health Profile & Allergies
                    </button>
                    <button
                      onClick={() => { onNavigate('settings'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:bg-[#1b311b]"
                    >
                      Settings & Subscription
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => { onNavigate('admin-dashboard'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-300 hover:bg-[#1b311b]"
                >
                  MRR / ARR Dashboard
                </button>
                <button
                  onClick={() => { onNavigate('admin-users'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-300 hover:bg-[#1b311b]"
                >
                  User Management
                </button>
              </>
            )}

            <button
              onClick={() => { setShowInstallModal(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-400 hover:bg-[#1b311b] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install Mobile App
            </button>
          </div>
        )}
      </header>

      <PWAInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
};
