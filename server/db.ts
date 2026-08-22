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
    const adminPasswordHash = bcrypt.hashSync('MyFoodScanner_2026', 10);
    const demoPasswordHash = bcrypt.hashSync('Myfoodscanner_2026', 10);

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

    // 2. Demo User Seed (demo@myfoodscanner.com)
    const demoUser: User & { password_hash: string } = {
      id: 'usr_demo_002',
      email: 'demo@myfoodscanner.com',
      name: 'Sophie Laurent',
      role: 'user',
      tier: 'pro',
      subscription_id: 'I-SUB-DEMO-2026',
      subscription_status: 'active',
      subscription_plan: 'monthly',
      subscription_start: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      first_payment_date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // within 48h for guarantee demo!
      region: 'EU',
      diet_profile: {
        allergies: ['Gluten', 'Lactose'],
        regime: ['Végétarien'],
        intolerances: ['Lactose'],
        objectives: ['Réduire les additifs', 'Éviter les perturbateurs endocriniens', 'Protéger mes enfants'],
        has_children: true,
        children_ages: [3, 7],
        is_pregnant: false,
        is_breastfeeding: false,
        is_diabetic: false,
      },
      created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      scans_count: 5,
      password_hash: demoPasswordHash,
    };
    this.users.set(demoUser.email.toLowerCase(), demoUser);

    // Seed transaction for demo user
    this.transactions.push({
      id: 'txn_demo_001',
      user_id: demoUser.id,
      user_email: demoUser.email,
      amount: 4.99,
      currency: 'USD',
      plan: 'monthly',
      status: 'completed',
      paypal_order_id: 'PAYPAL-DEMO-ORDER-101',
      date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    });

    // 3. Preload 5 realistic scans for the demo user (100% in English)
    const sampleScans: FoodScanResult[] = [
      {
        id: 'scan_demo_1',
        user_id: demoUser.id,
        image_url: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&auto=format&fit=crop&q=80',
        product_name: 'Crispy Choco Hazelnut Cereals',
        brand: 'ChocoKids Deluxe',
        barcode: '3017620422003',
        ingredients: ['Wheat flour 45%', 'Sugar 32%', 'Palm oil', 'Fat-reduced cocoa powder 7%', 'Glucose syrup', 'E150d (Ammonia caramel)', 'E322 (Soy lecithin)', 'Artificial vanillin flavoring', 'Salt'],
        ingredients_raw: 'Wheat flour, sugar, palm oil, cocoa powder, E150d, soy lecithin E322, vanillin aroma, salt.',
        additives: [
          {
            code: 'E150d',
            name: 'Sulphite Ammonia Caramel',
            risk_level: 'high',
            description: 'Synthetic colorant containing 4-MEI, classified as a possible human carcinogen (Group 2B) by IARC/EFSA.',
            sources: ['EFSA Journal 2011;9(3):2004', 'IARC Monographs Vol 101']
          },
          {
            code: 'E322',
            name: 'Soy Lecithin',
            risk_level: 'low',
            description: 'Plant-derived emulsifier generally recognized as safe for the general population.',
            sources: ['EFSA Panel on Food Additives']
          }
        ],
        endocrine_disruptors: [
          {
            name: 'High-Temperature Refined Palm Oil (3-MCPD)',
            ingredient: 'Palm oil',
            risk_level: 'medium',
            description: 'Process contaminant formed during high-temperature oil refining, classified as a metabolic disruptor and potential carcinogen.'
          }
        ],
        nova_score: 4,
        nova_explanation: 'Ultra-processed formulation containing refined fast sugars, hydrogenated vegetable fats, and synthetic flavorings.',
        glycemic_index: 82,
        glycemic_load: 26,
        glycemic_explanation: 'Critical glycemic load triggering rapid blood glucose spikes and insulin surges followed by reactive hypoglycemia.',
        nutrition_per_100g: {
          calories: 445,
          fat: 14.5,
          saturated_fat: 6.8,
          carbohydrates: 71.0,
          sugars: 34.0,
          fiber: 3.2,
          protein: 6.5,
          salt: 0.75
        },
        allergens_detected: ['Gluten', 'Soy'],
        palm_oil: true,
        scores: {
          global: 24,
          additives: 28,
          endocrine_disruptors: 35,
          nova: 20,
          glycemic_impact: 18,
          environmental: 22,
          nutrition: 20
        },
        alerts: [
          '⚠️ Contains Gluten (Allergy alert)',
          '🔴 Not recommended for children (High sugar & E150d caramel)',
          '🔴 Critical glycemic impact (34g fast sugars / 100g)'
        ],
        children_alerts: ['High concentration of refined sugars promoting hyperactivity and dental caries.', 'Contains E150d ammonia caramel.'],
        pregnant_alerts: ['High 3-MCPD ester content and elevated saturated fats.'],
        diabetic_alerts: ['Very high glycemic index (82), contraindicated for insulin resistance or diabetes.'],
        positive_points: ['Low sodium content'],
        negative_points: ['34% refined fast sugars', 'Contains industrial palm oil', 'Controversial E150d colorant', 'NOVA 4 ultra-processed food'],
        alternatives: [
          {
            name: 'Organic Raw Cacao Oat Muesli',
            brand: 'Pure Harvest Organics',
            score: 92,
            why_better: 'Zero added sugar, palm oil free, NOVA 1, rich in soluble dietary fiber.'
          },
          {
            name: 'Artisanal Seed & Nut Granola',
            brand: 'Earth Table',
            score: 88,
            why_better: 'Low glycemic index, naturally sweetened with pure maple syrup, zero chemical additives.'
          },
          {
            name: 'Whole Rolled Oats with 85% Dark Chocolate',
            brand: 'Pure Origin',
            score: 85,
            why_better: 'Rich in prebiotic beta-glucans to support microbiome and steady glycemic response.'
          }
        ],
        scientific_sources: ['EFSA Scientific Opinion on Caramel colours (2011)', 'WHO Guidelines on Sugars intake for adults and children', 'ANSES Ultra-Processed Foods Report'],
        children_safe: false,
        pregnant_safe: false,
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 'scan_demo_2',
        user_id: demoUser.id,
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
        product_name: 'Organic Creamy Plain Yogurt',
        brand: 'Green Pastures Organic',
        barcode: '3250391204859',
        ingredients: ['Organic pasteurized whole milk', 'Live active yogurt cultures (Lactobacillus bulgaricus, Streptococcus thermophilus)'],
        ingredients_raw: 'Organic whole milk, live active cultures.',
        additives: [],
        endocrine_disruptors: [],
        nova_score: 1,
        nova_explanation: 'Unprocessed natural food produced through traditional lactic fermentation.',
        glycemic_index: 28,
        glycemic_load: 1.2,
        glycemic_explanation: 'Very low glycemic index with protective protein-fat matrix preventing insulin spikes.',
        nutrition_per_100g: {
          calories: 68,
          fat: 3.8,
          saturated_fat: 2.4,
          carbohydrates: 4.2,
          sugars: 4.2,
          fiber: 0.0,
          protein: 4.5,
          salt: 0.10
        },
        allergens_detected: ['Lactose'],
        palm_oil: false,
        scores: {
          global: 94,
          additives: 100,
          endocrine_disruptors: 98,
          nova: 95,
          glycemic_impact: 92,
          environmental: 88,
          nutrition: 90
        },
        alerts: [
          '⚠️ Contains Dairy Lactose (Intolerance alert)'
        ],
        children_alerts: ['Excellent source of bioavailable calcium and proteins for bone development.'],
        pregnant_alerts: ['Made from pasteurized organic milk, 100% safe during pregnancy.'],
        diabetic_alerts: ['Excellent glycemic regulation, only naturally occurring dairy sugars.'],
        positive_points: ['Zero chemical additives or preservatives', 'Live probiotic active ferments', 'Certified organic farming', 'NOVA 1 whole food'],
        negative_points: ['Contains natural lactose (dairy intolerance)'],
        alternatives: [
          {
            name: 'Organic Fermented Coconut Yogurt',
            brand: 'CocoNatur',
            score: 95,
            why_better: '100% lactose-free, certified organic with zero added sugars.'
          },
          {
            name: 'Lactose-Free Artisanal Kefir',
            brand: 'FermentLab',
            score: 96,
            why_better: '14 active probiotic strains with enzymatically removed lactose.'
          }
        ],
        scientific_sources: ['WHO - Probiotics in Food (Paper 85)', 'EFSA Dairy products health claims review'],
        children_safe: true,
        pregnant_safe: true,
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'scan_demo_3',
        user_id: demoUser.id,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        product_name: 'Fizz Punch Energy Drink Can',
        brand: 'TurboEnergy',
        barcode: '5000112630441',
        ingredients: ['Carbonated water', 'Sugar', 'Citric acid (E330)', 'Taurine (0.4%)', 'Preservatives (E202, E211)', 'Caffeine (0.03%)', 'Artificial sweeteners (E950 Acesulfame-K, E955 Sucralose)', 'Colorant (E129 Allura Red AC)', 'B-Vitamins (B3, B6, B12)'],
        ingredients_raw: 'Carbonated water, sugar, citric acid, taurine, E202, E211, caffeine, E950, E955, E129.',
        additives: [
          {
            code: 'E129',
            name: 'Allura Red AC',
            risk_level: 'high',
            description: 'Synthetic azo colorant linked to hyperactivity and attention deficits in children and allergic reactions.',
            sources: ['EFSA Southampton Study Assessment', 'EU Regulation No 1333/2008']
          },
          {
            code: 'E211',
            name: 'Sodium Benzoate',
            risk_level: 'high',
            description: 'Preservative capable of forming carcinogenic benzene when combined with ascorbic acid in acidic beverages.',
            sources: ['FDA Chemical Safety Alert on Benzene Formation', 'IARC Monographs']
          },
          {
            code: 'E950',
            name: 'Acesulfame Potassium',
            risk_level: 'medium',
            description: 'Intense artificial sweetener associated with gut microbiome alterations and impaired glycemic regulation.',
            sources: ['WHO Guideline on Non-Sugar Sweeteners 2023']
          },
          {
            code: 'E955',
            name: 'Sucralose',
            risk_level: 'medium',
            description: 'Chlorinated sucrose derivative that alters gut microbiota diversity and increases intestinal permeability.',
            sources: ['INSERM NutriNet-Santé Study 2022']
          }
        ],
        endocrine_disruptors: [
          {
            name: 'Cocktail Effect of Combined Synthetic Sweeteners',
            ingredient: 'Acesulfame-K & Sucralose',
            risk_level: 'high',
            description: 'Disruption of incretin hormone pathways and alteration of metabolic endocrine receptors.'
          }
        ],
        nova_score: 4,
        nova_explanation: 'Ultra-processed chemical formulation containing 6 synthetic additives and concentrated stimulant agents.',
        glycemic_index: 78,
        glycemic_load: 18,
        glycemic_explanation: 'Severe glycemic shock amplified by adrenergic stimulation from high synthetic caffeine doses.',
        nutrition_per_100g: {
          calories: 48,
          fat: 0,
          saturated_fat: 0,
          carbohydrates: 11.5,
          sugars: 11.0,
          fiber: 0,
          protein: 0,
          salt: 0.18
        },
        allergens_detected: [],
        palm_oil: false,
        scores: {
          global: 14,
          additives: 10,
          endocrine_disruptors: 15,
          nova: 10,
          glycemic_impact: 20,
          environmental: 30,
          nutrition: 10
        },
        alerts: [
          '🔴 High Hazard: Allura Red (E129) triggers behavioral attention deficits in children',
          '🔴 Sodium Benzoate (E211): Benzene formation risk in acidic formulations',
          '⚠️ Unsafe during pregnancy (Excess caffeine + intense artificial sweeteners)'
        ],
        children_alerts: ['STRICTLY DISCOURAGED for minors under 16 by health authorities.', 'Demonstrated negative impact on attention and hyperactivity.'],
        pregnant_alerts: ['Exceeds recommended safe caffeine thresholds; potential fetal impact from non-nutritive sweeteners.'],
        diabetic_alerts: ['Disrupts normal insulin sensitivity and causes metabolic dysregulation.'],
        positive_points: [],
        negative_points: ['4 high/medium risk chemical additives', 'Excessive synthetic caffeine', 'Azo dye banned in multiple jurisdictions', 'Zero nutritional value'],
        alternatives: [
          {
            name: 'Organic Sparkling Ginger Mate Infusion',
            brand: 'Botanica Boost',
            score: 91,
            why_better: 'Naturally sustained caffeine release, zero refined sugar, zero chemical additives.'
          },
          {
            name: 'Real Fruit Extract Sparkling Water',
            brand: 'PureBubbles',
            score: 95,
            why_better: 'Zero additives, zero artificial sweeteners, 100% natural cold-pressed fruit essence.'
          }
        ],
        scientific_sources: ['ANSES Scientific Opinion on Energy Drinks 2013', 'WHO Guideline on Non-Sugar Sweeteners 2023', 'EFSA Panel on Additives Safety Evaluations'],
        children_safe: false,
        pregnant_safe: false,
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'scan_demo_4',
        user_id: demoUser.id,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        product_name: 'Organic Whole Grain Sourdough Bread',
        brand: 'Rustic Hearth Bakery',
        barcode: '3760081293310',
        ingredients: ['Organic stoneground rye flour', 'Water', 'Organic active natural sourdough culture', 'Brown flaxseeds 4%', 'Sunflower seeds 3%', 'Sea salt'],
        ingredients_raw: 'Organic rye flour, water, active sourdough starter, flaxseeds, sunflower seeds, sea salt.',
        additives: [],
        endocrine_disruptors: [],
        nova_score: 2,
        nova_explanation: 'Traditional artisanal bread naturally fermented with live sourdough culture, classified as NOVA 2.',
        glycemic_index: 45,
        glycemic_load: 8.5,
        glycemic_explanation: 'Slow sourdough fermentation lowers the glycemic index and degrades phytic acid for superior mineral absorption.',
        nutrition_per_100g: {
          calories: 220,
          fat: 4.2,
          saturated_fat: 0.6,
          carbohydrates: 38.0,
          sugars: 1.8,
          fiber: 8.4,
          protein: 8.5,
          salt: 0.95
        },
        allergens_detected: ['Gluten'],
        palm_oil: false,
        scores: {
          global: 86,
          additives: 100,
          endocrine_disruptors: 95,
          nova: 88,
          glycemic_impact: 84,
          environmental: 90,
          nutrition: 85
        },
        alerts: [
          '⚠️ Contains Gluten (Allergy alert)'
        ],
        children_alerts: ['High in bioavailable minerals and magnesium for sustained mental and physical energy.'],
        pregnant_alerts: ['Rich source of natural folate (Vitamin B9) and prebiotic dietary fibers.'],
        diabetic_alerts: ['Moderate glycemic index with prolonged energy release from soluble grain fibers.'],
        positive_points: ['Natural live sourdough fermentation', 'Rich in dietary fiber (8.4g/100g)', 'Zero commercial bread improvers or preservatives', 'High in plant Omega-3 fatty acids'],
        negative_points: ['Moderate sodium content (monitor for hypertension)'],
        alternatives: [
          {
            name: 'Organic Gluten-Free Seeded Buckwheat Loaf',
            brand: 'Pure Grain Gluten-Free',
            score: 93,
            why_better: 'Naturally 100% gluten-free, slow rice sourdough fermentation, highly digestible.'
          }
        ],
        scientific_sources: ['INRAE - Sourdough fermentation and gluten protein digestibility', 'EFSA Dietary Fiber Health Outcomes'],
        children_safe: true,
        pregnant_safe: true,
        timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'scan_demo_5',
        user_id: demoUser.id,
        image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80',
        product_name: 'Crunchy Barbecue Potato Chips',
        brand: 'CrunchMax Snack',
        barcode: '3023290001429',
        ingredients: ['Potatoes 58%', 'Sunflower oil 32%', 'Smoke flavor', 'Salt', 'Flavor enhancer (E621 Monosodium Glutamate)', 'Sugar', 'Onion powder', 'Colorant (E160c Paprika extract)'],
        ingredients_raw: 'Potatoes, sunflower oil, flavorings, E621 MSG, sugar, onion powder, paprika extract E160c.',
        additives: [
          {
            code: 'E621',
            name: 'Monosodium Glutamate (MSG)',
            risk_level: 'medium',
            description: 'Synthetic flavor enhancer that artificially overstimulates hunger signaling and appetite response.',
            sources: ['EFSA Opinion on Glutamate Safety limits 2017']
          },
          {
            code: 'E160c',
            name: 'Paprika Extract',
            risk_level: 'low',
            description: 'Natural vegetable colorant extracted from red chili peppers.',
            sources: ['EFSA Scientific evaluation']
          }
        ],
        endocrine_disruptors: [
          {
            name: 'Thermal Neoformed Acrylamide',
            ingredient: 'Fried potatoes',
            risk_level: 'high',
            description: 'Genotoxic and carcinogenic thermal contaminant generated during high-temperature deep frying above 120°C.'
          }
        ],
        nova_score: 4,
        nova_explanation: 'Ultra-processed snack fried at extreme temperatures with synthetic appetite enhancers.',
        glycemic_index: 70,
        glycemic_load: 16,
        glycemic_explanation: 'Rapid digestion of starchy carbohydrates paired with high oxidized lipid content.',
        nutrition_per_100g: {
          calories: 535,
          fat: 33.0,
          saturated_fat: 3.2,
          carbohydrates: 51.0,
          sugars: 3.4,
          fiber: 4.1,
          protein: 6.2,
          salt: 1.65
        },
        allergens_detected: [],
        palm_oil: false,
        scores: {
          global: 32,
          additives: 38,
          endocrine_disruptors: 25,
          nova: 20,
          glycemic_impact: 35,
          environmental: 40,
          nutrition: 25
        },
        alerts: [
          '🔴 Critical sodium content (1.65g salt / 100g)',
          '⚠️ Contains Monosodium Glutamate (E621) disrupting natural satiety',
          '🔴 Elevated Acrylamide risk from high-temperature deep frying'
        ],
        children_alerts: ['Excessive sodium and oxidized lipid load harmful for pediatric metabolic and renal health.'],
        pregnant_alerts: ['Caution advised regarding high exposure levels to dietary acrylamide.'],
        diabetic_alerts: ['High glycemic load combined with pro-inflammatory oxidized vegetable oils.'],
        positive_points: ['Palm oil free'],
        negative_points: ['Contains E621 flavor enhancer', 'Extremely high salt content', '33% oxidized fats', 'Ultra-processed NOVA 4 formulation'],
        alternatives: [
          {
            name: 'Herbed Roasted Chickpea Crisps',
            brand: 'VeggieCrisp Organic',
            score: 84,
            why_better: '60% less fat, rich in plant protein, oven-baked without deep frying.'
          },
          {
            name: 'Oil-Free Crunchy Apple Crisps',
            brand: 'Golden Orchards',
            score: 96,
            why_better: '100% dehydrated whole fruit, zero salt, zero oil, NOVA 1.'
          }
        ],
        scientific_sources: ['EFSA Opinion on Acrylamide in Food 2015', 'WHO Sodium Intake Guidelines'],
        children_safe: false,
        pregnant_safe: false,
        timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      }
    ];

    for (const scan of sampleScans) {
      this.scans.set(scan.id, scan);
      this.scanHistory.push({
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
      });
    }

    // Seed some other diverse user accounts for realistic admin metrics
    const extraUsers: Array<Partial<User> & { email: string; name: string; region: any; status: any; plan: any }> = [
      { email: 'emma.watson@uk-food.co.uk', name: 'Emma Watson', region: 'UK', status: 'active', plan: 'annual' },
      { email: 'michael.scott@dunder.com', name: 'Michael Scott', region: 'US', status: 'active', plan: 'monthly' },
      { email: 'claire.dubois@paris.fr', name: 'Claire Dubois', region: 'EU', status: 'active', plan: 'monthly' },
      { email: 'alex.tanaka@sydney.au', name: 'Alex Tanaka', region: 'AU', status: 'active', plan: 'annual' },
      { email: 'marc.tremblay@montreal.ca', name: 'Marc Tremblay', region: 'CA', status: 'cancelled', plan: 'monthly' },
      { email: 'lucas.muller@berlin.de', name: 'Lucas Müller', region: 'EU', status: 'refunded', plan: 'monthly' },
      { email: 'sarah.connor@cyber.org', name: 'Sarah Connor', region: 'US', status: 'active', plan: 'annual' },
      { email: 'julie.rossi@milan.it', name: 'Julie Rossi', region: 'EU', status: 'active', plan: 'monthly' },
      { email: 'kevin.smith@london.uk', name: 'Kevin Smith', region: 'UK', status: 'active', plan: 'monthly' },
      { email: 'elena.rodriguez@madrid.es', name: 'Elena Rodriguez', region: 'EU', status: 'active', plan: 'annual' },
    ];

    extraUsers.forEach((u, i) => {
      const id = `usr_ext_${i + 10}`;
      const newUser: User & { password_hash: string } = {
        id,
        email: u.email.toLowerCase(),
        name: u.name,
        role: 'user',
        tier: u.status === 'active' ? 'pro' : 'free',
        subscription_status: u.status,
        subscription_plan: u.plan,
        subscription_start: new Date(Date.now() - (i * 2 + 1) * 24 * 3600 * 1000).toISOString(),
        first_payment_date: new Date(Date.now() - (i * 2 + 1) * 24 * 3600 * 1000).toISOString(),
        region: u.region,
        diet_profile: {
          allergies: i % 2 === 0 ? ['Gluten'] : [],
          regime: i % 3 === 0 ? ['Végétarien'] : [],
          intolerances: [],
          objectives: ['Manger moins transformé'],
          has_children: i % 2 === 0,
          children_ages: i % 2 === 0 ? [5] : [],
          is_pregnant: false,
          is_breastfeeding: false,
          is_diabetic: i === 1,
        },
        created_at: new Date(Date.now() - (i * 3 + 2) * 24 * 3600 * 1000).toISOString(),
        scans_count: (i + 1) * 3,
        password_hash: bcrypt.hashSync('Password123!', 10),
      };
      this.users.set(newUser.email, newUser);

      if (u.status === 'active' || u.status === 'cancelled' || u.status === 'refunded') {
        this.transactions.push({
          id: `txn_${id}`,
          user_id: id,
          user_email: newUser.email,
          amount: u.plan === 'annual' ? 29.99 : 4.99,
          currency: 'USD',
          plan: u.plan,
          status: u.status === 'refunded' ? 'refunded' : 'completed',
          date: newUser.subscription_start || new Date().toISOString(),
        });
      }
    });
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
