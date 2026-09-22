import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';

interface MultiSelectStepProps {
  step: OnboardingStepUI;
  totalSteps: number;
}

const EMPTY_SELECTIONS: string[] = [];

export const MultiSelectStep: React.FC<MultiSelectStepProps> = ({
  step,
  totalSteps,
}) => {
  const toggleDraftOption = useOnboardingStore((s) => s.toggleDraftOption);
  const submitMultiStep = useOnboardingStore((s) => s.submitMultiStep);
  const selectedIds = useOnboardingStore(
    (s) => s.draftAnswers[step.id] ?? s.answers[step.id] ?? EMPTY_SELECTIONS
  );

  const hasSelection = selectedIds.length > 0;

  const handleContinue = () => {
    if (!hasSelection) return;
    submitMultiStep(step.id, totalSteps);
  };

  return (
    <div className="space-y-6 pt-6 pb-28">
      {/* Live selection counter banner */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Options</span>
        <span className="font-mono text-amber-300/90">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="space-y-3">
        {step.options.map((option, index) => {
          const isSelected = selectedIds.includes(option.id);

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => toggleDraftOption(step.id, option.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              whileTap={{ scale: 0.985 }}
              className={`group relative w-full text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-amber-400/[0.08] shadow-[0_0_24px_rgba(251,191,36,0.18)] ring-1 ring-amber-400/40'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium text-base sm:text-lg transition-colors ${
                        isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {option.title}
                    </span>
                    {option.tag && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-amber-300">
                        {option.tag}
                      </span>
                    )}
                  </div>

                  {option.subtitle && (
                    <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                      {option.subtitle}
                    </p>
                  )}
                </div>

                {/* Checkbox badge */}
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400 text-black shadow-sm'
                      : 'border-zinc-700 bg-black/20 group-hover:border-zinc-500'
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4 stroke-[2.5]" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Floating frosted bottom continue bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-black/70 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasSelection}
            className={`w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-medium text-base transition-all duration-200 ${
              hasSelection
                ? 'bg-amber-400 text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:bg-amber-300 cursor-pointer active:scale-[0.99]'
                : 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
