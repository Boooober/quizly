import { extractQuiz, parseEvents } from './app.service';

const ev = (text: string, partial = false) =>
  JSON.stringify({ content: { role: 'model', parts: [{ text }] }, partial });

describe('parseEvents', () => {
  it('parses NDJSON, SSE-prefixed, and multi-line events', () => {
    const body = [
      ev('a'),
      'data: ' + ev('b'),
      '{"content":',
      '{"parts":[{"text":"c"}]}}',
    ].join('\n');
    expect(parseEvents(body).map((e) => e.content?.parts?.[0]?.text)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('extractQuiz', () => {
  it('takes the last non-partial text event and strips json fences', () => {
    const body = [
      ev('{"x":1}', true),
      ev('```json\n{"title":"T","questions":[]}\n```'),
    ].join('\n');
    expect(extractQuiz(body)).toEqual({ title: 'T', questions: [] });
  });
  it('returns raw text when the model did not emit JSON', () => {
    expect(extractQuiz(ev('not json'))).toEqual({ raw: 'not json' });
  });
});
