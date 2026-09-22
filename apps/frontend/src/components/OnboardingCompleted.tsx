import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, CheckCircle } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { mockOnboardingSteps } from '../data/mockSteps';

export const OnboardingCompleted: React.FC = () => {
  const { answers, history, lastSubmissionPayload, resetOnboarding } =
    useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-left space-y-6 pt-4 pb-20"
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          Onboarding Complete
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Profile Formulated
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          All questions answered. Every response has been preserved in localStorage and bundled in the cumulative payload.
        </p>
      </div>

      {/* Answers breakdown */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Collected Response History ({history.length} steps)
        </h2>

        <div className="divide-y divide-white/5 text-sm">
          {mockOnboardingSteps.map((step) => {
            const selected = answers[step.id] || [];
            const selectedLabels = step.options
              .filter((o) => selected.includes(o.id))
              .map((o) => o.title);

            return (
              <div key={step.id} className="py-3 first:pt-1 last:pb-1">
                <div className="text-xs text-zinc-400 mb-0.5">{step.question}</div>
                <div className="font-medium text-white">
                  {selectedLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-block rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 border border-white/5"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-600 italic text-xs">Skipped / Unanswered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Payload Preview */}
      <div className="space-y-2">
        <div className="text-xs uppercase font-mono tracking-wider text-zinc-500">
          Final Cumulative Payload (Ready for API Adapter):
        </div>
        <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 p-4 rounded-2xl border border-white/10 overflow-x-auto">
          {JSON.stringify(lastSubmissionPayload, null, 2)}
        </pre>
      </div>

      <button
        type="button"
        onClick={resetOnboarding}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-medium text-sm text-zinc-300 border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:text-white transition-all cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Reset & Start Over</span>
      </button>
    </motion.div>
  );
};
