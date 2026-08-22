export type UserRole = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'refunded' | 'expired' | 'none';
export type Region = 'UK' | 'US' | 'CA' | 'AU' | 'EU' | 'Other';

export interface DietProfile {
  allergies: string[];
  regime: string[];
  intolerances: string[];
  objectives: string[];
  has_children: boolean;
  children_ages: string[] | number[];
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  is_diabetic: boolean;
  pathologies?: string[];
}

export type UserDietProfile = DietProfile;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: SubscriptionTier;
  subscription_id?: string;
  subscription_status: SubscriptionStatus;
  subscription_plan?: 'monthly' | 'annual';
  subscription_start?: string;
  subscription_renews_at?: string;
  first_payment_date?: string;
  region: Region;
  diet_profile: DietProfile;
  created_at: string;
  scans_count: number;
}

export interface AdditiveInfo {
  code: string;
  name: string;
  risk_level: 'low' | 'medium' | 'high';
  description: string;
  sources: string[];
}

export interface EndocrineDisruptorInfo {
  name: string;
  ingredient: string;
  risk_level: 'low' | 'medium' | 'high';
  description: string;
}

export interface NutritionPer100g {
  calories: number;
  fat: number;
  saturated_fat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
}

export interface ScanScores {
  global: number;
  additives: number;
  endocrine_disruptors: number;
  nova: number; // 1-4
  glycemic_impact: number;
  environmental: number;
  nutrition?: number;
}

export interface HealthierAlternative {
  name: string;
  brand?: string;
  category?: string;
  score: number;
  why_better: string;
}

export interface FoodScanResult {
  id: string;
  user_id: string;
  image_url: string;
  product_name: string;
  brand: string;
  barcode: string | null;
  ingredients: string[];
  ingredients_raw?: string;
  additives: AdditiveInfo[];
  endocrine_disruptors: EndocrineDisruptorInfo[];
  nova_score: 1 | 2 | 3 | 4;
  nova_explanation: string;
  glycemic_index: number | null;
  glycemic_load: number | null;
  glycemic_explanation: string;
  nutrition_per_100g: NutritionPer100g;
  allergens_detected: string[];
  palm_oil: boolean;
  scores: ScanScores;
  alerts: string[];
  children_alerts: string[];
  pregnant_alerts: string[];
  diabetic_alerts: string[];
  positive_points: string[];
  negative_points: string[];
  alternatives: HealthierAlternative[];
  alternatives_suggestion?: string;
  scientific_sources: string[];
  children_safe: boolean;
  pregnant_safe: boolean;
  timestamp: string;
}

export interface ScanHistoryItem {
  id: string;
  user_id: string;
  scan_id: string;
  product_name: string;
  brand?: string;
  global_score: number;
  nova_score: number;
  additives_count: number;
  allergens_count: number;
  timestamp: string;
  image_url: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  currency: string;
  plan: 'monthly' | 'annual';
  status: 'completed' | 'refunded' | 'cancelled';
  paypal_order_id?: string;
  date: string;
}

export interface AdminStats {
  mrr: number;
  arr: number;
  total_users: number;
  active_pro_users: number;
  cancelled_users: number;
  refunded_users: number;
  new_users_today: number;
  new_users_this_week: number;
  top_scanned_products: { name: string; brand: string; count: number; avg_score: number }[];
  global_average_score: number;
  regional_distribution: { region: Region; count: number; percentage: number }[];
  total_scans: number;
}
