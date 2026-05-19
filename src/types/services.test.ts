import {
  IGrammarRequest,
  IGrammarResponse,
  IASRResponse,
  ITTSResponse,
  IFeedbackRequestMessage,
  IFeedbackRequest
} from './services';

describe('Service Types', () => {
  describe('IGrammarRequest', () => {
    it('should have the correct shape', () => {
      const mockRequest: IGrammarRequest = {
        input: 'test input'
      };

      expect(mockRequest).toHaveProperty('input');
      expect(typeof mockRequest.input).toBe('string');
    });

    it('should accept a valid IGrammarRequest object', () => {
      const request: IGrammarRequest = {
        input: 'This is a sample text for grammar checking.'
      };

      expect(request).toEqual({
        input: 'This is a sample text for grammar checking.'
      });
    });
  });

  describe('IGrammarResponse', () => {
    it('should have the required properties', () => {
      const mockResponse: IGrammarResponse = {
        input: 'test input',
        label: 'CORRECT',
        score: 0.95
      };

      expect(mockResponse).toHaveProperty('input');
      expect(mockResponse).toHaveProperty('label');
      expect(mockResponse).toHaveProperty('score');
      expect(typeof mockResponse.input).toBe('string');
      expect(typeof mockResponse.label).toBe('string');
      expect(typeof mockResponse.score).toBe('number');
    });

    it('should allow optional properties', () => {
      // Without optional fields
      const responseWithoutOptional: IGrammarResponse = {
        input: 'test',
        label: 'CORRECT',
        score: 0.95
      };

      // With optional fields
      const responseWithOptional: IGrammarResponse = {
        input: 'test',
        label: 'INCORRECT',
        score: 0.5,
        output: 'corrected text',
        outputScore: 0.8
      };

      expect(responseWithoutOptional).toEqual({
        input: 'test',
        label: 'CORRECT',
        score: 0.95
      });

      expect(responseWithOptional).toEqual({
        input: 'test',
        label: 'INCORRECT',
        score: 0.5,
        output: 'corrected text',
        outputScore: 0.8
      });
    });

    it('should handle optional output and outputScore fields', () => {
      const response: IGrammarResponse = {
        input: 'original text',
        label: 'NEEDS_IMPROVEMENT',
        score: 0.7,
        output: 'improved text',
        // outputScore is omitted
      };

      expect(response.input).toBe('original text');
      expect(response.label).toBe('NEEDS_IMPROVEMENT');
      expect(response.score).toBe(0.7);
      expect(response.output).toBe('improved text');
      expect(response.outputScore).toBeUndefined();
    });
  });

  describe('IASRResponse', () => {
    it('should have the correct shape', () => {
      const mockResponse: IASRResponse = {
        text: 'converted text',
        fileName: 'audio_file.mp3'
      };

      expect(mockResponse).toHaveProperty('text');
      expect(mockResponse).toHaveProperty('fileName');
      expect(typeof mockResponse.text).toBe('string');
      expect(typeof mockResponse.fileName).toBe('string');
    });

    it('should accept a valid IASRResponse object', () => {
      const response: IASRResponse = {
        text: 'This is the transcribed audio content.',
        fileName: 'recording.wav'
      };

      expect(response).toEqual({
        text: 'This is the transcribed audio content.',
        fileName: 'recording.wav'
      });
    });
  });

  describe('ITTSResponse', () => {
    it('should have the correct shape', () => {
      const mockResponse: ITTSResponse = {
        filePath: '/path/to/generated/audio.mp3'
      };

      expect(mockResponse).toHaveProperty('filePath');
      expect(typeof mockResponse.filePath).toBe('string');
    });

    it('should accept a valid ITTSResponse object', () => {
      const response: ITTSResponse = {
        filePath: '/output/audio/speech.mp3'
      };

      expect(response).toEqual({
        filePath: '/output/audio/speech.mp3'
      });
    });
  });

  describe('IFeedbackRequestMessage', () => {
    it('should have optional messageId and required text', () => {
      // Without optional messageId
      const messageWithoutId: IFeedbackRequestMessage = {
        text: 'This is feedback text'
      };

      // With optional messageId
      const messageWithId: IFeedbackRequestMessage = {
        messageId: 123,
        text: 'This is feedback text with ID'
      };

      expect(messageWithoutId).toEqual({
        text: 'This is feedback text'
      });

      expect(messageWithId).toEqual({
        messageId: 123,
        text: 'This is feedback text with ID'
      });
    });

    it('should validate the property types', () => {
      const message: IFeedbackRequestMessage = {
        messageId: 42,
        text: 'Sample feedback message'
      };

      expect(typeof message.text).toBe('string');
      expect(typeof message.messageId).toBe('number');
    });
  });

  describe('IFeedbackRequest', () => {
    it('should have required chatId and messages array', () => {
      const mockRequest: IFeedbackRequest = {
        chatId: 123,
        messages: [
          { text: 'first message' },
          { messageId: 1, text: 'second message' }
        ]
      };

      expect(mockRequest).toHaveProperty('chatId');
      expect(mockRequest).toHaveProperty('messages');
      expect(typeof mockRequest.chatId).toBe('number');
      expect(Array.isArray(mockRequest.messages)).toBe(true);
      expect(mockRequest.messages.length).toBe(2);
    });

    it('should accept a valid IFeedbackRequest object', () => {
      const request: IFeedbackRequest = {
        chatId: 456,
        messages: [
          { text: 'Feedback about the first message' },
          { messageId: 789, text: 'Feedback about message #789' }
        ]
      };

      expect(request).toEqual({
        chatId: 456,
        messages: [
          { text: 'Feedback about the first message' },
          { messageId: 789, text: 'Feedback about message #789' }
        ]
      });
    });

    it('should allow empty messages array', () => {
      const request: IFeedbackRequest = {
        chatId: 789,
        messages: []
      };

      expect(request).toEqual({
        chatId: 789,
        messages: []
      });
    });
  });
});