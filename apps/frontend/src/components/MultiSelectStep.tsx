import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OptionCard } from './OptionCard';

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
    <div className="pt-7 pb-36">
      <div className="flex items-baseline justify-between px-0.5 pb-3 text-xs text-zinc-500">
        <span className="tracking-wide">Select any that apply</span>
        <span
          data-numeric
          aria-live="polite"
          className={`font-mono transition-colors ${
            hasSelection ? 'text-accent-bright' : 'text-zinc-600'
          }`}
        >
          {selectedIds.length} selected
        </span>
      </div>

      <div
        role="group"
        aria-label={step.question}
        className="flex flex-col gap-3"
      >
        {step.options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            index={index}
            control="checkbox"
            isSelected={selectedIds.includes(option.id)}
            onSelect={() => toggleDraftOption(step.id, option.id)}
          />
        ))}
      </div>

      {/* Commit bar: pinned so the CTA never drifts below the fold */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/85 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasSelection}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-panel px-6 py-4 text-base font-medium transition-all duration-200 ${
              hasSelection
                ? 'cursor-pointer bg-accent text-accent-ink shadow-accent hover:bg-accent-bright active:scale-[0.99]'
                : 'cursor-not-allowed border border-line bg-surface text-zinc-600'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4 stroke-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
