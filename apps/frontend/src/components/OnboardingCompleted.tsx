import React from 'react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { pigmentForIndex } from '../theme/pigments';

export const OnboardingCompleted: React.FC = () => {
  const { history, resetOnboarding } = useOnboardingStore();

  return (
    <div className="pb-24">
      <div className="text-center">
        <p className="caption text-faint">All done</p>
        <h1 className="mt-4 text-[1.75rem] leading-[1.18] text-ink sm:text-[2.125rem]">
          Your fit profile
        </h1>
        <p className="subheading mt-2 text-muted">
          {history.length} answers, saved on this device
        </p>
      </div>

      <dl className="mt-10 flex flex-col gap-2.5">
        {history.map((entry, index) => {
          const pigment = pigmentForIndex(index);
          const selectedLabels = entry.selectedAnswers;

          return (
            <div key={entry.question} className="rounded-tile bg-tile px-5 py-4">
              <dt className="caption flex items-center gap-2 text-faint">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pigment.hex }}
                />
                {`Question ${index + 1}`}
              </dt>
              <dd className="mt-1.5">
                {selectedLabels.length > 0 ? (
                  <ul className="space-y-0.5">
                    {selectedLabels.map((label) => (
                      <li key={label} className="text-[1.0625rem] font-medium text-ink">
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[0.9375rem] text-muted">Not answered</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {import.meta.env.DEV && (
        <details className="mt-4">
          <summary className="caption cursor-pointer text-faint hover:text-muted">
            Full history, as sent to the backend (dev)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-tile bg-tile p-4 font-mono text-xs leading-relaxed text-muted">
            {JSON.stringify(history, null, 2)}
          </pre>
        </details>
      )}

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={resetOnboarding}
          className="caption min-h-12 cursor-pointer rounded-pill border border-ink/25 px-8 text-ink transition-colors duration-200 ease-soft hover:bg-tile"
        >
          Start over
        </button>
      </div>
    </div>
  );
};
