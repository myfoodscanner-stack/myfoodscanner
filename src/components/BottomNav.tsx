import React from 'react';
import { Scan, History, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { user, isAdmin } = useAuth();

  // Do not render for visitors not on dashboard or admins
  if (isAdmin || !user) return null;

  const navItems = [
    { id: 'history', label: 'History', icon: History },
    { id: 'scan', label: 'Scan', icon: Scan, isPrimary: true },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d180d]/95 backdrop-blur-lg border-t border-[#223b22] px-3 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center -mt-6 group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-emerald-400 to-green-500 text-gray-950 shadow-emerald-900/80 ring-4 ring-[#0d180d]'
                    : 'bg-emerald-600 text-gray-950 shadow-emerald-950 ring-4 ring-[#0d180d]'
                }`}>
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-emerald-400' : 'text-emerald-300/70'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-3 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-emerald-300/60 hover:text-emerald-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
