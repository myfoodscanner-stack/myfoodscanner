import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  FlaskConical,
  X,
  Calendar,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ScanHistoryItem, FoodScanResult } from '../../types';
import { ScoreGauge } from '../../components/ScoreGauge';
import { ScanResultCard } from '../../components/ScanResultCard';
import { BlurredModulePreview } from '../../components/BlurredModulePreview';

interface HistoryPageProps {
  onNavigate: (page: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { token, isPro } = useAuth();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNova, setSelectedNova] = useState<number | 'all'>('all');
  const [selectedScanDetail, setSelectedScanDetail] = useState<FoodScanResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    averageScore: 0,
    bestProduct: null as { name: string; brand: string; score: number } | null,
    additivesAvoidedCount: 0,
  });

  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistoryAndStats = async () => {
    if (!token || !isPro) {
      setLoading(false);
      return;
    }

    try {
      const [histRes, statsRes] = await Promise.all([
        fetch('/api/history', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.history || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, [token, isPro]);

  const handleRequestDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItemToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;
    setIsDeleting(true);

    // Optimistic removal for instant UI feedback
    setHistory(prev => prev.filter(item => item.id !== targetId && item.scan_id !== targetId));

    try {
      const res = await fetch(`/api/history/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn('Server delete returned status:', res.status);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
      fetchHistoryAndStats();
    }
  };

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/history/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scan) {
          setSelectedScanDetail(data.scan);
        }
      } else {
        console.error('Error fetching scan detail:', res.status);
      }
    } catch (err) {
      console.error('Error fetching scan details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNova = selectedNova === 'all' || item.nova_score === selectedNova;
    return matchesSearch && matchesNova;
  });

  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Food Scan History
            </h1>
            <p className="text-xs text-emerald-200/80">
              Keep a record of all analyzed foods and monitor your healthy dietary progress.
            </p>
          </div>

          <BlurredModulePreview
            title="Scan History Locked"
            description="Upgrade to Pro to save all your grocery scans and track toxic chemicals and additives avoided."
            onUnlock={() => onNavigate('pricing')}
          >
            <div className="space-y-3 p-4">
              <div className="p-4 rounded-xl bg-[#182d18] border border-[#2b4c2b] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Chocolate Filled Cereals</h4>
                  <p className="text-xs text-emerald-400">Score 24/100 • NOVA 4</p>
                </div>
                <span className="text-xs text-red-400 font-bold">2 Additives</span>
              </div>
              <div className="p-4 rounded-xl bg-[#182d18] border border-[#2b4c2b] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Organic Oat Muesli</h4>
                  <p className="text-xs text-emerald-400">Score 94/100 • NOVA 1</p>
                </div>
                <span className="text-xs text-emerald-400 font-bold">0 Additives</span>
              </div>
            </div>
          </BlurredModulePreview>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-6 px-4 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Scan History
            </h1>
            <p className="text-xs text-emerald-200/70">
              Access your food analyses and track your positive health impact.
            </p>
          </div>

          <button
            onClick={() => onNavigate('scan')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Scan a new product
          </button>
        </div>

        {/* 4 Health Stats KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#142314] border border-[#243d24] rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">Total Scans</span>
              <History className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold font-display text-white">{stats.totalScans}</span>
          </div>

          <div className="bg-[#142314] border border-[#243d24] rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">Health Avg</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold font-display text-emerald-400">{stats.averageScore}/100</span>
          </div>

          <div className="bg-[#142314] border border-[#243d24] rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">Best Choice</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-bold font-display text-white truncate block">
              {stats.bestProduct ? stats.bestProduct.name : '—'}
            </span>
          </div>

          <div className="bg-[#142314] border border-[#243d24] rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">Additives Avoided</span>
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold font-display text-amber-400">{stats.additivesAvoidedCount}</span>
          </div>
        </div>

        {/* Search & NOVA Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or brand..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#142314] border border-[#263e26] rounded-xl text-xs text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', 1, 2, 3, 4].map((novaVal) => (
              <button
                key={novaVal}
                onClick={() => setSelectedNova(novaVal as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  selectedNova === novaVal
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#142314] text-emerald-300/70 border-[#263e26] hover:text-white'
                }`}
              >
                {novaVal === 'all' ? 'All NOVA' : `NOVA ${novaVal}`}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-emerald-400/70">Loading your history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-[#142314] border border-[#243d24] rounded-3xl p-10 text-center space-y-3">
            <History className="w-10 h-10 text-emerald-400/50 mx-auto" />
            <h3 className="text-base font-bold text-white">No scans found</h3>
            <p className="text-xs text-emerald-200/70 max-w-sm mx-auto">
              You have not scanned matching products yet. Start by using the scanner!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.scan_id || item.id)}
                className="bg-[#142314] hover:bg-[#182918] border border-[#243d24] hover:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <ScoreGauge score={item.global_score} size="sm" showLabel={false} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">
                      {item.brand || 'Standard Brand'}
                    </span>
                    <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-emerald-300/60 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.timestamp || item.created_at || Date.now()).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className={`font-semibold ${item.nova_score === 4 ? 'text-red-400' : 'text-emerald-400'}`}>
                        NOVA {item.nova_score}
                      </span>
                      <span>•</span>
                      <span>{item.additives_count} additive{item.additives_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400/80 group-hover:text-emerald-300 transition-colors">
                    View sheet <ExternalLink className="w-3 h-3" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleRequestDelete(item.id, item.product_name, e)}
                    className="p-2.5 rounded-xl text-emerald-400/60 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer border border-transparent hover:border-red-800/40"
                    title="Delete this scan from history"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal (100% Reliable in iframes) */}
        {itemToDelete && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setItemToDelete(null);
              }
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#142314] border border-[#2b4c2b] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">Remove from History?</h3>
                  <p className="text-xs text-emerald-300/70 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-[#0e190e] border border-[#1f381f] rounded-xl p-3 text-xs text-emerald-100 font-semibold truncate">
                {itemToDelete.name}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1d331d] hover:bg-[#254225] border border-[#2c4e2c] text-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-red-900/30 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading detail spinner overlay */}
        {loadingDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#142314] border border-[#2b4c2b] rounded-2xl p-6 flex items-center gap-3 text-white shadow-2xl">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <span className="text-sm font-semibold text-emerald-200">Opening full product sheet...</span>
            </div>
          </div>
        )}

        {/* Detail Modal / Full Product Sheet (Mobile-first responsive overlay) */}
        {selectedScanDetail && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedScanDetail(null);
              }
            }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto"
          >
            {/* Sticky Header Bar on Top */}
            <div className="sticky top-0 z-30 bg-[#0d160d]/95 backdrop-blur-lg border-b border-[#223d22] px-4 py-3 shadow-md">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedScanDetail(null)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to History</span>
                </button>

                <span className="text-xs font-extrabold text-white truncate max-w-[140px] sm:max-w-[240px]">
                  {selectedScanDetail.product_name}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedScanDetail(null)}
                  className="p-2 rounded-xl bg-[#172b17] hover:bg-red-950/50 text-emerald-300 hover:text-red-300 border border-[#2b4c2b] hover:border-red-500/40 transition-colors cursor-pointer"
                  title="Close product sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body with Product Sheet */}
            <div className="max-w-2xl mx-auto p-3 sm:p-6 pb-28 sm:pb-16 space-y-4">
              <ScanResultCard scan={selectedScanDetail} />

              {/* Bottom Quick Return Button */}
              <div className="text-center pt-2 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScanDetail(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#142614] hover:bg-[#1a321a] border border-[#2c4e2c] text-emerald-300 hover:text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Scan History List</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
