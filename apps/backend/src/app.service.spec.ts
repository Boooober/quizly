import { buildRecommendation, extractJson, parseEvents } from './app.service';

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

describe('extractJson', () => {
  it('takes the last non-partial text event and strips json fences', () => {
    const body = [
      ev('{"x":1}', true),
      ev('```json\n{"title":"T","questions":[]}\n```'),
    ].join('\n');
    expect(extractJson(body)).toEqual({ title: 'T', questions: [] });
  });
  it('returns raw text when the model did not emit JSON', () => {
    expect(extractJson(ev('not json'))).toEqual({ raw: 'not json' });
  });
});

describe('buildRecommendation', () => {
  it('hydrates known ids from the catalog and drops unknown or duplicate ones', () => {
    const rec = buildRecommendation({
      heroId: 'sg-01-navigator-polar',
      alternativeIds: [
        'sg-01-navigator-polar',
        'sg-02-nope',
        'sg-02-maverick-wayfarer',
      ],
      why: ['fits', 42 as unknown as string],
    });
    expect(rec?.hero.title).toBe('The Coastal Navigator Polarized');
    expect(rec?.hero.imageUrl).toMatch(/^https:\/\/storage\.googleapis\.com\//);
    expect(rec?.alternatives.map((a) => a.id)).toEqual([
      'sg-02-maverick-wayfarer',
    ]);
    expect(rec?.why).toEqual(['fits']);
  });
  it('returns null when the hero is not in the catalog', () => {
    expect(buildRecommendation({ heroId: 'made-up' })).toBeNull();
  });
});
