import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Star,
  Award,
  Truck,
  CreditCard,
  Lock,
  Check,
} from 'lucide-react';
import type { SunglassesProduct } from '../data/sunglassesCatalog';

interface PaywallViewProps {
  product: SunglassesProduct;
  whyReasons?: string[];
  onBackToTryOn: () => void;
  onRetakeQuiz: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({
  product,
  whyReasons = [],
  onBackToTryOn,
  onRetakeQuiz,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(899); // 14:59 countdown
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);

  // 15-minute reservation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const originalPrice = product.price;
  const discountedPrice = Math.round(originalPrice * 0.5 * 100) / 100;
  const savings = Math.round((originalPrice - discountedPrice) * 100) / 100;

  const handleCompleteOrder = () => {
    setIsProcessingOrder(true);
    setTimeout(() => {
      setIsProcessingOrder(false);
      setIsOrderPlaced(true);
    }, 1800);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-24 space-y-6">
      {/* Back button to Try-On & Safe Checkout indicator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToTryOn}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink cursor-pointer transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Live Try-On</span>
        </button>

        <div className="inline-flex items-center gap-1.5 caption text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Lock className="h-3 w-3" />
          <span>256-Bit Encrypted Checkout</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isOrderPlaced ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-emerald-500/30 bg-tile p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <span className="caption uppercase tracking-wider text-emerald-400 font-semibold">
                Order Confirmed • #QZ-88421
              </span>
              <h1 className="text-2xl font-bold text-ink">Your Custom Pair is Being Prepared!</h1>
              <p className="text-sm text-muted max-w-md mx-auto">
                Thank you for your order. We are precision-calibrating your{' '}
                <strong className="text-ink">{product.title}</strong> with UV400 lenses and preparing it for carbon-neutral delivery.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="caption text-faint">Estimated Delivery</span>
                <span className="text-xs font-semibold text-emerald-400">In 2–3 Business Days</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="caption text-faint">Total Charged</span>
                <span className="text-xs font-semibold text-ink">${discountedPrice.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="caption text-faint">Fit Guarantee</span>
                <span className="text-xs font-semibold text-ink">30-Day Risk-Free Trial</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={onBackToTryOn}
                className="w-full min-h-12 flex items-center justify-center rounded-pill bg-ink text-page font-medium text-sm hover:bg-accent-strong cursor-pointer transition-colors"
              >
                Back to Try-On Mirror
              </button>
              <button
                type="button"
                onClick={onRetakeQuiz}
                className="caption text-faint hover:text-muted cursor-pointer transition-colors"
              >
                Retake Quiz from Beginning
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="paywall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Urgency Reservation Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                <span className="text-xs font-medium">
                  Your 50% Quiz Reward is reserved for:
                </span>
              </div>
              <span className="font-mono text-sm font-bold bg-amber-400/20 px-2 py-0.5 rounded-md">
                {formatTime(secondsRemaining)}
              </span>
            </div>

            {/* Hero Product Card */}
            <div className="rounded-3xl border border-white/10 bg-tile p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-full sm:w-48 h-32 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-center p-3 shadow-inner">
                  <img
                    src={product.local_image_url || product.image_url}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                    Match 99%
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="caption uppercase tracking-wider text-amber-400 font-semibold">
                    Recommended Eyewear Package
                  </span>
                  <h1 className="text-2xl font-bold text-ink">{product.title}</h1>
                  <p className="text-xs text-muted">
                    {product.frame_material} • {product.frame_size} Architecture
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 pt-1 text-amber-400">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="caption text-faint ml-1.5">(4.9/5 from 14,800+ fits)</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-4 space-y-2.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>Regular Retail Value</span>
                  <span className="line-through">${originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400 font-medium">
                  <span>Quiz Fit Reward (50% Off)</span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Carbon-Neutral Priority Shipping</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-ink">Total Investment</span>
                    <p className="caption text-faint">Taxes & customs included</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400">
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className="caption text-muted ml-1">USD</span>
                  </div>
                </div>
              </div>

              {/* Inclusions Checklist */}
              <div className="space-y-2.5 pt-2">
                <p className="caption uppercase tracking-wider text-faint font-semibold">
                  What is included in your custom box:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Calibrated Hand-Polished Frame</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>UV400 TAC Polarized Lenses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Hard Protective Leather Travel Case</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Optical Microfiber Cleaning Cloth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>30-Day Risk-Free At-Home Trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>2-Year Unconditional Fit Warranty</span>
                  </div>
                </div>
              </div>

              {/* AI Why Highlight */}
              {whyReasons.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>AI Fit Rationale</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed italic">
                    "{whyReasons[0]}"
                  </p>
                </div>
              )}
            </div>

            {/* Value Guarantees Banner */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-tile p-3 space-y-1">
                <Award className="h-5 w-5 mx-auto text-amber-400" />
                <p className="text-[11px] font-semibold text-ink">100% Fit Match</p>
                <p className="caption text-faint">Or free exchange</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-tile p-3 space-y-1">
                <Truck className="h-5 w-5 mx-auto text-amber-400" />
                <p className="text-[11px] font-semibold text-ink">Fast Delivery</p>
                <p className="caption text-faint">Ships within 24h</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-tile p-3 space-y-1">
                <ShieldCheck className="h-5 w-5 mx-auto text-amber-400" />
                <p className="text-[11px] font-semibold text-ink">30-Day Trial</p>
                <p className="caption text-faint">Zero-risk returns</p>
              </div>
            </div>

            {/* Primary Checkout Action */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isProcessingOrder}
                className="w-full min-h-16 flex items-center justify-center gap-2 rounded-pill bg-ink text-page hover:bg-accent-strong text-[1.125rem] font-bold transition-all cursor-pointer shadow-2xl active:scale-98 disabled:opacity-75"
              >
                {isProcessingOrder ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-page border-t-transparent rounded-full animate-spin" />
                    Securing Your Custom Pair...
                  </span>
                ) : (
                  <>
                    <span>Claim 50% Off & Complete Order • ${discountedPrice.toFixed(2)}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-faint caption">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Apple Pay
                </span>
                <span>•</span>
                <span>Google Pay</span>
                <span>•</span>
                <span>Visa / Mastercard</span>
                <span>•</span>
                <span>Klarna</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onRetakeQuiz}
                className="caption text-faint hover:text-muted cursor-pointer transition-colors"
              >
                Start over / Retake quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
