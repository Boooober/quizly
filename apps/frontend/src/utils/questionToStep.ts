import type { OnboardingStepUI, OptionUI } from '../types/onboarding';
import type { QuestionDto } from '../types/quiz';

/**
 * Catalog labels often read "Short name (the explanatory part)". Split that for
 * the tile, but keep the full label as the id: the id is what goes back to the
 * backend as `selectedAnswers`, so it must stay byte-identical to `answers`.
 */
function toOption(answer: string): OptionUI {
  const match = /^(.*?)\s*\((.*)\)$/.exec(answer);
  return match
    ? { id: answer, title: match[1], subtitle: match[2] }
    : { id: answer, title: answer };
}

/** Render-time adapter from the wire contract to the UI's own step shape. */
export function questionToStep(
  question: QuestionDto,
  questionNumber: number,
  totalQuestions: number,
): OnboardingStepUI {
  const isMulti = question.typeOfQuestion === 'multiChoice';
  return {
    id: question.question,
    stepNumber: questionNumber,
    totalSteps: totalQuestions,
    progressPercent: Math.round(((questionNumber - 1) / totalQuestions) * 100),
    question: question.question,
    helperText: isMulti ? 'Select all that apply' : 'Choose one to continue',
    mode: isMulti ? 'multi_select' : 'single_select',
    options: question.answers.map(toOption),
  };
}
