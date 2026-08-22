import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Award,
  Send,
  AlertTriangle,
  CheckCircle2,
  Globe,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminStats } from '../../types';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { token, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [token, isAdmin]);

  const handleBroadcastAlert = async () => {
    if (!confirm('Broadcast the weekly food safety alert to all active subscribers via Brevo?')) return;

    setBroadcasting(true);
    setBroadcastMessage(null);

    try {
      const res = await fetch('/api/admin/broadcast-weekly-alert', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setBroadcastMessage(data.message || 'Alert broadcast sent successfully!');
      } else {
        setBroadcastMessage('Error during alert broadcast.');
      }
    } catch (err) {
      setBroadcastMessage('Network error during broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-red-300 flex items-center justify-center p-4">
        <div className="bg-red-950/80 border border-red-500/50 rounded-3xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold font-display text-white">403 — Administrator Access Denied</h2>
          <p className="text-xs text-red-200/80">
            This area is strictly restricted to My Food Scanner administrators.
          </p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091009] text-emerald-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f331f] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider">
                Super-Admin Portal
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">contact@myfoodscanner.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Admin Dashboard & MRR Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('admin-users')}
              className="px-4 py-2 rounded-xl bg-[#142614] hover:bg-[#1c361c] border border-[#2b4c2b] text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Users
            </button>

            <button
              onClick={handleBroadcastAlert}
              disabled={broadcasting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {broadcasting ? 'Sending...' : 'Broadcast Brevo Alert'}
            </button>
          </div>
        </div>

        {broadcastMessage && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{broadcastMessage}</span>
          </div>
        )}

        {/* 6 Top Financial & Growth Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="bg-[#101c10] border border-[#203620] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Monthly MRR</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold font-display text-white">
              ${stats?.mrr.toFixed(2) || '0.00'}
            </span>
            <span className="text-[11px] text-emerald-400/80 block mt-1">Estimated recurring revenue</span>
          </div>

          {/* ARR */}
          <div className="bg-[#101c10] border border-[#203620] rounded-2xl p-5">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Annual ARR</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold font-display text-emerald-400">
              ${stats?.arr.toFixed(2) || '0.00'}
            </span>
            <span className="text-[11px] text-emerald-400/80 block mt-1">12-month run-rate projection</span>
          </div>

          {/* Active Subscribers */}
          <div className="bg-[#101c10] border border-[#203620] rounded-2xl p-5">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Active Subscribers</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.active_subscribers || 0}
            </span>
            <span className="text-[11px] text-emerald-300/60 block mt-1">
              Out of {stats?.total_users || 0} total registered users
            </span>
          </div>

          {/* Total Scans */}
          <div className="bg-[#101c10] border border-[#203620] rounded-2xl p-5">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Total Scans Run</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.total_scans || 0}
            </span>
            <span className="text-[11px] text-emerald-300/60 block mt-1">
              Global avg score: {stats?.global_average_score || 0}/100
            </span>
          </div>
        </div>

        {/* Churn & Refund stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#101c10] border border-[#203620] p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300/70 block">Cancelled Subscriptions</span>
              <span className="text-xl font-bold text-amber-400">{stats?.cancelled_subscribers || 0}</span>
            </div>
            <RotateCcw className="w-5 h-5 text-amber-400/60" />
          </div>

          <div className="bg-[#101c10] border border-[#203620] p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300/70 block">48h Refunds Issued</span>
              <span className="text-xl font-bold text-red-400">{stats?.refunded_count || 0}</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400/60" />
          </div>

          <div className="bg-[#101c10] border border-[#203620] p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300/70 block">Pro Conversion Rate</span>
              <span className="text-xl font-bold text-emerald-400">
                {stats?.total_users ? Math.round(((stats.active_subscribers) / stats.total_users) * 100) : 0}%
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-400/60" />
          </div>
        </div>

        {/* Top 10 Most Scanned Products */}
        <div className="bg-[#101c10] border border-[#203620] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top 10 Most Scanned Products on Platform
            </h3>
          </div>

          {!stats?.top_products || stats.top_products.length === 0 ? (
            <p className="text-xs text-emerald-300/60 py-4 text-center">No scans recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.top_products.map((prod, idx) => (
                <div
                  key={idx}
                  className="bg-[#0b140b] p-3 rounded-xl border border-[#1b2d1b] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#152415] text-emerald-400 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{prod.product_name}</span>
                      <span className="text-[10px] text-emerald-400/70">{prod.brand}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-emerald-400">Score {prod.score}/100</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#142314] text-white font-mono text-[11px] font-bold">
                      {prod.count} scan{prod.count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
