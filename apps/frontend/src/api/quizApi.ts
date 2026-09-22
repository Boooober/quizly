import type {
  AnsweredQuestionDto,
  NextQuestionResponseDto,
  RecommendationResponseDto,
} from '../types/quiz';

const API_URL = 'https://quizly-backend-jlfxz2zysa-ew.a.run.app';

/** Generous: a Cloud Run cold start plus an agent turn can take tens of seconds. */
const TIMEOUT_MS = 45_000;

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Send every question asked so far. Send [] to start the quiz. */
export const fetchNextQuestion = (history: AnsweredQuestionDto[]) =>
  post<NextQuestionResponseDto>('/quiz/submit-answer', history);

/** Send the completed history to get the hero product and alternatives. */
export const fetchRecommendation = (history: AnsweredQuestionDto[]) =>
  post<RecommendationResponseDto>('/quiz/recommend', history);
