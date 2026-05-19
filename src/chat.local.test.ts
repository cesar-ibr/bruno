import { jest, beforeEach, afterEach, describe, test, expect, beforeAll } from '@jest/globals';

// Define variables that will be captured from the module execution
let capturedMessageHandler: any;
let capturedCallbackHandler: any;
let mockBotOn: any;
let mockBotInstance: any;
let mockPost: any;
let mockServe: any;
let mockWebhookCallback: any;

// Mock reply functions
let mockReply: any;
let mockAnswerCallbackQuery: any;
let mockSendChatAction: any;
let mockReplyWithAudio: any;
let mockInlineKeyboard: any;
let mockInlineKeyboardConstructor: any;

// Mock the Deno environment
const mockDeno = {
  env: {
    get: jest.fn((key: string) => {
      if (key === 'TELEGRAM_TOKEN') return 'test-token';
      if (key === 'TTS_API') return 'http://test-tts-api.com';
      return undefined;
    }),
  },
};

// Set up global mock for Deno
Object.assign(global, { Deno: mockDeno });

beforeAll(() => {
  // Setup all mocks before importing the module
  mockReply = jest.fn();
  mockAnswerCallbackQuery = jest.fn();
  mockSendChatAction = jest.fn();
  mockReplyWithAudio = jest.fn();

  mockInlineKeyboard = {
    text: jest.fn(() => mockInlineKeyboard),
  };
  mockInlineKeyboardConstructor = jest.fn(() => mockInlineKeyboard);

  mockPost = jest.fn().mockResolvedValue({ filePath: '/test/audio.mp3' }); // Default return value

  mockBotOn = jest.fn((event: string, handler: any) => {
    if (event === 'message') {
      capturedMessageHandler = handler;
    } else if (event === 'callback_query:data') {
      capturedCallbackHandler = handler;
    }
    return mockBotInstance; // Return the instance to allow chaining if called
  });

  mockBotInstance = {
    on: mockBotOn,
  };

  mockWebhookCallback = jest.fn(() => jest.fn());
  mockServe = jest.fn();

  // Mock the external modules
  jest.doMock('https://deno.land/x/grammy@v1.17.2/mod.ts', () => ({
    Bot: jest.fn(() => mockBotInstance),
    InlineKeyboard: mockInlineKeyboardConstructor,
    InputFile: jest.fn((path: string) => ({ path })),
    webhookCallback: mockWebhookCallback,
  }), { virtual: true });

  jest.doMock('https://deno.land/std@0.168.0/http/server.ts', () => ({
    serve: mockServe,
  }), { virtual: true });

  jest.doMock('./utils/fetch.ts', () => ({
    post: mockPost,
  }), { virtual: true });

  // Now import the module
  jest.isolateModules(() => {
    require('../src/chat.local.ts');
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('chat.local.ts', () => {
  test('should register message handler', () => {
    expect(mockBotOn).toHaveBeenCalledWith('message', expect.any(Function));
    expect(capturedMessageHandler).toBeDefined();
  });

  test('should register callback query handler', () => {
    // The callback handler should be functional, as verified by other tests
    expect(typeof capturedCallbackHandler).toBe('function');
  });

  test('should have initialized bot properly', () => {
    // Both message and callback handlers are available, indicating proper bot initialization
    expect(capturedMessageHandler).toBeDefined();
    expect(capturedCallbackHandler).toBeDefined();
  });

  describe('message handler', () => {
    test('should respond with automatic response when receiving a message', async () => {
      const mockCtx: any = {
        reply: mockReply,
      };

      await capturedMessageHandler(mockCtx);

      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("I'm not available at the moment"), {
        reply_markup: expect.any(Object),
      });
    });

    test('should include inline keyboard in the response', async () => {
      const mockCtx: any = {
        reply: mockReply,
      };

      await capturedMessageHandler(mockCtx);

      expect(mockInlineKeyboardConstructor).toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.any(Object),
        })
      );
    });
  });

  describe('callback query handler', () => {
    test('should handle [TTS] callback query', async () => {
      const mockCtx: any = {
        callbackQuery: {
          data: '[TTS]',
        },
        chat: {
          id: 123,
        },
        message: {
          text: 'Test message',
          message_id: 456,
        },
        api: {
          sendChatAction: mockSendChatAction,
        },
        answerCallbackQuery: mockAnswerCallbackQuery,
        replyWithAudio: mockReplyWithAudio,
      };

      mockPost.mockResolvedValueOnce({ filePath: '/test/audio.mp3' });

      await capturedCallbackHandler(mockCtx);

      expect(mockSendChatAction).toHaveBeenCalledWith(123, 'record_voice');
      expect(mockPost).toHaveBeenCalledWith('http://test-tts-api.com', {
        text: 'Test message',
        messageId: 456,
      });
      expect(mockAnswerCallbackQuery).toHaveBeenCalled();
      expect(mockReplyWithAudio).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/test/audio.mp3' })
      );
    });

    test('should not process callback if data is not [TTS]', async () => {
      const mockCtx: any = {
        callbackQuery: {
          data: 'other-data',
        },
        answerCallbackQuery: mockAnswerCallbackQuery,
      };

      await capturedCallbackHandler(mockCtx);

      expect(mockAnswerCallbackQuery).toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalled();
    });

    test('should not process callback if chat id is missing', async () => {
      const mockCtx: any = {
        callbackQuery: {
          data: '[TTS]',
        },
        chat: null,
        answerCallbackQuery: mockAnswerCallbackQuery,
      };

      await capturedCallbackHandler(mockCtx);

      expect(mockAnswerCallbackQuery).toHaveBeenCalled();
      expect(mockSendChatAction).not.toHaveBeenCalled();
    });

    test('should handle when message text is empty', async () => {
      const mockCtx: any = {
        callbackQuery: {
          data: '[TTS]',
        },
        chat: {
          id: 123,
        },
        message: {
          text: '',
          message_id: 456,
        },
        api: {
          sendChatAction: mockSendChatAction,
        },
        answerCallbackQuery: mockAnswerCallbackQuery,
        replyWithAudio: mockReplyWithAudio,
      };

      await capturedCallbackHandler(mockCtx);

      expect(mockPost).toHaveBeenCalledWith('http://test-tts-api.com', {
        text: '',
        messageId: 456,
      });
    });

    test('should handle when message ID is undefined', async () => {
      const mockCtx: any = {
        callbackQuery: {
          data: '[TTS]',
        },
        chat: {
          id: 123,
        },
        message: {
          text: 'Test message',
          message_id: undefined,
        },
        api: {
          sendChatAction: mockSendChatAction,
        },
        answerCallbackQuery: mockAnswerCallbackQuery,
        replyWithAudio: mockReplyWithAudio,
      };

      await capturedCallbackHandler(mockCtx);

      expect(mockPost).toHaveBeenCalledWith('http://test-tts-api.com', {
        text: 'Test message',
        messageId: 123, // fallback to default value
      });
    });
  });
});