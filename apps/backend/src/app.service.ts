import { BadGatewayException, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { join } from 'path';
import {
  AnsweredQuestionDto,
  NextQuestionResponseDto,
  ProductDto,
  QUESTION_TYPES,
  RecommendationResponseDto,
} from './quiz.dto';

const MAX_QUESTIONS = 8; // ponytail: hard cap so the LLM cannot stretch the funnel; tune per conversion data

// ponytail: copy of ../../sunglasses.jsonl so the Docker context stays apps/backend; re-copy when the catalog changes
type CatalogItem = Record<string, unknown> & {
  id: string;
  title: string;
  price: number;
  currency: string;
  image_url: string;
};
const CATALOG: CatalogItem[] = readFileSync(
  join(process.cwd(), 'catalog/sunglasses.jsonl'),
  'utf8',
)
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l) as CatalogItem);
const PROMPT_FIELDS = [
  'id',
  'title',
  'price',
  'face_shapes',
  'frame_material',
  'lens_type',
  'aesthetic_archetype',
  'best_for_activities',
  'solves_pain_points',
  'pitch_bullet_points',
];
const CATALOG_FOR_PROMPT = JSON.stringify(
  CATALOG.map((i) => Object.fromEntries(PROMPT_FIELDS.map((k) => [k, i[k]]))),
);
/** The base prompt fixes its own output shape, so every request opens by overriding it. */
const override = (shape: string, ...rest: string[]) =>
  [
    'TASK OVERRIDE. For this request only, ignore any output format described in your system instructions.',
    'Return exactly this JSON object and nothing else:',
    shape,
    ...rest,
  ].join('\n');

@Injectable()
export class AppService {
  private readonly engine = process.env.AGENT_ENGINE ?? '';
  private readonly auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  async nextQuestion(
    answers: AnsweredQuestionDto[],
  ): Promise<NextQuestionResponseDto> {
    if (answers.length >= MAX_QUESTIONS) return { nextQuestion: null };
    const message = override(
      `{"nextQuestion": {"question": string, "answers": string[], "typeOfQuestion": ${QUESTION_TYPES.map((t) => `"${t}"`).join(' | ')}}}`,
      'Return {"nextQuestion": null} if you have enough information.',
      '',
      'Your task: pick the single most useful next question for this user. Never repeat a question already asked.',
      `Questions asked so far: ${answers.length}`,
      'History, as JSON:',
      JSON.stringify(answers),
    );
    const out = (await this.ask(message)) as Partial<NextQuestionResponseDto>;
    if (!out || typeof out !== 'object' || !('nextQuestion' in out)) {
      throw new BadGatewayException({
        message: 'agent did not return nextQuestion',
        agent: out,
      });
    }
    return { nextQuestion: out.nextQuestion ?? null };
  }

  async recommend(
    answers: AnsweredQuestionDto[],
  ): Promise<RecommendationResponseDto> {
    const message = override(
      '{"heroId": string, "alternativeIds": [string, string], "why": [string, string, string]}',
      '"why" are short, persuasive reasons for the hero pick, each tied to a specific answer the user gave.',
      '',
      'Your task: pick the best sunglasses for this user. Use only ids from the catalog below.',
      'Questions asked and the answers the user selected, as JSON:',
      JSON.stringify(answers),
      '',
      'Sunglasses catalog, as JSON:',
      CATALOG_FOR_PROMPT,
    );
    const out = (await this.ask(message)) as AgentPick;
    const rec = buildRecommendation(out);
    if (!rec)
      throw new BadGatewayException({
        message: 'agent did not pick a catalog product',
        agent: out,
      });
    return rec;
  }

  /** Sends one message to the Agent Engine agent and returns its reply parsed as JSON. */
  private async ask(message: string): Promise<unknown> {
    const region = this.engine.split('/')[3];
    const client = await this.auth.getClient();
    const { token } = await client.getAccessToken();
    const res = await fetch(
      `https://${region}-aiplatform.googleapis.com/v1beta1/${this.engine}:streamQuery?alt=sse`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classMethod: 'async_stream_query',
          input: { user_id: 'quizly', message },
        }),
      },
    );
    if (!res.ok) throw new BadGatewayException(await res.text());
    return extractJson(await res.text());
  }
}

export type AgentPick = {
  heroId?: string;
  alternativeIds?: string[];
  why?: string[];
};

/** Hydrates the agent's ids from the catalog so prices, titles and image URLs are never invented. */
export function buildRecommendation(
  pick: AgentPick | null | undefined,
): RecommendationResponseDto | null {
  const product = (id?: string): ProductDto | undefined => {
    const i = CATALOG.find((c) => c.id === id);
    return (
      i && {
        id: i.id,
        title: i.title,
        price: i.price,
        currency: i.currency,
        imageUrl: i.image_url,
      }
    );
  };
  const hero = product(pick?.heroId);
  if (!hero) return null;
  const alternatives = (pick?.alternativeIds ?? [])
    .map(product)
    .filter((p): p is ProductDto => !!p && p.id !== hero.id);
  return {
    hero,
    alternatives,
    why: (pick?.why ?? []).filter((w) => typeof w === 'string'),
  };
}

type AdkEvent = {
  partial?: boolean;
  content?: { parts?: { text?: string }[] };
};

/** streamQuery returns one JSON ADK event per chunk; a chunk may span lines or carry an SSE `data:` prefix. */
export function parseEvents(body: string): AdkEvent[] {
  const events: AdkEvent[] = [];
  let buf = '';
  for (const line of body.split('\n')) {
    const l = line.replace(/^data: ?/, '').trim();
    if (!l) continue;
    buf += l;
    try {
      events.push(JSON.parse(buf) as AdkEvent);
      buf = '';
    } catch {
      /* incomplete JSON, keep accumulating */
    }
  }
  return events;
}

/** The answer is the text of the last complete model event; strip ```json fences and parse. */
export function extractJson(body: string): unknown {
  const text = parseEvents(body)
    .filter((e) => !e.partial)
    .map((e) => (e.content?.parts ?? []).map((p) => p.text ?? '').join(''))
    .filter(Boolean)
    .at(-1);
  if (!text) throw new BadGatewayException('agent returned no text');
  const clean = text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '');
  try {
    return JSON.parse(clean) as unknown;
  } catch {
    return { raw: text };
  }
}
