import { BadGatewayException, Injectable } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import {
  AnsweredQuestionDto,
  NextQuestionResponseDto,
  QUESTION_TYPES,
} from './quiz.dto';

@Injectable()
export class AppService {
  private readonly engine = process.env.AGENT_ENGINE ?? '';
  private readonly auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  async nextQuestion(
    answers: AnsweredQuestionDto[],
  ): Promise<NextQuestionResponseDto> {
    const message = [
      'Questions asked so far and the answers the user selected, as JSON:',
      JSON.stringify(answers),
      '',
      'Return the single next question to ask, as JSON only:',
      `{"nextQuestion": {"question": string, "answers": string[], "typeOfQuestion": ${QUESTION_TYPES.map((t) => `"${t}"`).join(' | ')}}}`,
      'Do not repeat a question that was already asked. If you have enough information, return {"nextQuestion": null}.',
    ].join('\n');
    const out = (await this.ask(message)) as Partial<NextQuestionResponseDto>;
    if (!out || typeof out !== 'object' || !('nextQuestion' in out)) {
      throw new BadGatewayException({
        message: 'agent did not return nextQuestion',
        agent: out,
      });
    }
    return { nextQuestion: out.nextQuestion ?? null };
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
