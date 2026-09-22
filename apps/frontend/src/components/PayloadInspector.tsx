import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';

export const PayloadInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { answers, history, lastSubmissionPayload, currentStepIndex } =
    useOnboardingStore();

  const answersCount = Object.keys(answers).length;

  return (
    <div className="fixed bottom-3 right-3 z-40 max-w-md w-full px-2 sm:px-0">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span>State Inspector</span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
              {answersCount} answered
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </button>

        {isOpen && (
          <div className="border-t border-white/10 p-3 text-left space-y-2 max-h-72 overflow-y-auto">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Persisting in localStorage (all previous responses stored)</span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 mb-1">
                Last Submission Payload (Sent to Backend):
              </div>
              <pre className="text-[11px] font-mono text-amber-200/90 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
                {lastSubmissionPayload
                  ? JSON.stringify(lastSubmissionPayload, null, 2)
                  : JSON.stringify(
                      {
                        status: 'No submission yet',
                        currentStepIndex,
                        activeAnswers: answers,
                        historyLength: history.length,
                      },
                      null,
                      2
                    )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
