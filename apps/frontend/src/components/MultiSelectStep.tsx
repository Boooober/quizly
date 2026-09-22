import React from 'react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OptionTile } from './OptionTile';

interface MultiSelectStepProps {
  step: OnboardingStepUI;
}

const EMPTY_SELECTIONS: string[] = [];

export const MultiSelectStep: React.FC<MultiSelectStepProps> = ({ step }) => {
  const toggleDraftOption = useOnboardingStore((s) => s.toggleDraftOption);
  const submitMultiStep = useOnboardingStore((s) => s.submitMultiStep);
  const selectedIds = useOnboardingStore(
    (s) => s.draftAnswers[step.id] ?? s.answers[step.id] ?? EMPTY_SELECTIONS
  );

  const hasSelection = selectedIds.length > 0;

  const handleContinue = () => {
    if (!hasSelection) return;
    void submitMultiStep(step.id);
  };

  return (
    <div className="mt-10 pb-36">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="caption text-faint">Select all that apply</span>
        <span
          data-numeric
          aria-live="polite"
          className={`caption ${hasSelection ? 'text-accent' : 'text-faint'}`}
        >
          {String(selectedIds.length).padStart(2, '0')} selected
        </span>
      </div>

      <div role="group" aria-label={step.question} className="flex flex-col gap-2.5">
        {step.options.map((option) => (
          <OptionTile
            key={option.id}
            option={option}
            control="checkbox"
            isSelected={selectedIds.includes(option.id)}
            onSelect={() => toggleDraftOption(step.id, option.id)}
          />
        ))}
      </div>

      {/* Commit bar: pinned so the CTA never drifts below the fold */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-page px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasSelection}
            className={`inline-flex min-h-14 w-full items-center justify-center rounded-pill px-6 text-[1.0625rem] font-medium transition-colors duration-200 ease-soft ${
              hasSelection
                ? 'cursor-pointer bg-ink text-page hover:bg-accent-strong'
                : 'cursor-not-allowed bg-tile text-faint'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
