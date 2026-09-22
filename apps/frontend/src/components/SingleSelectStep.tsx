import React, { useEffect, useRef, useState } from 'react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OptionTile } from './OptionTile';

interface SingleSelectStepProps {
  step: OnboardingStepUI;
}

const EMPTY_SELECTIONS: string[] = [];

export const SingleSelectStep: React.FC<SingleSelectStepProps> = ({ step }) => {
  const selectSingleOption = useOnboardingStore((s) => s.selectSingleOption);
  const currentSelections = useOnboardingStore(
    (s) => s.answers[step.id] ?? EMPTY_SELECTIONS
  );

  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const handleSelect = (optionId: string) => {
    setPendingOptionId(optionId);
    // Brief hold so the selected state registers before the step advances
    advanceTimer.current = setTimeout(() => {
      void selectSingleOption(step.id, optionId);
      setPendingOptionId(null);
    }, 180);
  };

  return (
    <div
      role="radiogroup"
      aria-label={step.question}
      className="mt-10 flex flex-col gap-2.5"
    >
      {step.options.map((option) => (
        <OptionTile
          key={option.id}
          option={option}
          control="radio"
          disabled={pendingOptionId !== null}
          isSelected={
            pendingOptionId === option.id ||
            (pendingOptionId === null && currentSelections.includes(option.id))
          }
          onSelect={() => handleSelect(option.id)}
        />
      ))}
    </div>
  );
};
