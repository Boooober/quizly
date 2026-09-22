import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Check } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { mockOnboardingSteps } from '../data/mockSteps';

export const OnboardingCompleted: React.FC = () => {
  const { answers, history, lastSubmissionPayload, resetOnboarding } =
    useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="pb-24 text-left"
    >
      <div className="inline-flex items-center gap-2 rounded-sm border border-positive/25 bg-positive/10 px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.18em] text-positive uppercase">
        <Check className="h-3 w-3 stroke-[2.5]" />
        Profile complete
      </div>

      <h1 className="mt-4 text-[1.75rem] leading-[1.12] font-semibold tracking-[-0.022em] text-white sm:text-4xl">
        Your fit profile is ready
      </h1>
      <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-zinc-400 sm:text-base">
        {history.length} answers recorded. Your responses are saved on this
        device, so you can come back and adjust any of them.
      </p>

      <dl className="mt-8 divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface/60">
        {mockOnboardingSteps.map((step) => {
          const selected = answers[step.id] ?? [];
          const selectedLabels = step.options
            .filter((option) => selected.includes(option.id))
            .map((option) => option.title);

          return (
            <div key={step.id} className="px-5 py-4">
              <dt className="text-xs leading-relaxed text-zinc-500">
                {step.question}
              </dt>
              <dd className="mt-2">
                {selectedLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-md border border-line bg-surface-raised px-2.5 py-1 text-xs text-zinc-200"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600">Not answered</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {import.meta.env.DEV && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[0.6875rem] tracking-wide text-zinc-600 uppercase hover:text-zinc-400">
            Cumulative payload (dev)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-black/50 p-4 font-mono text-[0.6875rem] leading-relaxed text-zinc-300">
            {JSON.stringify(lastSubmissionPayload, null, 2)}
          </pre>
        </details>
      )}

      <button
        type="button"
        onClick={resetOnboarding}
        className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-panel border border-line bg-surface px-6 py-3.5 text-sm font-medium text-zinc-300 transition-colors duration-200 hover:border-line-strong hover:bg-surface-raised hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
        Start over
      </button>
    </motion.div>
  );
};
