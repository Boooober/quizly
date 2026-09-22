import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  OnboardingSubmissionPayload,
  StepAnswerRecord,
} from '../types/onboarding';

interface OnboardingStoreState {
  currentStepIndex: number;
  answers: Record<string, string[]>; // Committed answers: stepId -> optionIds
  draftAnswers: Record<string, string[]>; // Draft selections for active multi-select
  history: StepAnswerRecord[];
  lastSubmissionPayload: OnboardingSubmissionPayload | null;
  isComplete: boolean;

  // Actions
  toggleDraftOption: (stepId: string, optionId: string) => void;
  selectSingleOption: (
    stepId: string,
    optionId: string,
    totalSteps: number
  ) => OnboardingSubmissionPayload;
  submitMultiStep: (
    stepId: string,
    totalSteps: number
  ) => OnboardingSubmissionPayload;
  goToPreviousStep: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      currentStepIndex: 0,
      answers: {},
      draftAnswers: {},
      history: [],
      lastSubmissionPayload: null,
      isComplete: false,

      toggleDraftOption: (stepId: string, optionId: string) => {
        const currentDraft = get().draftAnswers[stepId] ?? get().answers[stepId] ?? [];
        const exists = currentDraft.includes(optionId);
        const updated = exists
          ? currentDraft.filter((id) => id !== optionId)
          : [...currentDraft, optionId];

        set((state) => ({
          draftAnswers: {
            ...state.draftAnswers,
            [stepId]: updated,
          },
        }));
      },

      selectSingleOption: (stepId: string, optionId: string, totalSteps: number) => {
        const state = get();
        const selected = [optionId];
        const newAnswers = {
          ...state.answers,
          [stepId]: selected,
        };

        const newRecord: StepAnswerRecord = {
          stepId,
          selectedOptionIds: selected,
          answeredAt: new Date().toISOString(),
        };

        const filteredHistory = state.history.filter((h) => h.stepId !== stepId);
        const updatedHistory = [...filteredHistory, newRecord];

        const payload: OnboardingSubmissionPayload = {
          currentStepId: stepId,
          currentAnswer: selected,
          allAnswers: newAnswers,
          history: updatedHistory,
        };

        const nextIndex = state.currentStepIndex + 1;
        const complete = nextIndex >= totalSteps;

        set({
          answers: newAnswers,
          draftAnswers: {
            ...state.draftAnswers,
            [stepId]: selected,
          },
          history: updatedHistory,
          lastSubmissionPayload: payload,
          currentStepIndex: complete ? state.currentStepIndex : nextIndex,
          isComplete: complete,
        });

        console.group(`[Quizly Onboarding] Step Submitted: ${stepId}`);
        console.log('Current Answer:', selected);
        console.log('All Cumulative Answers:', newAnswers);
        console.log('Full Submission Payload:', payload);
        console.groupEnd();

        return payload;
      },

      submitMultiStep: (stepId: string, totalSteps: number) => {
        const state = get();
        const selected =
          state.draftAnswers[stepId] ?? state.answers[stepId] ?? [];

        if (selected.length === 0) {
          throw new Error('At least one option must be selected.');
        }

        const newAnswers = {
          ...state.answers,
          [stepId]: selected,
        };

        const newRecord: StepAnswerRecord = {
          stepId,
          selectedOptionIds: selected,
          answeredAt: new Date().toISOString(),
        };

        const filteredHistory = state.history.filter((h) => h.stepId !== stepId);
        const updatedHistory = [...filteredHistory, newRecord];

        const payload: OnboardingSubmissionPayload = {
          currentStepId: stepId,
          currentAnswer: selected,
          allAnswers: newAnswers,
          history: updatedHistory,
        };

        const nextIndex = state.currentStepIndex + 1;
        const complete = nextIndex >= totalSteps;

        set({
          answers: newAnswers,
          history: updatedHistory,
          lastSubmissionPayload: payload,
          currentStepIndex: complete ? state.currentStepIndex : nextIndex,
          isComplete: complete,
        });

        console.group(`[Quizly Onboarding] Step Submitted: ${stepId}`);
        console.log('Current Answer:', selected);
        console.log('All Cumulative Answers:', newAnswers);
        console.log('Full Submission Payload:', payload);
        console.groupEnd();

        return payload;
      },

      goToPreviousStep: () => {
        set((state) => ({
          currentStepIndex: Math.max(0, state.currentStepIndex - 1),
          isComplete: false,
        }));
      },

      resetOnboarding: () => {
        set({
          currentStepIndex: 0,
          answers: {},
          draftAnswers: {},
          history: [],
          lastSubmissionPayload: null,
          isComplete: false,
        });
        localStorage.removeItem('quizly-onboarding-storage');
      },
    }),
    {
      name: 'quizly-onboarding-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
