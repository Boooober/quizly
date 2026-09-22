import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';

interface SingleSelectStepProps {
  step: OnboardingStepUI;
  totalSteps: number;
}

const EMPTY_SELECTIONS: string[] = [];

export const SingleSelectStep: React.FC<SingleSelectStepProps> = ({
  step,
  totalSteps,
}) => {
  const selectSingleOption = useOnboardingStore((s) => s.selectSingleOption);
  const currentSelections = useOnboardingStore(
    (s) => s.answers[step.id] ?? EMPTY_SELECTIONS
  );

  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setPendingOptionId(optionId);
    // Tactile delay to let the user see the active gold state before transition
    setTimeout(() => {
      selectSingleOption(step.id, optionId, totalSteps);
      setPendingOptionId(null);
    }, 180);
  };

  return (
    <div className="space-y-3 pt-6">
      {step.options.map((option, index) => {
        const isSelected =
          pendingOptionId === option.id ||
          (pendingOptionId === null && currentSelections.includes(option.id));

        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={pendingOptionId !== null}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
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

              {/* Status indicator */}
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400 text-black shadow-sm'
                    : 'border-zinc-700 bg-black/20 group-hover:border-zinc-500'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
