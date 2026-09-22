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

export const OnboardingShell: React.FC = () => {
  const {
    currentStepIndex,
    isComplete,
    goToPreviousStep,
    resetOnboarding,
  } = useOnboardingStore();

  const totalSteps = mockOnboardingSteps.length;
  const currentStep = mockOnboardingSteps[currentStepIndex];

  const progressPercent = isComplete
    ? 100
    : Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-zinc-100 flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Top Animated Progress Bar */}
      <div className="fixed top-0 inset-x-0 h-1 bg-zinc-900 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </div>

      {/* Main Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0B0E]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-xl px-4 py-4 flex items-center justify-between">
          <div className="w-10">
            {currentStepIndex > 0 && !isComplete && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer active:scale-95"
                title="Back to previous question"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Minimalist Brandmark */}
          <div className="text-center">
            <span className="font-semibold text-xs tracking-[0.25em] uppercase text-zinc-300">
              Quizly Optics
            </span>
          </div>

          {/* Right Action: Step count & Reset */}
          <div className="flex items-center gap-2 justify-end w-16">
            {!isComplete && (
              <span className="font-mono text-xs text-zinc-400">
                0{currentStepIndex + 1}/0{totalSteps}
              </span>
            )}
            <button
              type="button"
              onClick={resetOnboarding}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/15 transition-all cursor-pointer"
              title="Reset progress"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Viewport Content */}
      <main className="flex-1 mx-auto max-w-xl w-full px-4 sm:px-6 pt-6 sm:pt-10">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <OnboardingCompleted />
            </motion.div>
          ) : (
            currentStep && (
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex flex-col"
              >
                <QuestionHeader
                  category={currentStep.category}
                  question={currentStep.question}
                  helperText={currentStep.helperText}
                />

                {currentStep.mode === 'single_select' ? (
                  <SingleSelectStep
                    step={currentStep}
                    totalSteps={totalSteps}
                  />
                ) : (
                  <MultiSelectStep
                    step={currentStep}
                    totalSteps={totalSteps}
                  />
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      {/* Live State & Cumulative Payload Inspector */}
      <PayloadInspector />
    </div>
  );
};
