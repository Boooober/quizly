import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchNextQuestion } from '../api/quizApi';
import type { AnsweredQuestionDto, QuestionDto } from '../types/quiz';

export type QuizStatus = 'idle' | 'loading' | 'ready' | 'error';

interface OnboardingStoreState {
  /** The wire contract, and the only source of truth. Sent verbatim on every call. */
  history: AnsweredQuestionDto[];
  currentQuestion: QuestionDto | null;

  /** Question text -> selected option labels. Derived from history, for the UI. */
  answers: Record<string, string[]>;
  /** In-progress multi-select picks, before Continue commits them. */
  draftAnswers: Record<string, string[]>;

  status: QuizStatus;
  error: string | null;
  isComplete: boolean;

  start: () => Promise<void>;
  retry: () => Promise<void>;
  toggleDraftOption: (question: string, label: string) => void;
  selectSingleOption: (question: string, label: string) => Promise<void>;
  submitMultiStep: (question: string) => Promise<void>;
  goToPreviousStep: () => Promise<void>;
  resetOnboarding: () => void;
}

const answersFromHistory = (history: AnsweredQuestionDto[]) =>
  Object.fromEntries(history.map((h) => [h.question, h.selectedAnswers]));

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => {
      /** Ask the backend for the next question given a history, and store the result. */
      const advance = async (history: AnsweredQuestionDto[]) => {
        set({
          history,
          answers: answersFromHistory(history),
          status: 'loading',
          error: null,
        });
        try {
          const res = await fetchNextQuestion(history);
          set({
            currentQuestion: res.nextQuestion,
            isComplete: res.nextQuestion === null,
            status: 'ready',
          });
        } catch (err) {
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Request failed',
          });
        }
      };

      /** Append the answer to the question on screen, then ask for the next one. */
      const commit = async (question: string, selectedAnswers: string[]) => {
        const current = get().currentQuestion;
        if (!current || current.question !== question) return;
        if (selectedAnswers.length === 0) return;
        await advance([...get().history, { ...current, selectedAnswers }]);
      };

      return {
        history: [],
        currentQuestion: null,
        answers: {},
        draftAnswers: {},
        status: 'idle',
        error: null,
        isComplete: false,

        start: async () => {
          if (get().status === 'loading') return;
          await advance(get().history);
        },

        retry: async () => {
          await advance(get().history);
        },

        toggleDraftOption: (question, label) => {
          const state = get();
          const draft = state.draftAnswers[question] ?? state.answers[question] ?? [];
          set({
            draftAnswers: {
              ...state.draftAnswers,
              [question]: draft.includes(label)
                ? draft.filter((l) => l !== label)
                : [...draft, label],
            },
          });
        },

        selectSingleOption: async (question, label) => {
          set((state) => ({
            draftAnswers: { ...state.draftAnswers, [question]: [label] },
          }));
          await commit(question, [label]);
        },

        submitMultiStep: async (question) => {
          const state = get();
          const selected = state.draftAnswers[question] ?? state.answers[question] ?? [];
          await commit(question, selected);
        },

        /** Drop the last answer and ask again. The agent is stateless, so the
         *  question it offers next may differ from the one just undone. */
        goToPreviousStep: async () => {
          const history = get().history;
          if (history.length === 0) return;
          await advance(history.slice(0, -1));
        },

        resetOnboarding: () => {
          set({
            history: [],
            currentQuestion: null,
            answers: {},
            draftAnswers: {},
            status: 'idle',
            error: null,
            isComplete: false,
          });
          localStorage.removeItem('quizly-onboarding-storage');
          void get().start();
        },
      };
    },
    {
      name: 'quizly-onboarding-storage',
      storage: createJSONStorage(() => localStorage),
      // Never persist transient request state: a reload must not restore 'loading'.
      partialize: (state) => ({
        history: state.history,
        currentQuestion: state.currentQuestion,
        answers: state.answers,
        draftAnswers: state.draftAnswers,
        isComplete: state.isComplete,
      }),
    }
  )
);
