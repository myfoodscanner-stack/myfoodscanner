import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
  Download,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Transaction } from '../../types';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, token, logout, refreshUser } = useAuth();
  const [subStatus, setSubStatus] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchStatusAndTransactions = async () => {
    if (!token) return;
    try {
      const [statusRes, txRes] = await Promise.all([
        fetch('/api/subscription/status', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/subscription/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setSubStatus(sData);
      }
      if (txRes.ok) {
        const tData = await txRes.json();
        setTransactions(tData.transactions || []);
      }
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndTransactions();
  }, [token]);

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation processing failed.');

      setMessage({ text: data.message, type: 'success' });
      setShowCancelModal(false);
      await refreshUser();
      fetchStatusAndTransactions();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-6 px-4 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Settings & Subscription
          </h1>
          <p className="text-xs text-emerald-200/70">
            Manage your account details, Pro membership status, and payment receipts.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/50 text-red-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Section 1: Account Details */}
        <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold font-display text-white">My Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0f1a0f] p-3 rounded-xl border border-[#203620]">
              <span className="text-emerald-400/70 block mb-0.5">Username</span>
              <span className="font-bold text-white text-sm">{user?.name}</span>
            </div>
            <div className="bg-[#0f1a0f] p-3 rounded-xl border border-[#203620]">
              <span className="text-emerald-400/70 block mb-0.5">Email Address</span>
              <span className="font-bold text-white text-sm">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Subscription Status */}
        <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#223b22] pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-white">Plan & Billing</h3>
              <p className="text-xs text-emerald-300/70">
                {user?.subscription_status === 'active'
                  ? `Active ${user.subscription_plan === 'annual' ? 'Annual Plan ($29.99/yr)' : 'Monthly Plan ($4.99/mo)'}`
                  : user?.subscription_status === 'cancelled'
                  ? 'Cancelled Plan (Active until end of current billing period)'
                  : user?.subscription_status === 'refunded'
                  ? 'Subscription Refunded'
                  : 'Free Account (No active subscription)'}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto border ${
                user?.subscription_status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : user?.subscription_status === 'cancelled'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {user?.subscription_status === 'active' ? 'PRO ACTIVE' : user?.subscription_status?.toUpperCase() || 'INACTIVE'}
            </span>
          </div>

          {/* Cancellation section */}
          {user?.subscription_status === 'active' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-xs font-semibold text-white">Auto-Renewal Settings</p>
                <p className="text-[11px] text-emerald-300/60">
                  Next scheduled billing date: {user.subscription_renews_at ? new Date(user.subscription_renews_at).toLocaleDateString() : '—'}
                </p>
              </div>

              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-xl bg-[#192b19] hover:bg-[#203820] border border-[#2b4b2b] text-emerald-300 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel Auto-Renewal
              </button>
            </div>
          )}

          {user?.subscription_status !== 'active' && (
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-gray-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Reactivate Pro Access
            </button>
          )}
        </div>

        {/* Section 3: Transactions History */}
        <div className="bg-[#142314] border border-[#263e26] rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Payment History
          </h3>

          {transactions.length === 0 ? (
            <p className="text-xs text-emerald-300/60 py-2">No transactions recorded for this account yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-[#0f1b0f] p-3 rounded-xl border border-[#203620] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {tx.plan === 'annual' ? 'Pro Annual Plan' : 'Pro Monthly Plan'}
                    </span>
                    <span className="text-[10px] text-emerald-400/60">
                      {new Date(tx.date).toLocaleDateString()} • {tx.paypal_order_id || 'PayPal'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`font-bold ${tx.status === 'refunded' ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] block uppercase font-semibold text-emerald-300/70">
                      {tx.status === 'completed' ? 'Paid' : 'Refunded'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              logout();
              onNavigate('landing');
            }}
            className="px-6 py-2.5 rounded-xl bg-[#182a18] border border-[#2a452a] text-red-300 hover:text-red-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Modal Cancel Auto-Renewal Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#142314] border border-[#2b4c2b] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold font-display text-white">
              Cancel Automatic Renewal?
            </h3>

            <p className="text-xs text-emerald-200/80 leading-relaxed">
              You will retain full Pro benefits and all 6 health modules until the end of your current billing cycle. You will not be charged again.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white cursor-pointer"
              >
                Keep My Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold text-xs shadow-lg cursor-pointer"
              >
                {actionLoading ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
