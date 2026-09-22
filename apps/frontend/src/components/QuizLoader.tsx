import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * The agent turn is a Vertex call behind a Cloud Run instance, so a submit can
 * take tens of seconds. The wait therefore gets its own screen with copy that
 * escalates, rather than a frozen question the user is tempted to re-click.
 */
interface QuizLoaderProps {
  /** No question has ever been on screen: show tiles-shaped skeletons instead. */
  isFirstLoad: boolean;
}

/** Copy shown from this many ms into the wait, longest threshold last. */
const STAGES = [
  { after: 0, text: 'Reading your answer' },
  { after: 4_000, text: 'Weighing it against your fit profile' },
  { after: 12_000, text: 'Still working, this one is taking longer than usual' },
] as const;

export const QuizLoader: React.FC<QuizLoaderProps> = ({ isFirstLoad }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = STAGES.slice(1).map((s, i) =>
      setTimeout(() => setStage(i + 1), s.after)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  if (isFirstLoad) {
    return (
      <div className="pt-8">
        <div className="h-4 w-2/3 animate-pulse rounded-pill bg-tile" />
        <div className="mt-10 flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-tile bg-tile" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-20 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      <p aria-live="polite" className="mt-6 text-ink">
        {STAGES[stage].text}
      </p>
      <p className="caption mt-2 text-faint">
        Your next question is chosen from everything you have answered so far.
      </p>
    </div>
  );
};
