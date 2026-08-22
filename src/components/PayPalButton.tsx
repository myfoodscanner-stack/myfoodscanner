import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import confetti from 'canvas-confetti';
import { CheckCircle2, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PayPalButtonProps {
  plan: 'monthly' | 'annual';
  onSuccess?: () => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ plan, onSuccess }) => {
  const { token, refreshUser } = useAuth();
  const [paypalConfig, setPaypalConfig] = useState<{ clientId: string; environment: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetch('/api/paypal/config')
      .then(res => res.json())
      .then(data => {
        setPaypalConfig({
          clientId: data.clientId || 'test',
          environment: data.environment || 'sandbox',
        });
      })
      .catch(err => {
        console.error('Failed to load PayPal config:', err);
        setPaypalConfig({
          clientId: 'test',
          environment: 'sandbox',
        });
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
        <h4 className="font-bold text-white text-sm">Payment Confirmed & Verified!</h4>
        <p className="text-xs text-emerald-200/80">Your Pro membership is active.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {processingPayment && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Verifying transaction with PayPal...</span>
        </div>
      )}

      {paypalConfig && (
        <PayPalScriptProvider
          options={{
            clientId: paypalConfig.clientId,
            currency: 'USD',
            intent: 'capture',
            components: 'buttons',
          }}
        >
          <div className="relative z-10 min-h-[50px]">
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'pay',
                tagline: false,
                height: 44,
              }}
              disabled={processingPayment}
              createOrder={async () => {
                if (!token) {
                  setError('Please sign in or register before starting your payment.');
                  throw new Error('Authentication required');
                }
                setError(null);
                try {
                  const res = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ plan }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Failed to initialize PayPal order.');
                  }
                  return data.orderId;
                } catch (err: any) {
                  setError(err.message || 'Unable to connect to PayPal.');
                  throw err;
                }
              }}
              onApprove={async (data) => {
                setProcessingPayment(true);
                setError(null);
                try {
                  const res = await fetch('/api/paypal/capture-order', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      plan,
                      orderId: data.orderID,
                    }),
                  });

                  const resData = await res.json();
                  if (!res.ok) {
                    throw new Error(resData.error || 'PayPal payment verification failed.');
                  }

                  setSuccess(true);
                  confetti({
                    particleCount: 90,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4caf50', '#10b981', '#ffffff', '#ffc439'],
                  });

                  await refreshUser();
                  if (onSuccess) onSuccess();
                } catch (err: any) {
                  console.error('PayPal capture error:', err);
                  setError(err.message || 'Payment could not be verified on PayPal. No upgrade was performed.');
                } finally {
                  setProcessingPayment(false);
                }
              }}
              onCancel={() => {
                setError('Payment was cancelled. You have not been charged.');
              }}
              onError={(err) => {
                console.error('PayPal SDK error:', err);
                setError('PayPal checkout was closed or encountered an issue. No charge was completed.');
              }}
            />
          </div>
        </PayPalScriptProvider>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-300/60 pt-0.5">
        <Lock className="w-3 h-3 text-emerald-400/80" />
        <span>Official PayPal 256-bit Encrypted Checkout</span>
      </div>
    </div>
  );
};
