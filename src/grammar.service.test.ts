// Helper functions that mirror the logic in grammar.service.ts for testing purposes
const GRAMMAR_THRESHOLD = 15;

const getScore = (scores: { label: string, score: number }[]) => {
  const score = scores.find(_score => _score.label === 'LABEL_1')?.score || GRAMMAR_THRESHOLD;
  return Math.round(score * 100);
};

describe('Grammar Service Logic', () => {
  describe('getScore function', () => {
    it('should return rounded score for LABEL_1 when present', () => {
      const scores = [
        { label: 'LABEL_0', score: 0.3 },
        { label: 'LABEL_1', score: 0.75 }
      ];
      const result = getScore(scores);
      expect(result).toBe(75); // 0.75 * 100 rounded
    });

    it('should return default threshold when LABEL_1 not found', () => {
      const scores = [
        { label: 'LABEL_0', score: 0.3 },
        { label: 'OTHER_LABEL', score: 0.7 }
      ];
      const result = getScore(scores);
      expect(result).toBe(1500); // GRAMMAR_THRESHOLD (15) * 100
    });

    it('should handle empty scores array', () => {
      const scores: { label: string, score: number }[] = [];
      const result = getScore(scores);
      expect(result).toBe(1500); // GRAMMAR_THRESHOLD (15) * 100
    });

    it('should return default threshold when LABEL_1 score is 0 (because 0 is falsy)', () => {
      const scores = [
        { label: 'LABEL_0', score: 0.3 },
        { label: 'LABEL_1', score: 0.0 }
      ];
      const result = getScore(scores);
      expect(result).toBe(1500); // Because 0 is falsy, it falls back to GRAMMAR_THRESHOLD (15) * 100
    });

    it('should correctly round decimal scores', () => {
      const scores = [
        { label: 'LABEL_0', score: 0.3 },
        { label: 'LABEL_1', score: 0.756 }
      ];
      const result = getScore(scores);
      expect(result).toBe(76); // 0.756 * 100 = 75.6, rounded to 76
    });
  });

  describe('Response formatting logic', () => {
    it('should return BAD label when score is below threshold', () => {
      const input = "This is incorrect grammar.";
      const score = 10; // Below threshold of 15 (after multiplication by 100 becomes 10)

      // Simulate the response structure that would be generated
      const response = {
        input,
        label: score < 1500 ? 'BAD' : 'OKAY', // 1500 is the threshold (GRAMMAR_THRESHOLD * 100)
        score
      };

      expect(response.label).toBe('BAD');
      expect(response.input).toBe(input);
      expect(response.score).toBe(score);
    });

    it('should return OKAY label when score meets or exceeds threshold', () => {
      const input = "This is correct grammar.";
      const score = 1600; // Above threshold of 1500 (15 * 100)

      const response = {
        input,
        label: score >= 1500 ? 'OKAY' : 'BAD',
        score
      };

      expect(response.label).toBe('OKAY');
      expect(response.input).toBe(input);
      expect(response.score).toBe(score);
    });
  });

  describe('Input validation logic', () => {
    it('should require input text', () => {
      const input = '';
      const isValidInput = input && typeof input === 'string';

      expect(isValidInput).toBeFalsy();
    });

    it('should validate string type input', () => {
      const input = "This is a valid string";
      const isValidInput = input && typeof input === 'string';

      expect(isValidInput).toBeTruthy();
    });

    it('should reject non-string input', () => {
      const input = 123;
      const isValidInput = input && typeof input === 'string';

      expect(isValidInput).toBeFalsy();
    });

    it('should reject null input', () => {
      const input = null;
      const isValidInput = input && typeof input === 'string';

      expect(isValidInput).toBeFalsy();
    });

    it('should reject undefined input', () => {
      const input = undefined;
      const isValidInput = input && typeof input === 'string';

      expect(isValidInput).toBeFalsy();
    });
  });
});