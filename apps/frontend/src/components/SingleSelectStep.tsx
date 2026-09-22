import React, { useEffect, useRef, useState } from 'react';
import type { OnboardingStepUI } from '../types/onboarding';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OptionCard } from './OptionCard';

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
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const handleSelect = (optionId: string) => {
    setPendingOptionId(optionId);
    // Tactile delay so the selected state is visible before the step advances
    advanceTimer.current = setTimeout(() => {
      selectSingleOption(step.id, optionId, totalSteps);
      setPendingOptionId(null);
    }, 180);
  };

  return (
    <div
      role="radiogroup"
      aria-label={step.question}
      className="flex flex-col gap-3 pt-7"
    >
      {step.options.map((option, index) => (
        <OptionCard
          key={option.id}
          option={option}
          index={index}
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
