import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { ScanPage } from './pages/dashboard/ScanPage';
import { HistoryPage } from './pages/dashboard/HistoryPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

interface AppContentProps {}

const AppContent: React.FC<AppContentProps> = () => {
  const { user, isAdmin, isPro, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  // Sync initial page based on auth state & role boundaries
  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        if (!currentPage.startsWith('admin-')) {
          setCurrentPage('admin-dashboard');
        }
      }
    }
  }, [isAdmin, loading]);

  const handleNavigate = (page: string, overrideUser?: any) => {
    const activeUser = overrideUser !== undefined ? overrideUser : user;
    const activeAdmin = activeUser?.role === 'admin';
    const activePro = activeUser?.tier === 'pro' && (activeUser?.subscription_status === 'active' || activeUser?.subscription_status === 'cancelled');

    // 1. Role boundary: Admin pages accessed without admin privileges
    if (page.startsWith('admin-') && !activeAdmin && page !== 'admin-login') {
      setCurrentPage('admin-login');
      return;
    }

    // 2. Role boundary: Admin trying to use regular consumer scanning modules
    if (activeAdmin && ['scan', 'history', 'profile', 'settings'].includes(page)) {
      setCurrentPage('admin-dashboard');
      return;
    }

    // 3. User authentication guard: Protected user pages require login
    if (!activeUser && ['scan', 'history', 'profile', 'settings'].includes(page)) {
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d160d] flex items-center justify-center text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-300/80">
            My Food Scanner
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 flex flex-col selection:bg-emerald-500 selection:text-gray-950 font-sans">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {currentPage === 'admin-login' && <AdminLoginPage onNavigate={handleNavigate} />}
        {currentPage === 'scan' && <ScanPage onNavigate={handleNavigate} />}
        {currentPage === 'history' && <HistoryPage onNavigate={handleNavigate} />}
        {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
        {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
        {currentPage === 'admin-dashboard' && <AdminDashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'admin-users' && <AdminUsersPage onNavigate={handleNavigate} />}
      </main>

      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
