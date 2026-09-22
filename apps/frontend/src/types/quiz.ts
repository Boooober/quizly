/**
 * Mirror of apps/backend/src/quiz.dto.ts. This is the wire contract shared by
 * the frontend, the backend and the agent prompt. Change all three together.
 */

export const QUESTION_TYPES = ['singleChoice', 'multiChoice'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** A question the agent asked: the text, every option offered, and how to pick. */
export interface QuestionDto {
  question: string;
  /** Every option offered. singleChoice: 2 to 4. multiChoice: exactly 4. */
  answers: string[];
  typeOfQuestion: QuestionType;
}

/** A question plus what the user picked. The quiz history is an array of these. */
export interface AnsweredQuestionDto extends QuestionDto {
  /** Values taken from `answers`, never ids or labels of our own making. */
  selectedAnswers: string[];
}

export interface NextQuestionResponseDto {
  /** null when the survey is complete. */
  nextQuestion: QuestionDto | null;
}

export interface ProductDto {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export interface RecommendationResponseDto {
  hero: ProductDto;
  alternatives: ProductDto[];
  why: string[];
}
