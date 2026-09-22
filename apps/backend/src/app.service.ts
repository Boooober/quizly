import { BadGatewayException, Injectable } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';

export type QuizRequest = {
  topic: string;
  count?: number;
  difficulty?: string;
  source?: string;
};

@Injectable()
export class AppService {
  private readonly engine = process.env.AGENT_ENGINE ?? '';
  private readonly auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  async generateQuiz(req: QuizRequest): Promise<unknown> {
    const message = [
      `Topic: ${req.topic}`,
      req.count && `Number of questions: ${req.count}`,
      req.difficulty && `Difficulty: ${req.difficulty}`,
      req.source && `Source text:\n${req.source}`,
    ]
      .filter(Boolean)
      .join('\n');

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
    return extractQuiz(await res.text());
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
export function extractQuiz(body: string): unknown {
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
