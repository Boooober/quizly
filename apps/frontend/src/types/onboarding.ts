export type StepMode = 'single_select' | 'multi_select';

export interface OptionUI {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
}

export interface OnboardingStepUI {
  id: string;
  stepNumber: number;
  totalSteps: number;
  progressPercent: number; // 0 to 100 for top progress indicator
  category?: string;       // e.g. "Fit & Feel", "Ergonomics", "Optical Environment"
  question: string;
  helperText?: string;     // e.g. "Select all that apply" or "Choose one to continue"
  mode: StepMode;
  options: OptionUI[];
}

export interface StepAnswerRecord {
  stepId: string;
  selectedOptionIds: string[];
  answeredAt: string; // ISO timestamp
}

// Cumulative payload containing all previous responses on every submit
export interface OnboardingSubmissionPayload {
  currentStepId: string;
  currentAnswer: string[];
  allAnswers: Record<string, string[]>; // { [stepId]: selectedOptionIds[] }
  history: StepAnswerRecord[];
}
