import { GoogleGenAI } from '@google/genai';
import { FoodScanResult, DietProfile, AdditiveInfo, EndocrineDisruptorInfo } from '../src/types';

// Gemini Client initialization with required headers
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Built-in scientific knowledge base for additives & endocrine disruptors (English)
export const ADDITIVES_DATABASE: Record<string, { name: string; risk: 'low' | 'medium' | 'high'; desc: string; source: string[] }> = {
  E102: { name: 'Tartrazine (Yellow 5)', risk: 'high', desc: 'Azo dye linked to hyperactivity in children and bronchospasms in sensitive individuals.', source: ['EFSA Southampton Study', 'EU Regulation 1333/2008'] },
  E110: { name: 'Sunset Yellow FCF (Yellow 6)', risk: 'high', desc: 'Synthetic azo dye associated with attention deficits and allergic reactions.', source: ['EFSA Journal 2009; 7(11):1331'] },
  E120: { name: 'Carmine / Cochineal', risk: 'medium', desc: 'Red colorant derived from crushed insects. Risk of severe allergic reactions and asthma.', source: ['EFSA 2015'] },
  E129: { name: 'Allura Red AC (Red 40)', risk: 'high', desc: 'Azo colorant suspected of exacerbating childhood hyperactivity and allergic reactions.', source: ['IARC Monographs', 'EFSA Panel'] },
  E133: { name: 'Brilliant Blue FCF', risk: 'medium', desc: 'Synthetic colorant with slow renal elimination and potential hypersensitivity risk.', source: ['EFSA 2010'] },
  E150c: { name: 'Ammonia Caramel', risk: 'medium', desc: 'Contains 2-methylimidazole, a suspected genotoxic contaminant.', source: ['IARC Vol 101'] },
  E150d: { name: 'Sulphite Ammonia Caramel', risk: 'high', desc: 'Contains 4-MEI, classified as possibly carcinogenic to humans (Group 2B) by IARC.', source: ['IARC Monograph 101', 'EFSA 2011'] },
  E171: { name: 'Titanium Dioxide', risk: 'high', desc: 'Nanoparticles banned in the EU since 2022 due to genotoxicity and DNA damage concerns.', source: ['EFSA 2021 Safety Assessment'] },
  E202: { name: 'Potassium Sorbate', risk: 'low', desc: 'Antifungal preservative generally well tolerated at regulated dietary intake.', source: ['EFSA 2019'] },
  E211: { name: 'Sodium Benzoate', risk: 'high', desc: 'Preservative capable of forming carcinogenic benzene when combined with ascorbic acid (Vitamin C).', source: ['FDA & WHO Safety Evaluations'] },
  E220: { name: 'Sulphur Dioxide / Sulphites', risk: 'high', desc: 'Major allergen causing headaches, nausea, and bronchospasms in asthmatic individuals.', source: ['EU Regulation No 1169/2011'] },
  E250: { name: 'Sodium Nitrite', risk: 'high', desc: 'Curing agent that forms carcinogenic nitrosamines in the human gastrointestinal tract.', source: ['IARC 2015 Monograph 114', 'ANSES 2022'] },
  E252: { name: 'Potassium Nitrate', risk: 'high', desc: 'Precursor of nitrites and nitrosamines used in cured and processed meats.', source: ['ANSES 2022'] },
  E322: { name: 'Lecithins (Soy/Sunflower)', risk: 'low', desc: 'Natural emulsifier without known toxicity for the general population.', source: ['EFSA Panel on Food Additives'] },
  E330: { name: 'Citric Acid', risk: 'low', desc: 'Natural acidifier and antioxidant produced by microbial fermentation.', source: ['EFSA 2015'] },
  E407: { name: 'Carrageenan', risk: 'high', desc: 'Thickening agent associated with intestinal barrier disruption and chronic low-grade inflammation.', source: ['IARC & Nature Food 2021'] },
  E471: { name: 'Mono- and Diglycerides of Fatty Acids', risk: 'medium', desc: 'Industrial emulsifier linked to altered gut microbiota and increased mucosal permeability.', source: ['BMJ 2024 / INSERM'] },
  E621: { name: 'Monosodium Glutamate (MSG)', risk: 'medium', desc: 'Flavor enhancer that overstimulates appetite and alters natural satiety signalling.', source: ['EFSA 2017'] },
  E950: { name: 'Acesulfame K', risk: 'medium', desc: 'Intense synthetic sweetener linked to gut dysbiosis and metabolic disruptions.', source: ['WHO Guideline 2023'] },
  E951: { name: 'Aspartame', risk: 'high', desc: 'Artificial sweetener classified as possibly carcinogenic (Group 2B) by IARC/WHO in 2023.', source: ['IARC/JECFA 2023 Statement'] },
  E955: { name: 'Sucralose', risk: 'medium', desc: 'Chlorinated synthetic sweetener altering gut microbiome balance and insulin sensitivity.', source: ['INSERM NutriNet 2022'] },
};

// Helper to safely extract and repair JSON from AI responses
function cleanAndParseJson(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = cleaned.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      const sanitized = candidate
        .replace(/,\s*([\}\]])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
      try {
        return JSON.parse(sanitized);
      } catch (_) {}
    }
  }

  // Handle possible truncation by closing open brackets/braces
  if (startIdx !== -1) {
    let partial = cleaned.substring(startIdx);
    partial = partial.replace(/,\s*"[^"]*":?\s*"?$/, '').replace(/,\s*$/, '');
    
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < partial.length; i++) {
      const char = partial[i];
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }
    }

    if (inString) partial += '"';
    while (openBrackets > 0) {
      partial += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      partial += '}';
      openBraces--;
    }

    try {
      return JSON.parse(partial.replace(/,\s*([\}\]])/g, '$1'));
    } catch (_) {}
  }

  return null;
}

export async function analyzeFoodLabel(imageBase64: string, mimeType: string = 'image/jpeg', userProfile?: DietProfile): Promise<FoodScanResult> {
  const prompt = `CRITICAL DIRECTIVE: You are an expert scientific food label inspector, nutritionist, and chemical toxicologist.
Analyze the food product shown in this image.

🌟 ABSOLUTE GOLDEN RULE: 
ALL OUTPUT VALUES IN THE GENERATED JSON MUST BE 100% EXCLUSIVELY IN ENGLISH.
- product_name: MUST be in English (e.g. "Crisp Soda Cola Can", "Lemon Sparkling Water", "Organic Rolled Oat Flakes", "Creamy Greek Yogurt"). If the package or text on the label is in French, Spanish, German or any other language, TRANSLATE THE FOOD TITLE TO CLEAR, NATURAL ENGLISH. Never leave French or non-English titles!
- brand: in English / Universal alphabet characters (e.g. "Coca-Cola", "Nestlé", "Danone", "Generic Brand").
- ingredients & ingredients_raw: Translated into English (e.g., "Carbonated water, sugar, citric acid, natural flavorings").
- additives (name, description): 100% in English.
- endocrine_disruptors (name, description): 100% in English.
- nova_explanation & glycemic_explanation: 100% in English.
- children_alerts, pregnant_alerts, diabetic_alerts, positive_points, negative_points: 100% in English.
- alternatives (name, brand, why_better): 100% in English.

IMAGE UNDERSTANDING RULES:
1. ACCEPTABLE IMAGES:
   - Any food, beverage, or snack packaging, can, bottle, pouch, box, or wrapper.
   - Any nutritional declaration table ("DECLARATION NUTRITIONNELLE", "Nutrition Facts", "Valeur nutritive", "Informations nutritionnelles").
   - Any ingredients list ("Ingrédients", "Ingredients", "Composition").
   - Front or side of food packages (e.g., soda can, cereal box, yogurt pot, snack bar).

2. EXTRACTION & CALCULATION LOGIC:
   - Extract the visible text carefully: product name (in English), brand, nutrition table values, ingredients (in English), and additives.
   - If only the Nutrition Table is visible (e.g. 100ml / 330ml / 355ml soda can showing calories, sugars/carbs, salt/sodium):
     * Accurately extract or normalize values per 100g or 100ml.
     * Accurately identify the product type in English (e.g. "Refreshing Cola Soda Can", "Fresh Orange Juice", "Citrus Energy Drink Can", etc.).
     * Provide the ingredients list typical of this clearly identified formulation in English (e.g. "Carbonated water, sugar, caramel color E150d, phosphoric acid E338, natural flavorings, caffeine").
     * Calculate all 6 scientific health scores (Additives, Endocrine Disruptors, NOVA classification [NOVA 4 for industrial sodas], Glycemic Impact [High glycemic spike for sugary sodas >10g sugars/100ml], Environmental score, and Nutrition score).
   - Only if the image is COMPLETELY UNRELATED to food or beverage (e.g., a car, shoe, animal, landscape, or a completely pitch-black non-image), output:
     {"error": "not_a_food_label", "message": "This image does not appear to be a food product or label. Please scan the packaging or nutrition table of a food or beverage."}

3. OUTPUT FORMAT:
   Return ONLY a valid, parseable JSON object matching this exact schema (ALL STRINGS IN ENGLISH):
{
  "product_name": "string (In ENGLISH, e.g., 'Refreshing Sparkling Cola Can' or 'Whole Grain Oat Cereal')",
  "brand": "string (Brand if visible, or 'Standard Brand')",
  "barcode": "string | null",
  "ingredients": ["string (English)"],
  "ingredients_raw": "string (Ingredients list in English)",
  "additives": [
    {
      "code": "string (e.g., E150d, E338, E330, E950, E951, E250)",
      "name": "string (Full name in English)",
      "risk_level": "low" | "medium" | "high",
      "description": "string (Scientific impact and toxicological assessment in English)",
      "sources": ["string"]
    }
  ],
  "endocrine_disruptors": [
    {
      "name": "string (In English)",
      "ingredient": "string (In English)",
      "risk_level": "low" | "medium" | "high",
      "description": "string (In English)"
    }
  ],
  "nova_score": 1 | 2 | 3 | 4,
  "nova_explanation": "string (Clear scientific explanation in English)",
  "glycemic_index": number (0-100),
  "glycemic_load": number (0-50),
  "glycemic_explanation": "string (Explanation in English)",
  "nutrition_per_100g": {
    "calories": number,
    "fat": number,
    "saturated_fat": number,
    "carbohydrates": number,
    "sugars": number,
    "fiber": number,
    "protein": number,
    "salt": number
  },
  "allergens_detected": ["string (English)"],
  "palm_oil": boolean,
  "scores": {
    "global": number (0-100),
    "additives": number (0-100),
    "endocrine_disruptors": number (0-100),
    "nova": number (0-100),
    "glycemic_impact": number (0-100),
    "environmental": number (0-100),
    "nutrition": number (0-100)
  },
  "children_alerts": ["string (English)"],
  "pregnant_alerts": ["string (English)"],
  "diabetic_alerts": ["string (English)"],
  "positive_points": ["string (English)"],
  "negative_points": ["string (English)"],
  "alternatives": [
    {
      "name": "string (In English)",
      "brand": "string (In English)",
      "score": number,
      "why_better": "string (In English)"
    }
  ],
  "scientific_sources": ["string"]
}`;

  let rawJson: any = null;
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9.+_-]+;base64,/, '');

  // 1. PRIMARY PRIORITY: Anthropic Claude Vision
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Using Claude Vision as Priority #1 for food label scan...');
      const modelsToTry = [
        'claude-sonnet-5',
        'claude-sonnet-4-6',
        'claude-sonnet-4-5-20250929',
        'claude-haiku-4-5-20251001',
        'claude-opus-5'
      ];
      
      for (const modelName of modelsToTry) {
        try {
          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              max_tokens: 8192,
              system: 'You are an automated scientific food scanner API backend. You must ONLY output a valid JSON object matching the requested schema. ALL TEXT in the JSON output (product title, brand, ingredients, additives, NOVA explanation, glycemic explanation, alerts, alternatives) MUST BE 100% EXCLUSIVELY IN ENGLISH. If food labels or packages are in French or other languages, translate them into natural English.',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: mimeType || 'image/jpeg',
                        data: cleanBase64,
                      },
                    },
                    {
                      type: 'text',
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          });

          if (anthropicRes.ok) {
            const data: any = await anthropicRes.json();
            const contentBlock = data.content?.find((c: any) => c.type === 'text');
            if (contentBlock && contentBlock.text) {
              const parsed = cleanAndParseJson(contentBlock.text);
              if (parsed && typeof parsed === 'object') {
                rawJson = parsed;
                console.log(`Successfully analyzed label with Claude Vision (${modelName})`);
                break;
              } else {
                console.warn(`Claude Vision (${modelName}) returned unparseable text format`);
              }
            }
          } else {
            const errText = await anthropicRes.text();
            console.warn(`Claude Vision (${modelName}) returned ${anthropicRes.status}:`, errText);
          }
        } catch (modelErr: any) {
          console.warn(`Error with Claude model ${modelName}:`, modelErr?.message || modelErr);
        }
      }
    } catch (anthropicError) {
      console.warn('Anthropic Claude Vision primary call failed, evaluating secondary fallback:', anthropicError);
    }
  }

  // 2. SECONDARY FALLBACK: Google Gemini 3.7 / 3.6 Flash Vision
  if (!rawJson) {
    const gemini = getGeminiClient();
    if (gemini) {
      const geminiModels = ['gemini-3.7-flash', 'gemini-3.6-flash'];
      for (const gm of geminiModels) {
        try {
          console.log(`Using Gemini Vision (${gm}) as fallback engine...`);
          const response = await gemini.models.generateContent({
            model: gm,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const responseText = response.text?.trim();
          if (responseText) {
            const parsed = cleanAndParseJson(responseText);
            if (parsed && typeof parsed === 'object') {
              rawJson = parsed;
              console.log(`Successfully analyzed label with Gemini Vision (${gm})`);
              break;
            }
          }
        } catch (geminiError: any) {
          console.warn(`Gemini vision (${gm}) call error:`, geminiError?.message || geminiError);
        }
      }
    }
  }

  // Handle explicit AI errors
  if (!rawJson) {
    throw new Error('Unable to analyze this image. Please provide a clear, well-lit photo of the food ingredients or nutrition label.');
  }

  if (rawJson.error === 'not_a_food_label') {
    throw new Error(rawJson.message || 'This image does not appear to be a food product or label. Please capture the packaging or nutrition facts.');
  }

  if (rawJson.error === 'unreadable_label' || (rawJson.error && !rawJson.product_name)) {
    throw new Error(rawJson.message || 'The food label is unreadable. Please take a clear, well-lit photo of the ingredients list or nutrition table.');
  }

  // Fallback product name if missing
  if (!rawJson.product_name) {
    rawJson.product_name = 'Analyzed Food Product';
  }

  // 3. Personalize analysis with user diet profile & calculate scores
  return personalizeAndEnrichScan(rawJson, userProfile);
}

export function personalizeAndEnrichScan(data: any, profile?: DietProfile): FoodScanResult {
  const alerts: string[] = [];
  const detectedAllergens: string[] = Array.isArray(data.allergens_detected) ? data.allergens_detected : [];
  const ingredientsStr = (data.ingredients_raw || (Array.isArray(data.ingredients) ? data.ingredients.join(', ') : '')).toLowerCase();

  // 1. Allergens matching with user's specific allergens
  if (profile?.allergies && profile.allergies.length > 0) {
    for (const allergy of profile.allergies) {
      const allergyLower = allergy.toLowerCase();
      const isDetected = detectedAllergens.some(a => a.toLowerCase().includes(allergyLower)) ||
        ingredientsStr.includes(allergyLower);
      if (isDetected) {
        alerts.push(`⚠️ ALLERGEN ALERT: Contains or may contain ${allergy}!`);
      }
    }
  }

  // 2. Regime matching (Vegetarian, Vegan, Halal, Kosher, Gluten-free)
  if (profile?.regime && profile.regime.length > 0) {
    const isVeggie = profile.regime.some(r => /vegetar|vegan/i.test(r));
    if (isVeggie) {
      if (ingredientsStr.includes('carmine') || ingredientsStr.includes('cochineal') || ingredientsStr.includes('e120') || ingredientsStr.includes('gelatin') || ingredientsStr.includes('gélatine')) {
        alerts.push('⚠️ Not compliant with Vegetarian / Vegan diet (Gelatin or Carmine E120 detected)');
      }
    }
    const isGlutenFree = profile.regime.some(r => /gluten/i.test(r));
    if (isGlutenFree && (detectedAllergens.some(a => /gluten|wheat|barley|rye/i.test(a)) || ingredientsStr.includes('wheat') || ingredientsStr.includes('blé') || ingredientsStr.includes('barley') || ingredientsStr.includes('rye'))) {
      alerts.push('⚠️ Contains Gluten (Incompatible with your Gluten-Free diet)');
    }
  }

  // 3. Intolerances
  if (profile?.intolerances && profile.intolerances.length > 0) {
    const isLactose = profile.intolerances.some(i => /lactose/i.test(i));
    if (isLactose && (detectedAllergens.some(a => /lactose|milk/i.test(a)) || ingredientsStr.includes('milk') || ingredientsStr.includes('lactose') || ingredientsStr.includes('whey') || ingredientsStr.includes('lait'))) {
      alerts.push('⚠️ Contains Lactose (Incompatible with your profile intolerance)');
    }
  }

  // 4. Family & Health alerts
  let childrenSafe = true;
  let pregnantSafe = true;

  if (data.nova_score === 4 || (data.scores?.additives && data.scores.additives < 50) || (data.nutrition_per_100g?.sugars && data.nutrition_per_100g.sugars > 25)) {
    childrenSafe = false;
  }
  if (data.endocrine_disruptors && data.endocrine_disruptors.length > 0) {
    pregnantSafe = false;
  }

  if (profile?.is_pregnant) {
    if (!pregnantSafe || (data.pregnant_alerts && data.pregnant_alerts.length > 0)) {
      alerts.push('🤰 Pregnancy Warning: Additives with potential cocktail effects or suspected endocrine disruptors.');
    }
  }

  if (profile?.has_children) {
    if (!childrenSafe) {
      alerts.push('👶 Children Warning: High sugar content or stimulating/azoic food additives.');
    }
  }

  if (profile?.is_diabetic || profile?.objectives?.some((o: string) => /glyc/i.test(o))) {
    if (data.glycemic_index && data.glycemic_index > 65) {
      alerts.push(`🩸 High Glycemic Impact (GI: ${data.glycemic_index}) — Caution advised for blood glucose management.`);
    }
  }

  // Ensure 6 detailed scores exist and are numbers 0-100
  const scores = {
    global: Math.min(100, Math.max(0, Math.round(data.scores?.global ?? 50))),
    additives: Math.min(100, Math.max(0, Math.round(data.scores?.additives ?? 50))),
    endocrine_disruptors: Math.min(100, Math.max(0, Math.round(data.scores?.endocrine_disruptors ?? 50))),
    nova: Math.min(100, Math.max(0, Math.round(data.scores?.nova ?? (data.nova_score === 1 ? 95 : data.nova_score === 2 ? 80 : data.nova_score === 3 ? 50 : 20)))),
    glycemic_impact: Math.min(100, Math.max(0, Math.round(data.scores?.glycemic_impact ?? 50))),
    environmental: Math.min(100, Math.max(0, Math.round(data.scores?.environmental ?? 50))),
    nutrition: Math.min(100, Math.max(0, Math.round(data.scores?.nutrition ?? 50))),
  };

  const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    user_id: '',
    image_url: '',
    product_name: data.product_name || 'Food Product',
    brand: data.brand || 'Identified Food Item',
    barcode: data.barcode || null,
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    ingredients_raw: data.ingredients_raw || '',
    additives: Array.isArray(data.additives) ? data.additives : [],
    endocrine_disruptors: Array.isArray(data.endocrine_disruptors) ? data.endocrine_disruptors : [],
    nova_score: (data.nova_score >= 1 && data.nova_score <= 4) ? data.nova_score : 4,
    nova_explanation: data.nova_explanation || 'Classification according to the NOVA industrial food processing scale.',
    glycemic_index: typeof data.glycemic_index === 'number' ? data.glycemic_index : 55,
    glycemic_load: typeof data.glycemic_load === 'number' ? data.glycemic_load : 10,
    glycemic_explanation: data.glycemic_explanation || 'Estimated impact on insulin response and postprandial energy.',
    nutrition_per_100g: {
      calories: Number(data.nutrition_per_100g?.calories) || 0,
      fat: Number(data.nutrition_per_100g?.fat) || 0,
      saturated_fat: Number(data.nutrition_per_100g?.saturated_fat) || 0,
      carbohydrates: Number(data.nutrition_per_100g?.carbohydrates) || 0,
      sugars: Number(data.nutrition_per_100g?.sugars) || 0,
      fiber: Number(data.nutrition_per_100g?.fiber) || 0,
      protein: Number(data.nutrition_per_100g?.protein) || 0,
      salt: Number(data.nutrition_per_100g?.salt) || 0,
    },
    allergens_detected: detectedAllergens,
    palm_oil: Boolean(data.palm_oil),
    scores,
    alerts: Array.from(new Set([...alerts, ...(data.alerts || [])])),
    children_alerts: Array.isArray(data.children_alerts) ? data.children_alerts : [],
    pregnant_alerts: Array.isArray(data.pregnant_alerts) ? data.pregnant_alerts : [],
    diabetic_alerts: Array.isArray(data.diabetic_alerts) ? data.diabetic_alerts : [],
    positive_points: Array.isArray(data.positive_points) ? data.positive_points : [],
    negative_points: Array.isArray(data.negative_points) ? data.negative_points : [],
    alternatives: Array.isArray(data.alternatives) && data.alternatives.length > 0 ? data.alternatives : [
      { name: 'Organic Wholesome Alternative', brand: 'Pure Health', score: 92, why_better: 'No controversial additives, clean label, minimally processed.' }
    ],
    scientific_sources: Array.isArray(data.scientific_sources) && data.scientific_sources.length > 0 ? data.scientific_sources : ['EFSA', 'WHO / OMS', 'IARC / CIRC', 'NutriNet Health'],
    children_safe: childrenSafe,
    pregnant_safe: pregnantSafe,
    timestamp: new Date().toISOString(),
  };
}
