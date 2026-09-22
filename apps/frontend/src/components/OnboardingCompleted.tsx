import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  CheckCircle,
  ShoppingBag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
} from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { mockOnboardingSteps } from '../data/mockSteps';
import {
  sunglassesCatalog,
  type SunglassesProduct,
} from '../data/sunglassesCatalog';
import {
  computeRecommendation,
  type RecommendationResult,
} from '../utils/recommendationEngine';
import { VirtualTryOn } from './VirtualTryOn';

export const OnboardingCompleted: React.FC = () => {
  const { answers, history, lastSubmissionPayload, resetOnboarding } =
    useOnboardingStore();

  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<SunglassesProduct>(sunglassesCatalog[0]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    computeRecommendation(answers).then((result) => {
      if (active) {
        setRecommendation(result);
        setSelectedProduct(result.hero);
      }
    });
    return () => {
      active = false;
    };
  }, [answers]);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="text-left space-y-8 pt-2 pb-24"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Profile Formulated
          </div>
          {recommendation?.source === 'backend' && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-purple-400">
              <Sparkles className="h-3 w-3" />
              Vertex AI Reasoning Engine
            </div>
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your Virtual Try-On Studio
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Based on your facial fit profile and lifestyle preferences, here are your top recommended sunglasses. Try them on live or switch between models.
        </p>
      </div>

      {/* 2D Virtual Try-On Mirror Canvas */}
      <div className="space-y-3">
        <VirtualTryOn selectedProduct={selectedProduct} />
      </div>

      {/* Product Selector Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Curated For You (Click to Try On)
          </h2>
          <span className="text-xs text-zinc-500">
            {sunglassesCatalog.length} Models Available
          </span>
        </div>

        {/* Horizontal Scrollable Product Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Hero Pick First */}
          {recommendation && (
            <button
              type="button"
              onClick={() => setSelectedProduct(recommendation.hero)}
              className={`flex-shrink-0 w-44 rounded-2xl p-3 border text-left transition-all cursor-pointer relative ${
                selectedProduct.id === recommendation.hero.id
                  ? 'border-amber-400 bg-amber-400/[0.08] shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="absolute top-2 right-2 rounded-full bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.5">
                98% MATCH
              </div>
              <div className="h-20 w-full flex items-center justify-center p-1 mb-2">
                <img
                  src={recommendation.hero.local_image_url}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = recommendation.hero.image_url;
                  }}
                  alt={recommendation.hero.title}
                  className="max-h-full max-w-full object-contain filter drop-shadow"
                />
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {recommendation.hero.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                ${recommendation.hero.price} • {recommendation.hero.frame_size}
              </div>
            </button>
          )}

          {/* Alternatives */}
          {recommendation?.alternatives.map((alt, idx) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => setSelectedProduct(alt)}
              className={`flex-shrink-0 w-44 rounded-2xl p-3 border text-left transition-all cursor-pointer relative ${
                selectedProduct.id === alt.id
                  ? 'border-amber-400 bg-amber-400/[0.08] shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="absolute top-2 right-2 rounded-full bg-white/10 text-zinc-300 text-[9px] font-medium px-1.5 py-0.5 border border-white/10">
                ALT #{idx + 1}
              </div>
              <div className="h-20 w-full flex items-center justify-center p-1 mb-2">
                <img
                  src={alt.local_image_url}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = alt.image_url;
                  }}
                  alt={alt.title}
                  className="max-h-full max-w-full object-contain filter drop-shadow"
                />
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {alt.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                ${alt.price} • {alt.frame_size}
              </div>
            </button>
          ))}

          {/* Other catalog SKUs */}
          {sunglassesCatalog
            .filter(
              (p) =>
                p.id !== recommendation?.hero.id &&
                !recommendation?.alternatives.some((a) => a.id === p.id)
            )
            .map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className={`flex-shrink-0 w-44 rounded-2xl p-3 border text-left transition-all cursor-pointer ${
                  selectedProduct.id === prod.id
                    ? 'border-amber-400 bg-amber-400/[0.08] shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="h-20 w-full flex items-center justify-center p-1 mb-2">
                  <img
                    src={prod.local_image_url}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = prod.image_url;
                    }}
                    alt={prod.title}
                    className="max-h-full max-w-full object-contain filter drop-shadow"
                  />
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {prod.title}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  ${prod.price} • {prod.frame_size}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Selected Product Deep-Dive & Conversion Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-amber-400">
              {selectedProduct.brand} • {selectedProduct.sku}
            </div>
            <h3 className="text-2xl font-semibold text-white">
              {selectedProduct.title}
            </h3>
            <p className="text-sm text-zinc-400 max-w-xl">
              {selectedProduct.conversion_hook}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${selectedProduct.price}
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>In Stock • Free 2-Day Air</span>
            </div>
          </div>
        </div>

        {/* Why this matches you */}
        <div className="space-y-2.5">
          <div className="text-xs uppercase font-semibold tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Why This Fits Your Profile
          </div>
          <div className="space-y-2">
            {(selectedProduct.id === recommendation?.hero.id &&
            recommendation?.why &&
            recommendation.why.length > 0
              ? recommendation.why
              : selectedProduct.pitch_bullet_points
            ).map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 rounded-xl bg-zinc-900/60 p-2.5 border border-white/5"
              >
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Weight</div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {selectedProduct.weight_grams} grams
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Chassis Width</div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {selectedProduct.frame_width_mm}mm ({selectedProduct.frame_size})
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Bridge Architecture</div>
            <div className="text-xs font-semibold text-white mt-0.5 truncate" title={selectedProduct.bridge_architecture}>
              {selectedProduct.bridge_architecture}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Lens Optics</div>
            <div className="text-xs font-semibold text-white mt-0.5 truncate" title={selectedProduct.lens_tint}>
              {selectedProduct.lens_type}
            </div>
          </div>
        </div>

        {/* High-Converting CTA Action */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-base text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.25)] active:scale-[0.99]"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Order {selectedProduct.title} • ${selectedProduct.price}</span>
          </button>

          <AnimatePresence>
            {addedToCart && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-xs font-medium text-emerald-400 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Added to bag! 30-Day Risk-Free Home Try-On Guarantee included.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accordion: User Responses Breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs uppercase font-semibold tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            Quiz Response Profile ({history.length} steps answered)
          </span>
          {showHistory ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showHistory && (
          <div className="p-5 pt-0 border-t border-white/5 divide-y divide-white/5 text-sm">
            {mockOnboardingSteps.map((step) => {
              const selected = answers[step.id] || [];
              const selectedLabels = step.options
                .filter((o) => selected.includes(o.id))
                .map((o) => o.title);

              return (
                <div key={step.id} className="py-3 first:pt-3 last:pb-1">
                  <div className="text-xs text-zinc-400 mb-0.5">{step.question}</div>
                  <div className="font-medium text-white">
                    {selectedLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedLabels.map((label) => (
                          <span
                            key={label}
                            className="inline-block rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 border border-white/5"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600 italic text-xs">
                        Skipped / Unanswered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion: Raw Cumulative Payload Preview */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPayload(!showPayload)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs uppercase font-semibold tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <span>Raw Payload Inspector (API Adapter Format)</span>
          {showPayload ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showPayload && (
          <div className="p-5 pt-0 border-t border-white/5">
            <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-white/10 overflow-x-auto max-h-64">
              {JSON.stringify(lastSubmissionPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Reset & Start Over CTA */}
      <button
        type="button"
        onClick={resetOnboarding}
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-medium text-xs text-zinc-400 border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Retake Quiz With Different Preferences</span>
      </button>
    </motion.div>
  );
};
