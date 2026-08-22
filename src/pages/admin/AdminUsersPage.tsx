import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Shield,
  Crown,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface AdminUsersPageProps {
  onNavigate: (page: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigate }) => {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'pro' | 'free'>('all');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, isAdmin]);

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteConfirmUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(`User ${deleteConfirmUser.email} deleted.`);
        setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
        setDeleteConfirmUser(null);
      } else {
        alert(data.error || 'Error deleting user.');
      }
    } catch (err) {
      alert('Network error during deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesTier = filterTier === 'all' || u.tier === filterTier;
    return matchesSearch && matchesRole && matchesTier;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-red-300 flex items-center justify-center p-4">
        <div className="bg-red-950/80 border border-red-500/50 rounded-3xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold font-display text-white">403 — Administrator Access Denied</h2>
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f331f] pb-6">
          <div>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to MRR Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              User Management ({users.length})
            </h1>
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#101c10] border border-[#203620] rounded-xl text-xs text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 bg-[#101c10] border border-[#203620] rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className="px-3 py-2 bg-[#101c10] border border-[#203620] rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="pro">Pro</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-[#101c10] border border-[#203620] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c160c] border-b border-[#1f331f] text-emerald-400/80 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Total Scans</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182918]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#142314] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[11px] text-emerald-300/60 font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-300">{u.region || 'EU'}</td>
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#182b18] text-emerald-300 border border-[#284428] text-[10px] font-bold">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.tier === 'pro' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                          <Crown className="w-3.5 h-3.5" />
                          PRO ({u.subscription_plan || 'monthly'})
                        </span>
                      ) : (
                        <span className="text-emerald-400/60 font-semibold">Free</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.subscription_status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : u.subscription_status === 'cancelled'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : u.subscription_status === 'refunded'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {u.subscription_status || 'free'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {u.scan_history?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400/40 font-mono italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete User Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#142314] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <h3 className="text-lg font-bold text-white">Delete this user account?</h3>
            <p className="text-xs text-emerald-200/80">
              Are you sure you want to permanently delete the account of <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              This action is irreversible and will remove all associated scan history.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
