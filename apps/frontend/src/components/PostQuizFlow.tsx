import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { computeRecommendation, type RecommendationResult } from '../utils/recommendationEngine';
import type { SunglassesProduct } from '../data/sunglassesCatalog';
import { VirtualTryOn } from './VirtualTryOn';
import { PaywallView } from './PaywallView';

type FlowStep = 'loading' | 'tryon' | 'paywall' | 'error';

export const PostQuizFlow: React.FC = () => {
  const { history, resetOnboarding } = useOnboardingStore();
  const [step, setStep] = useState<FlowStep>('loading');
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SunglassesProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRecommendation() {
      setStep('loading');
      setErrorMessage(null);
      try {
        const result = await computeRecommendation(history);
        if (!active) return;
        setRecommendation(result);
        setSelectedProduct(result.hero);
        setStep('tryon');
      } catch (err) {
        if (!active) return;
        setErrorMessage(err instanceof Error ? err.message : 'Failed to compute fit recommendation');
        setStep('error');
      }
    }

    void loadRecommendation();

    return () => {
      active = false;
    };
  }, [history]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-5"
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-xl font-medium text-ink">Analyzing Your Fit Profile</h2>
              <p className="caption text-muted">
                Synthesizing your answers with our Gemini recommendation engine to select your ideal frame geometry...
              </p>
            </div>

            <div className="w-48 h-1 rounded-full bg-tile overflow-hidden">
              <div className="h-full bg-amber-400 animate-pulse w-2/3 rounded-full" />
            </div>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-rose-500/20 bg-tile p-8 text-center space-y-4"
          >
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-semibold text-ink">Could Not Retrieve Fit Recommendation</h2>
            <p className="text-xs text-muted max-w-sm mx-auto">{errorMessage}</p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep('loading')}
                className="px-5 py-2.5 rounded-pill bg-ink text-page text-xs font-medium cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={resetOnboarding}
                className="px-5 py-2.5 rounded-pill border border-white/10 text-ink text-xs font-medium cursor-pointer"
              >
                Start Over
              </button>
            </div>
          </motion.div>
        )}

        {step === 'tryon' && selectedProduct && recommendation && (
          <motion.div
            key="tryon"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="text-center pb-2">
              <p className="caption text-amber-400 font-semibold tracking-wide uppercase">
                Step 2 of 3 • Live Optical Fit
              </p>
              <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
                Your Recommended Match
              </h1>
              <p className="caption text-muted mt-1">
                Calibrated to your face shape and style preferences. Test the live mirror below:
              </p>
            </div>

            <VirtualTryOn
              selectedProduct={selectedProduct}
              whyReasons={recommendation.why}
              alternatives={recommendation.alternatives}
              onSelectProduct={(product) => setSelectedProduct(product)}
              onProceedToPaywall={() => setStep('paywall')}
              onRetakeQuiz={resetOnboarding}
            />
          </motion.div>
        )}

        {step === 'paywall' && selectedProduct && (
          <motion.div
            key="paywall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="text-center pb-2">
              <p className="caption text-emerald-400 font-semibold tracking-wide uppercase">
                Step 3 of 3 • Exclusive Offer
              </p>
              <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
                Claim Your Custom Fit Box
              </h1>
              <p className="caption text-muted mt-1">
                Your personalized discount has been applied to your recommended pair.
              </p>
            </div>

            <PaywallView
              product={selectedProduct}
              whyReasons={recommendation?.why}
              onBackToTryOn={() => setStep('tryon')}
              onRetakeQuiz={resetOnboarding}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
