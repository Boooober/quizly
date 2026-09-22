import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { pigmentForIndex } from '../theme/pigments';
import { questionToStep } from '../utils/questionToStep';
import { QuestionHeader } from './QuestionHeader';
import { SingleSelectStep } from './SingleSelectStep';
import { MultiSelectStep } from './MultiSelectStep';
import { QuizLoader } from './QuizLoader';
import { PostQuizFlow } from './PostQuizFlow';
import { PayloadInspector } from './PayloadInspector';

export const OnboardingShell: React.FC = () => {
  const {
    currentQuestion,
    history,
    status,
    error,
    isComplete,
    start,
    retry,
    goToPreviousStep,
    resetOnboarding,
  } = useOnboardingStore();

  // The first question comes from the agent, so ask for it on mount.
  useEffect(() => {
    if (status === 'idle' && !isComplete && !currentQuestion) void start();
  }, [status, isComplete, currentQuestion, start]);

  const currentStep =
    currentQuestion && !isComplete ? questionToStep(currentQuestion) : null;
  const isLoading = status === 'loading';

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#field" className="skip-link">
        Skip to question
      </a>

      <header className="sticky top-0 z-40 bg-page">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          <div className="w-11">
            {history.length > 0 && !isComplete && (
              <button
                type="button"
                onClick={() => void goToPreviousStep()}
                disabled={isLoading}
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
      </header>

      <main
        id="field"
        className="mx-auto w-full max-w-xl flex-1 px-4 pt-12 sm:px-6 sm:pt-16"
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.section
              key="completed"
              aria-label="Your fit profile and try-on"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <PostQuizFlow />
            </motion.section>
          ) : status === 'error' ? (
            <motion.section
              key="error"
              aria-label="Something went wrong"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-8 text-center"
            >
              <p className="text-ink">We could not reach the quiz service.</p>
              <p className="caption mt-2 break-words text-faint">{error}</p>
              <button
                type="button"
                onClick={() => void retry()}
                className="mt-6 inline-flex min-h-14 cursor-pointer items-center justify-center rounded-pill bg-ink px-8 text-[1.0625rem] font-medium text-page transition-colors duration-200 ease-soft hover:bg-accent-strong"
              >
                Try again
              </button>
            </motion.section>
          ) : isLoading || !currentStep ? (
            <motion.section
              key="loading"
              aria-label="Loading the next question"
              aria-busy="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizLoader isFirstLoad={!currentQuestion} />
            </motion.section>
          ) : (
            (
              <motion.section
                key={currentStep.id}
                aria-label={`Question ${history.length + 1}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <QuestionHeader
                  pigment={pigmentForIndex(history.length)}
                  category={currentStep.category}
                  question={currentStep.question}
                  helperText={currentStep.helperText}
                />

                {currentStep.mode === 'single_select' ? (
                  <SingleSelectStep step={currentStep} />
                ) : (
                  <MultiSelectStep step={currentStep} />
                )}
              </motion.section>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
