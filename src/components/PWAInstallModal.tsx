import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#142314] border border-[#2c472c] rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1e341e] text-emerald-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold font-display text-white mb-2">
          Install My Food Scanner
        </h3>
        <p className="text-xs text-emerald-200/80 mb-5 leading-relaxed">
          Access the food label scanner in 1 tap directly from your smartphone home screen, with offline support.
        </p>

        {isIOS ? (
          <div className="space-y-3 bg-[#0f1a0f] p-4 rounded-2xl border border-[#233c23]">
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              iPhone / iPad Installation Guide:
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-[#1a2d1a] flex items-center justify-center text-emerald-400 shrink-0 font-bold">1</div>
              <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> in Safari.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-[#1a2d1a] flex items-center justify-center text-emerald-400 shrink-0 font-bold">2</div>
              <span>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-[#1a2d1a] flex items-center justify-center text-emerald-400 shrink-0 font-bold">3</div>
              <span>Tap <strong>Add</strong> in the top right corner to finish.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {installed ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                App installed successfully!
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-gray-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform transform active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Add to Home Screen
              </button>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-xs font-semibold text-emerald-400/80 hover:text-emerald-300 text-center cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
