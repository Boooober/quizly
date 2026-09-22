import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { mockOnboardingSteps } from '../data/mockSteps';
import { QuestionHeader } from './QuestionHeader';
import { SingleSelectStep } from './SingleSelectStep';
import { MultiSelectStep } from './MultiSelectStep';
import { OnboardingCompleted } from './OnboardingCompleted';
import { PayloadInspector } from './PayloadInspector';

const pad = (value: number, total: number) =>
  String(value).padStart(String(total).length, '0');

export const OnboardingShell: React.FC = () => {
  const { currentStepIndex, isComplete, goToPreviousStep, resetOnboarding } =
    useOnboardingStore();

  const totalSteps = mockOnboardingSteps.length;
  const currentStep = mockOnboardingSteps[currentStepIndex];

  const progressPercent = isComplete
    ? 100
    : Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#step" className="skip-link">
        Skip to question
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
        {/* Progress sits on the header edge so there is one fixed chrome layer, not two */}
        <div
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-x-0 top-0 h-0.5 bg-white/5"
        >
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          />
        </div>

        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <div className="w-10">
            {currentStepIndex > 0 && !isComplete && (
              <button
                type="button"
                onClick={goToPreviousStep}
                aria-label="Back to previous question"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-zinc-400 transition-colors duration-200 hover:border-line-strong hover:text-white active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <span className="text-[0.6875rem] font-semibold tracking-[0.24em] text-zinc-400 uppercase">
            Quizly Optics
          </span>

          <div className="flex w-16 items-center justify-end gap-2">
            {!isComplete && (
              <span data-numeric className="font-mono text-xs text-zinc-500">
                {pad(currentStepIndex + 1, totalSteps)}/{totalSteps}
              </span>
            )}
            <button
              type="button"
              onClick={resetOnboarding}
              aria-label="Reset progress and start over"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent text-zinc-600 transition-colors duration-200 hover:border-line hover:text-zinc-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main
        id="step"
        className="mx-auto w-full max-w-xl flex-1 px-4 pt-8 sm:px-6 sm:pt-14"
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.section
              key="completed"
              aria-label="Results"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
            >
              <OnboardingCompleted />
            </motion.section>
          ) : (
            currentStep && (
              <motion.section
                key={currentStep.id}
                aria-label={`Question ${currentStepIndex + 1} of ${totalSteps}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <QuestionHeader
                  category={currentStep.category}
                  question={currentStep.question}
                  helperText={currentStep.helperText}
                />

                {currentStep.mode === 'single_select' ? (
                  <SingleSelectStep step={currentStep} totalSteps={totalSteps} />
                ) : (
                  <MultiSelectStep step={currentStep} totalSteps={totalSteps} />
                )}
              </motion.section>
            )
          )}
        </AnimatePresence>
      </main>

      <PayloadInspector />
    </div>
  );
};
