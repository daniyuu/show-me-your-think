import { describe, it, expect } from 'vitest';

// We test the private parsing methods by instantiating AIAnalyzer with a
// dummy key and accessing the methods via prototype (or we extract them).
// Since the methods are private, we use a thin wrapper approach: import the
// class and cast to `any` to reach private methods.

import { AIAnalyzer } from '../analyzer.js';

function makeAnalyzer(): any {
  // Constructor needs an API key — we never call the real API in tests
  return new AIAnalyzer('fake-key');
}

describe('AIAnalyzer.parseIntentResponse', () => {
  const analyzer = makeAnalyzer();

  it('parses valid JSON response', () => {
    const input = JSON.stringify({
      what: 'Add user authentication',
      why: 'Security requirement',
      architecturalImpact: 'Adds middleware layer',
      confidence: 0.9,
    });
    const result = analyzer.parseIntentResponse(input);
    expect(result.what).toBe('Add user authentication');
    expect(result.why).toBe('Security requirement');
    expect(result.architecturalImpact).toBe('Adds middleware layer');
    expect(result.confidence).toBe(0.9);
  });

  it('handles JSON wrapped in markdown code blocks', () => {
    const input =
      '```json\n{"what":"feature","why":"because","architecturalImpact":"low","confidence":0.8}\n```';
    const result = analyzer.parseIntentResponse(input);
    expect(result.what).toBe('feature');
    expect(result.confidence).toBe(0.8);
  });

  it('extracts JSON embedded in extra text', () => {
    const input =
      'Here is my analysis:\n{"what":"test","why":"testing","architecturalImpact":"none","confidence":0.7}\nHope this helps!';
    const result = analyzer.parseIntentResponse(input);
    expect(result.what).toBe('test');
    expect(result.confidence).toBe(0.7);
  });

  it('provides defaults for missing fields', () => {
    const input = JSON.stringify({ what: 'partial' });
    const result = analyzer.parseIntentResponse(input);
    expect(result.what).toBe('partial');
    expect(result.why).toBe('Unable to determine');
    expect(result.architecturalImpact).toBe('Unknown impact');
    expect(result.confidence).toBe(0.5);
  });

  it('returns fallback for completely invalid JSON', () => {
    const result = analyzer.parseIntentResponse('this is not json at all');
    expect(result.what).toContain('Unable to analyze');
    expect(result.confidence).toBe(0.1);
  });

  it('handles empty string', () => {
    const result = analyzer.parseIntentResponse('');
    expect(result.what).toContain('Unable to analyze');
    expect(result.confidence).toBe(0.1);
  });

  it('handles non-numeric confidence gracefully', () => {
    const input = JSON.stringify({
      what: 'x',
      why: 'y',
      architecturalImpact: 'z',
      confidence: 'high',
    });
    const result = analyzer.parseIntentResponse(input);
    expect(result.confidence).toBe(0.5); // default when not a number
  });
});

describe('AIAnalyzer.parseRelationshipResponse', () => {
  const analyzer = makeAnalyzer();

  const features = [{ id: 'feat-a' }, { id: 'feat-b' }, { id: 'feat-c' }];

  it('parses valid relationship array', () => {
    const input = JSON.stringify([
      { from: 0, to: 1, relationship: 'conflicts-with', description: 'Both edit auth' },
      { from: 1, to: 2, relationship: 'depends-on', description: 'B needs C' },
    ]);
    const map = analyzer.parseRelationshipResponse(input, features);
    expect(map.get('feat-a')).toHaveLength(1);
    expect(map.get('feat-a')![0].relationship).toBe('conflicts-with');
    expect(map.get('feat-b')).toHaveLength(1);
  });

  it('handles markdown-wrapped JSON array', () => {
    const input =
      '```json\n[{"from":0,"to":2,"relationship":"related-to","description":"both UI"}]\n```';
    const map = analyzer.parseRelationshipResponse(input, features);
    expect(map.get('feat-a')).toHaveLength(1);
    expect(map.get('feat-a')![0].featureId).toBe('feat-c');
  });

  it('skips invalid indices gracefully', () => {
    const input = JSON.stringify([
      { from: 0, to: 99, relationship: 'depends-on', description: 'bad ref' },
    ]);
    const map = analyzer.parseRelationshipResponse(input, features);
    // Should not crash, just skip the invalid entry
    expect(map.size).toBe(0);
  });

  it('returns empty map for invalid JSON', () => {
    const map = analyzer.parseRelationshipResponse('not json', features);
    expect(map.size).toBe(0);
  });

  it('returns empty map for empty array', () => {
    const map = analyzer.parseRelationshipResponse('[]', features);
    expect(map.size).toBe(0);
  });
});
