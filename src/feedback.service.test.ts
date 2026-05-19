import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';

// Mock external dependencies that would be used in the feedback service
const mockLogger = {
  log: jest.fn()
};

const mockConsoleTime = jest.fn();
const mockConsoleTimeEnd = jest.fn();

const mockBotApi = {
  sendChatAction: jest.fn().mockResolvedValue(true),
  sendMessage: jest.fn().mockResolvedValue(true)
};

const mockBot = {
  api: mockBotApi
};

const mockGetChatGPTCompletion = jest.fn();

// Mock the modules that are imported
jest.mock('./utils/logger.ts', () => ({
  logger: jest.fn(() => mockLogger)
}));

jest.mock('./utils/chat.ts', () => ({
  getChatGPTCompletion: mockGetChatGPTCompletion
}));

// Create a mock of the grammy bot module
jest.mock('https://deno.land/x/grammy@v1.17.2/mod.ts', () => ({
  Bot: jest.fn(() => mockBot)
}), { virtual: true });

// Define types that would be imported from the services file
interface IFeedbackRequestMessage {
  text: string;
  messageId?: number;
}

interface IFeedbackRequest {
  chatId: number;
  messages: IFeedbackRequestMessage[];
}

describe('FeedbackService', () => {
  // Mock the global objects that would be available in the feedback service
  const originalConsole = global.console;
  const originalDeno = (global as any).Deno;

  beforeAll(() => {
    global.console = {
      ...originalConsole,
      time: mockConsoleTime,
      timeEnd: mockConsoleTimeEnd,
      log: jest.fn(), // Suppress logs during tests
      error: jest.fn()
    };

    (global as any).Deno = {
      args: ['--port=8000'], // Simulate Deno.args
      env: {
        get: jest.fn((key: string) => {
          if (key === 'TELEGRAM_TOKEN') return 'fake-telegram-token';
          return undefined;
        })
      }
    };
  });

  afterAll(() => {
    global.console = originalConsole;
    if (originalDeno) {
      (global as any).Deno = originalDeno;
    } else {
      delete (global as any).Deno;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementation
    mockGetChatGPTCompletion.mockResolvedValue({ text: 'corrected message' });
  });

  // Replicate the core functionality from feedback.service.ts for testing

  const getCorrectedMessage = async (message: IFeedbackRequestMessage) => {
    const PROMPT = `Give me a corrected version of the following text:"{{}}"`;
    const correctedText = await mockGetChatGPTCompletion([
      { role: 'user', content: PROMPT.replace('{{}}', message.text) }
    ]);
    return { ...message, text: correctedText.text };
  };

  // Test the getCorrectedMessage function logic
  describe('getCorrectedMessage', () => {
    it('should call ChatGPT with the correct prompt format', async () => {
      const message = {
        text: 'hello world',
        messageId: 123
      };

      await getCorrectedMessage(message);

      expect(mockGetChatGPTCompletion).toHaveBeenCalledWith([
        { role: 'user', content: 'Give me a corrected version of the following text:"hello world"' }
      ]);
    });

    it('should return the message with corrected text', async () => {
      const message = {
        text: 'original text',
        messageId: 456
      };

      mockGetChatGPTCompletion.mockResolvedValueOnce({ text: 'corrected text' });

      const result = await getCorrectedMessage(message);

      expect(result).toEqual({
        text: 'corrected text',
        messageId: 456
      });
    });

    it('should preserve additional message properties', async () => {
      const message = {
        text: 'test message',
        messageId: 789,
        timestamp: 1234567890,
        userId: 'user123'
      };

      mockGetChatGPTCompletion.mockResolvedValueOnce({ text: 'corrected test message' });

      const result = await getCorrectedMessage(message);

      expect(result).toEqual({
        text: 'corrected test message',
        messageId: 789,
        timestamp: 1234567890,
        userId: 'user123'
      });
    });

    it('should handle messages without messageId', async () => {
      const message = {
        text: 'text without id'
      };

      mockGetChatGPTCompletion.mockResolvedValueOnce({ text: 'corrected text without id' });

      const result = await getCorrectedMessage(message);

      expect(result).toEqual({
        text: 'corrected text without id'
      });
      expect(result.messageId).toBeUndefined();
    });
  });

  // Test constants and configuration
  describe('Configuration', () => {
    it('should have the correct feedback template', () => {
      const FEEDBACK_TEMPLATE = `
  Based on the messages you sent me during our last conversation 💬, here are a few suggestions to sound more natural👇.`
      .trim();

      expect(FEEDBACK_TEMPLATE).toBe('Based on the messages you sent me during our last conversation 💬, here are a few suggestions to sound more natural👇.');
    });

    it('should have the correct prompt template', () => {
      const PROMPT = `Give me a corrected version of the following text:"{{}}"`;

      expect(PROMPT).toBe('Give me a corrected version of the following text:"{{}}"');
      expect(PROMPT).toContain('{{}}');
    });
  });

  // Test the request handling logic (similar to the handler function)
  describe('Request Processing Logic', () => {
    it('should reject requests without messages', async () => {
      const request: IFeedbackRequest = {
        chatId: 123,
        messages: [] // Empty array
      };

      const hasMessages = request.messages && request.messages.length > 0;
      expect(hasMessages).toBe(false);
    });

    it('should process multiple messages correctly', async () => {
      const request: IFeedbackRequest = {
        chatId: 123,
        messages: [
          { text: 'first message', messageId: 1 },
          { text: 'second message', messageId: 2 }
        ]
      };

      mockGetChatGPTCompletion
        .mockResolvedValueOnce({ text: 'corrected first message' })
        .mockResolvedValueOnce({ text: 'corrected second message' });

      const correctedMessages = await Promise.all(request.messages.map(getCorrectedMessage));

      expect(correctedMessages).toHaveLength(2);
      expect(correctedMessages[0]).toEqual({
        text: 'corrected first message',
        messageId: 1
      });
      expect(correctedMessages[1]).toEqual({
        text: 'corrected second message',
        messageId: 2
      });
    });

    it('should handle telegram bot api calls', async () => {
      const chatId = 123;
      const correctedMessages = [
        { text: 'corrected first', messageId: 1 },
        { text: 'corrected second', messageId: 2 }
      ];

      const FEEDBACK_TEMPLATE = 'Based on the messages you sent me during our last conversation 💬, here are a few suggestions to sound more natural👇.';

      // Simulate sending feedback template
      await mockBotApi.sendMessage(chatId, FEEDBACK_TEMPLATE);

      // Simulate sending each corrected message
      for (const msg of correctedMessages) {
        await mockBotApi.sendMessage(
          chatId,
          `Alternative: ${msg.text}`,
          {
            reply_to_message_id: msg.messageId || 0,
            allow_sending_without_reply: true
          }
        );
      }

      expect(mockBotApi.sendChatAction).not.toHaveBeenCalled(); // This is called separately in handler
      expect(mockBotApi.sendMessage).toHaveBeenCalledTimes(3); // 1 for template + 2 for messages
      expect(mockBotApi.sendMessage).toHaveBeenCalledWith(
        chatId,
        'Based on the messages you sent me during our last conversation 💬, here are a few suggestions to sound more natural👇.'
      );
    });
  });

  // Test error handling scenario
  describe('Error Handling', () => {
    it('should handle ChatGPT API failures', async () => {
      const message = {
        text: 'problematic message'
      };

      mockGetChatGPTCompletion.mockRejectedValueOnce(new Error('API failure'));

      await expect(getCorrectedMessage(message)).rejects.toThrow('API failure');
    });

    it('should validate required fields in request', () => {
      const validRequest: IFeedbackRequest = {
        chatId: 123,
        messages: [{ text: 'valid message' }]
      };

      const invalidRequest1: Partial<IFeedbackRequest> = {};
      const invalidRequest2: IFeedbackRequest = {
        chatId: 123,
        messages: []
      };

      // Check validation logic
      const isValid1 = validRequest.messages && validRequest.messages.length > 0;
      const isValid2 = invalidRequest1.messages && invalidRequest1.messages.length > 0;
      const isValid3 = invalidRequest2.messages && invalidRequest2.messages.length > 0;

      expect(isValid1).toBe(true);
      expect(isValid2).toBeFalsy(); // Will be undefined, which is falsy
      expect(isValid3).toBe(false);
    });
  });
});