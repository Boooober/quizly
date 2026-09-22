import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { mockOnboardingSteps } from '../data/mockSteps';
import { pigmentForIndex } from '../theme/pigments';
import { QuestionHeader } from './QuestionHeader';
import { SingleSelectStep } from './SingleSelectStep';
import { MultiSelectStep } from './MultiSelectStep';
import { OnboardingCompleted } from './OnboardingCompleted';
import { PayloadInspector } from './PayloadInspector';

export const OnboardingShell: React.FC = () => {
  const { currentStepIndex, isComplete, goToPreviousStep, resetOnboarding } =
    useOnboardingStore();

  const totalSteps = mockOnboardingSteps.length;
  const currentStep = mockOnboardingSteps[currentStepIndex];
  const progress = isComplete ? 1 : currentStepIndex / totalSteps;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#field" className="skip-link">
        Skip to question
      </a>

      <header className="sticky top-0 z-40 bg-page">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          <div className="w-11">
            {currentStepIndex > 0 && !isComplete && (
              <button
                type="button"
                onClick={goToPreviousStep}
                aria-label="Back to previous question"
                className="-ml-2.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-200 ease-soft hover:bg-tile hover:text-ink"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <span className="caption text-ink">Quizly Optics</span>

          <div className="flex w-11 justify-end">
            {isComplete && (
              <button
                type="button"
                onClick={resetOnboarding}
                aria-label="Start over"
                className="-mr-2.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-200 ease-soft hover:bg-tile hover:text-ink"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Single hairline track, as under the reference carousels */}
        <div
          role="progressbar"
          aria-label="Progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mx-auto max-w-xl px-4"
        >
          <div className="h-px w-full bg-rule">
            <motion.div
              className="h-full origin-left bg-ink"
              initial={false}
              animate={{ scaleX: progress }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0.29, 1] }}
            />
          </div>
        </div>
      </header>

      <main
        id="field"
        className="mx-auto w-full max-w-xl flex-1 px-4 pt-12 sm:px-6 sm:pt-16"
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.section
              key="completed"
              aria-label="Your fit profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <OnboardingCompleted />
            </motion.section>
          ) : (
            currentStep && (
              <motion.section
                key={currentStep.id}
                aria-label={`Question ${currentStepIndex + 1} of ${totalSteps}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <QuestionHeader
                  fieldNumber={currentStepIndex + 1}
                  totalFields={totalSteps}
                  pigment={pigmentForIndex(currentStepIndex)}
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
