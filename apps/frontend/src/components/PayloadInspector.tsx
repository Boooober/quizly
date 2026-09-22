import React, { useState } from 'react';
import { Terminal, ChevronDown } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';

/**
 * Development-only state readout. It is intentionally excluded from production
 * builds: a debug panel docked over the UI is not part of the product.
 */
export const PayloadInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { answers, history, lastSubmissionPayload, currentStepIndex } =
    useOnboardingStore();

  if (!import.meta.env.DEV) return null;

  const answersCount = Object.keys(answers).length;

  return (
    // Docked top-right: the bottom edge belongs to the primary CTA
    <aside className="fixed top-20 right-3 z-30 w-[min(24rem,calc(100vw-1.5rem))]">
      <div className="overflow-hidden rounded-tile border border-rule bg-page">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 caption text-muted transition-colors hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-accent" />
            state inspector
            <span data-numeric className="text-faint">
              {answersCount} answered
            </span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="max-h-72 space-y-2 overflow-y-auto border-t border-rule p-3 text-left">
            <p className="caption text-faint">
              Last submission payload
            </p>
            <pre className="overflow-x-auto rounded-md bg-tile p-2.5 font-mono text-[0.6875rem] leading-relaxed text-muted">
              {JSON.stringify(
                lastSubmissionPayload ?? {
                  status: 'no submission yet',
                  currentStepIndex,
                  activeAnswers: answers,
                  historyLength: history.length,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
};
