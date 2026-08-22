import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Flame,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FoodScanResult } from '../../types';
import { ScanResultCard } from '../../components/ScanResultCard';
import { BlurredModulePreview } from '../../components/BlurredModulePreview';
import { GuaranteeBanner } from '../../components/GuaranteeBanner';

interface ScanPageProps {
  onNavigate: (page: string) => void;
}

// Preset samples for rapid testing
const SAMPLE_PRESETS = [
  {
    name: 'Chocolate Filled Cereals (NOVA 4)',
    brand: 'ChocoKids',
    imageText: 'Ingredients: Wheat flour 45%, sugar, glucose-fructose syrup, palm oil, fat-reduced cocoa powder 4%, emulsifier: sunflower lecithin (E322), mono- and diglycerides of fatty acids (E471), color: ammonia caramel (E150d), vanilla flavoring, salt. May contain milk, tree nuts, and soy. Nutritional values per 100g: Energy 420 kcal, Fat 12g of which saturates 5.5g, Carbohydrates 72g of which sugars 34g, Fiber 3g, Protein 6g, Salt 0.8g.',
  },
  {
    name: 'Cured Ham with Sodium Nitrite',
    brand: 'Tradition Deli',
    imageText: 'Ingredients: Pork ham 95%, salt, dextrose, natural flavors, antioxidant: sodium erythorbate (E316), preservative: sodium nitrite (E250). Gluten-free. Nutritional values per 100g: Energy 115 kcal, Fat 3.5g of which saturates 1.2g, Carbohydrates 0.5g of which sugars 0.5g, Protein 20g, Salt 1.9g.',
  },
  {
    name: 'Industrial Red Pesto Sauce',
    brand: 'Pasta Gusto',
    imageText: 'Ingredients: Sunflower oil 40%, tomato pulp 28%, tomato concentrate 15%, Grana Padano PDO cheese (contains egg lysozyme E1105), cashew nuts, basil 3%, salt, acidity regulator: citric acid (E330), artificial flavors, preservative: potassium sorbate (E202). Nutritional values per 100g: Energy 380 kcal, Fat 36g of which saturates 4.8g, Carbohydrates 8.2g of which sugars 6.5g, Protein 4.5g, Salt 2.4g.',
  },
  {
    name: 'Organic Whole Oat & Seed Muesli (Clean - NOVA 1)',
    brand: 'Pure Nature',
    imageText: 'Ingredients: Organic whole rolled oats 65%, organic spelt flakes 15%, organic pumpkin seeds 10%, organic sunflower seeds 10%. No added sugars, no palm oil, zero additives. Nutritional values per 100g: Energy 375 kcal, Fat 9g of which saturates 1.4g, Carbohydrates 58g of which sugars 1.2g, Fiber 11g, Protein 14g, Salt 0.02g.',
  }
];

export const ScanPage: React.FC<ScanPageProps> = ({ onNavigate }) => {
  const { user, isPro, token } = useAuth();
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setError('Unable to access camera. You can upload a photo or choose a sample label below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setSelectedImage(dataUrl);
      executeScan(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      executeScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    // Generate simulated image card text
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`${preset.brand} - ${preset.name}`, 20, 40);
      ctx.font = '14px Arial';

      // Multi-line wrap text
      const words = preset.imageText.split(' ');
      let line = '';
      let y = 80;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 540 && n > 0) {
          ctx.fillText(line, 20, y);
          line = words[n] + ' ';
          y += 24;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 20, y);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      executeScan(dataUrl);
    }
  };

  const executeScan = async (imageBase64: string) => {
    if (!isPro) {
      return;
    }

    setScanning(true);
    setError(null);
    setScanResult(null);

    // Multi-step progressive status animation
    setScanStep('🔍 Optical OCR text recognition of food label...');
    setTimeout(() => {
      setScanStep('🧪 Gemini 3.7 Flash AI chemical & toxicological analysis...');
    }, 1200);
    setTimeout(() => {
      setScanStep('🧬 Endocrine disruptor radar & NOVA classification...');
    }, 2400);
    setTimeout(() => {
      setScanStep('🛡️ Cross-referencing your personalized health profile...');
    }, 3600);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Scan analysis failed.');
      }

      setScanResult(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while analyzing food label.');
    } finally {
      setScanning(false);
      setScanStep('');
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setSelectedImage(null);
    setError(null);
  };

  // If not Pro, show teaser with locked overlay
  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              AI Food Label Scanner
            </h1>
            <p className="text-xs text-emerald-200/80">
              Detect controversial additives, hormonal disruptors, and ultra-processed ingredients.
            </p>
          </div>

          <GuaranteeBanner compact />

          <BlurredModulePreview
            title="AI Scanner Module Locked"
            description="Activate your Pro subscription ($4.99/mo) to scan unlimited products and unlock all 6 scientific health modules."
            onUnlock={() => onNavigate('pricing')}
          >
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Camera className="w-10 h-10" />
              </div>
              <p className="text-lg font-bold text-white">Ready to scan</p>
              <div className="h-40 bg-[#162716] rounded-2xl border border-dashed border-[#294229] flex items-center justify-center text-xs text-emerald-300/40">
                Live camera scanner preview
              </div>
            </div>
          </BlurredModulePreview>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d160d] text-emerald-100 py-6 px-4 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Scan Food Label
          </h1>
          <p className="text-xs text-emerald-200/70">
            Point your camera at the ingredients list or upload a photo from your device.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan In Progress Animation View */}
        {scanning && (
          <div className="bg-[#142314] border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-emerald-950">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
              <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-white">
                AI Analysis in progress...
              </h3>
              <p className="text-xs text-emerald-400 font-medium animate-pulse min-h-[20px]">
                {scanStep}
              </p>
            </div>

            <div className="w-48 mx-auto h-1.5 bg-[#0f1b0f] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-indeterminate" style={{ width: '70%' }} />
            </div>
          </div>
        )}

        {/* Show Scan Result */}
        {!scanning && scanResult && (
          <div className="space-y-4">
            <ScanResultCard
              scan={scanResult}
              onScanAnother={handleResetScan}
            />
          </div>
        )}

        {/* Camera and Upload Controls (when not scanning and no result) */}
        {!scanning && !scanResult && (
          <div className="space-y-6">
            {/* Live Camera View Area */}
            {cameraActive ? (
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/60 bg-black aspect-[3/4] sm:aspect-[4/3] max-w-lg mx-auto shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser scan animation overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
                  <div className="w-64 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
                    <span className="text-xs text-emerald-300 font-extrabold bg-black/80 border border-emerald-500/40 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                      Frame the Ingredients or Nutrition Label
                    </span>
                  </div>
                </div>

                {/* Bottom Camera controls */}
                <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between">
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/20 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center text-gray-950 active:scale-90 transition-transform cursor-pointer"
                    title="Take photo"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500" />
                  </button>

                  <div className="w-16" />
                </div>
              </div>
            ) : (
              /* Idle Scanner Card */
              <div className="bg-[#142314] border border-[#274027] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl shadow-emerald-950">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                  <Camera className="w-10 h-10" />
                </div>

                <div className="space-y-3 max-w-xl mx-auto">
                  <h3 className="text-2xl font-extrabold font-display text-white">
                    Ready to Scan Food Label
                  </h3>
                  
                  <p className="text-sm sm:text-base font-semibold text-emerald-100/90 leading-relaxed">
                    Take a clear photo of the ingredients list or upload an image from your photo gallery.
                  </p>

                  {/* High-visibility requirement notice */}
                  <div className="p-4 bg-gradient-to-r from-[#192f19] to-[#122212] border-2 border-emerald-500/60 rounded-2xl text-left space-y-1.5 shadow-lg shadow-black/40">
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Strict Requirement for Accurate Analysis</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-normal">
                      <strong className="text-amber-300 font-bold underline decoration-amber-400 decoration-2 underline-offset-2">The product's INGREDIENTS LIST or NUTRITION TABLE label is required</strong>. Without the ingredients list or composition table, the AI scanner cannot detect the additives, NOVA processing score, or chemical compounds.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={startCamera}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1a2e1a] hover:bg-[#223d22] border border-[#2c4e2c] text-emerald-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}

            {/* Quick Testing Preset Labels */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Or test instantly with a sample food label:
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetSelect(preset)}
                    className="text-left p-4 rounded-2xl bg-[#142314] hover:bg-[#1b2f1b] border border-[#243d24] hover:border-emerald-500/40 transition-all flex items-start justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">
                        {preset.brand}
                      </span>
                      <h5 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {preset.name}
                      </h5>
                      <p className="text-[11px] text-emerald-300/60 line-clamp-2 mt-1">
                        {preset.imageText}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 shrink-0 ml-2 mt-1 transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
