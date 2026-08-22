import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, FoodScanResult, ScanHistoryItem, Transaction, AdminStats } from '../src/types';

const STORAGE_FILE = path.join(process.cwd(), 'database_store.json');

// Persistent state with file sync
class Database {
  private users: Map<string, User & { password_hash: string }> = new Map();
  private scans: Map<string, FoodScanResult> = new Map();
  private scanHistory: ScanHistoryItem[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private persist() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        scans: Array.from(this.scans.entries()),
        scanHistory: this.scanHistory,
        transactions: this.transactions,
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public reloadFromDisk() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          this.users = new Map(data.users);
        }
        if (data.scans && Array.isArray(data.scans)) {
          this.scans = new Map(data.scans);
        }
        if (data.scanHistory && Array.isArray(data.scanHistory)) {
          this.scanHistory = data.scanHistory;
        }
        if (data.transactions && Array.isArray(data.transactions)) {
          this.transactions = data.transactions;
        }
        console.log(`Database loaded from disk: ${this.users.size} users, ${this.scans.size} scans.`);
        return;
      }
    } catch (err) {
      console.warn('Error loading disk database, falling back to seed:', err);
    }

    // If no store exists, seed initial data
    this.seedInitialData();
    this.persist();
  }

  private async seedInitialData() {
    const adminPasswordHash = bcrypt.hashSync('Myfoodscanner_2026', 10);

    // 1. Admin Seed
    const adminUser: User & { password_hash: string } = {
      id: 'usr_admin_001',
      email: 'contact@myfoodscanner.com',
      name: 'Admin MyFoodScanner',
      role: 'admin',
      tier: 'pro',
      subscription_status: 'active',
      subscription_plan: 'annual',
      subscription_start: new Date().toISOString(),
      first_payment_date: new Date().toISOString(),
      region: 'EU',
      diet_profile: {
        allergies: [],
        regime: [],
        intolerances: [],
        objectives: ['Réduire les additifs', 'Éviter les perturbateurs endocriniens'],
        has_children: false,
        children_ages: [],
        is_pregnant: false,
        is_breastfeeding: false,
        is_diabetic: false,
      },
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      scans_count: 0,
      password_hash: adminPasswordHash,
    };
    this.users.set(adminUser.email.toLowerCase(), adminUser);
  }

  // --- Users Operations ---
  public async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
    return this.users.get(email.toLowerCase().trim());
  }

  public async getUserById(id: string): Promise<(User & { password_hash: string }) | undefined> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).map(u => {
      const { password_hash, ...safeUser } = u;
      return safeUser;
    });
  }

  public async createUser(userData: {
    email: string;
    password_hash: string;
    name: string;
    region: any;
    role?: 'user' | 'admin';
  }): Promise<User> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user: User & { password_hash: string } = {
      id,
      email: userData.email.toLowerCase().trim(),
      name: userData.name,
      role: userData.role || 'user',
      tier: 'free',
      subscription_status: 'none',
      region: userData.region || 'EU',
      diet_profile: {
        allergies: [],
        regime: [],
        intolerances: [],
        objectives: [],
        has_children: false,
        children_ages: [],
        is_pregnant: false,
        is_breastfeeding: false,
        is_diabetic: false,
      },
      created_at: new Date().toISOString(),
      scans_count: 0,
      password_hash: userData.password_hash,
    };
    this.users.set(user.email, user);
    this.persist();
    return this.sanitizeUser(user);
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.getUserById(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.users.set(updated.email.toLowerCase(), updated);
    this.persist();
    return this.sanitizeUser(updated);
  }

  public async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user) return false;
    if (user.role === 'admin') return false; // Protect root admin from deletion
    this.users.delete(user.email.toLowerCase());
    this.scanHistory = this.scanHistory.filter(h => h.user_id !== id);
    this.persist();
    return true;
  }

  public sanitizeUser(user: User & { password_hash?: string }): User {
    const { password_hash, ...safeUser } = user;
    return safeUser as User;
  }

  // --- Scans & History Operations ---
  public async saveScan(scan: FoodScanResult): Promise<FoodScanResult> {
    this.scans.set(scan.id, scan);
    
    // Add to history
    const historyItem: ScanHistoryItem = {
      id: `hist_${scan.id}`,
      user_id: scan.user_id,
      scan_id: scan.id,
      product_name: scan.product_name,
      brand: scan.brand,
      global_score: scan.scores.global,
      nova_score: scan.nova_score,
      additives_count: scan.additives.length,
      allergens_count: scan.allergens_detected.length,
      timestamp: scan.timestamp,
      image_url: scan.image_url,
    };
    this.scanHistory.unshift(historyItem);

    // Update user's scan count
    const user = await this.getUserById(scan.user_id);
    if (user) {
      user.scans_count = (user.scans_count || 0) + 1;
      this.users.set(user.email.toLowerCase(), user);
    }

    this.persist();
    return scan;
  }

  public async getScanById(id: string): Promise<FoodScanResult | undefined> {
    if (this.scans.has(id)) {
      return this.scans.get(id);
    }
    // Search by scan_id in history
    const hist = this.scanHistory.find(h => h.id === id || h.scan_id === id);
    if (hist && this.scans.has(hist.scan_id)) {
      return this.scans.get(hist.scan_id);
    }
    // Strip hist_ prefix if present
    if (id.startsWith('hist_')) {
      const rawId = id.replace(/^hist_/, '');
      if (this.scans.has(rawId)) {
        return this.scans.get(rawId);
      }
    }
    return undefined;
  }

  public async getUserScanHistory(userId: string): Promise<ScanHistoryItem[]> {
    return this.scanHistory.filter(h => h.user_id === userId);
  }

  public async deleteScanHistoryItem(userId: string, targetId: string): Promise<boolean> {
    const cleanTargetId = targetId.trim();
    const rawIdWithoutHist = cleanTargetId.replace(/^hist_/, '');
    const index = this.scanHistory.findIndex(
      h => (
        h.id === cleanTargetId || 
        h.scan_id === cleanTargetId || 
        h.id === `hist_${cleanTargetId}` || 
        h.id === `hist_${rawIdWithoutHist}` || 
        h.scan_id === rawIdWithoutHist
      ) && h.user_id === userId
    );
    if (index !== -1) {
      const item = this.scanHistory[index];
      this.scans.delete(item.scan_id);
      this.scans.delete(item.id);
      this.scans.delete(`hist_${item.scan_id}`);
      this.scanHistory.splice(index, 1);
      this.persist();
      return true;
    }
    // If not found in history array, try deleting directly from scans map if user owns it
    if (this.scans.has(cleanTargetId) || this.scans.has(rawIdWithoutHist)) {
      const scanKey = this.scans.has(cleanTargetId) ? cleanTargetId : rawIdWithoutHist;
      const s = this.scans.get(scanKey);
      if (s && s.user_id === userId) {
        this.scans.delete(scanKey);
        this.scanHistory = this.scanHistory.filter(h => h.scan_id !== scanKey && h.id !== scanKey && h.id !== `hist_${scanKey}`);
        this.persist();
        return true;
      }
    }
    return false;
  }

  // --- Transactions ---
  public async recordTransaction(tx: Transaction): Promise<Transaction> {
    this.transactions.unshift(tx);
    this.persist();
    return tx;
  }

  public async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.user_id === userId);
  }

  // --- Admin Statistics ---
  public async getAdminStats(): Promise<AdminStats> {
    const allUsers = Array.from(this.users.values()).filter(u => u.role !== 'admin');
    const totalUsers = allUsers.length;
    const activeProUsers = allUsers.filter(u => u.subscription_status === 'active').length;
    const cancelledUsers = allUsers.filter(u => u.subscription_status === 'cancelled').length;
    const refundedUsers = allUsers.filter(u => u.subscription_status === 'refunded').length;

    // Monthly Recurring Revenue calculation:
    // Monthly plan: $4.99 / mo
    // Annual plan: $29.99 / yr => $2.499 / mo
    let mrr = 0;
    allUsers.forEach(u => {
      if (u.subscription_status === 'active') {
        if (u.subscription_plan === 'annual') {
          mrr += 29.99 / 12;
        } else {
          mrr += 4.99;
        }
      }
    });
    const arr = mrr * 12;

    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const newUsersToday = allUsers.filter(u => new Date(u.created_at) >= oneDayAgo).length;
    const newUsersThisWeek = allUsers.filter(u => new Date(u.created_at) >= oneWeekAgo).length;

    // Region distribution
    const regionCounts: Record<string, number> = { UK: 0, US: 0, CA: 0, AU: 0, EU: 0, Other: 0 };
    allUsers.forEach(u => {
      const reg = u.region || 'Other';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });

    const regional_distribution = Object.entries(regionCounts).map(([region, count]) => ({
      region: region as any,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
    }));

    // Scanned products aggregations
    const productScanStats: Map<string, { name: string; brand: string; count: number; totalScore: number }> = new Map();
    let totalScoreSum = 0;
    const allScansList = Array.from(this.scans.values());

    for (const scan of allScansList) {
      totalScoreSum += scan.scores.global;
      const key = `${scan.product_name}___${scan.brand}`;
      const existing = productScanStats.get(key) || { name: scan.product_name, brand: scan.brand, count: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalScore += scan.scores.global;
      productScanStats.set(key, existing);
    }

    const top_scanned_products = Array.from(productScanStats.values())
      .map(p => ({
        name: p.name,
        brand: p.brand,
        count: p.count,
        avg_score: Math.round(p.totalScore / p.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const global_average_score = allScansList.length > 0 ? Math.round(totalScoreSum / allScansList.length) : 0;

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      total_users: totalUsers,
      active_pro_users: activeProUsers,
      cancelled_users: cancelledUsers,
      refunded_users: refundedUsers,
      new_users_today: newUsersToday,
      new_users_this_week: newUsersThisWeek,
      top_scanned_products,
      global_average_score,
      regional_distribution,
      total_scans: allScansList.length,
    };
  }
}

export const db = new Database();
