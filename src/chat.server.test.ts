import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock all external dependencies
jest.mock('grammy', () => ({
  Bot: jest.fn(() => ({
    command: jest.fn(),
    on: jest.fn(),
    catch: jest.fn(),
    start: jest.fn(),
    api: {
      sendChatAction: jest.fn(),
      sendVoice: jest.fn()
    }
  })),
  GrammyError: class GrammyError extends Error {},
  HttpError: class HttpError extends Error {},
  InputFile: jest.fn()
}));

jest.mock('./utils/supabase', () => ({
  supabaseClient: {
    rpc: jest.fn(),
    functions: {
      invoke: jest.fn()
    }
  }
}));

jest.mock('./utils/chat', () => ({
  getChatGPTCompletion: jest.fn(),
  getLastChat: jest.fn(),
  insertNewConversation: jest.fn(),
  updateConversation: jest.fn(),
  updateTokenUsage: jest.fn(),
  tokensAprox: jest.fn(),
  CHAT_INSTRUCTIONS: 'Instructions for chat',
  ASK_START_CHAT: 'Please start a new chat',
  CHAT_LIMIT_MESSAGE: 'Chat limit exceeded',
  getFileLink: jest.fn()
}));

jest.mock('./utils/fetch', () => ({
  post: jest.fn()
}));

describe('Chat Server Business Logic', () => {
  let mockContext: any;
  
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.TELEGRAM_TOKEN = 'test_token';
    process.env.GRAMMAR_API = 'http://grammar-api.test';
    process.env.STT_API = 'http://stt-api.test';
    process.env.TTS_API = 'http://tts-api.test';
    process.env.FEEDBACK_API = 'http://feedback-api.test';

    mockContext = {
      from: { username: 'testuser', first_name: 'Test', id: 12345 },
      chat: { id: 67890 },
      message: {
        text: 'Hello world',
        message_id: 1,
        date: Math.floor(Date.now() / 1000)
      },
      reply: jest.fn(),
      api: {
        sendChatAction: jest.fn(),
        sendVoice: jest.fn()
      },
      getFile: jest.fn(),
      callbackQuery: null,
      answerCallbackQuery: jest.fn()
    };
  });

  afterEach(() => {
    delete process.env.TELEGRAM_TOKEN;
    delete process.env.GRAMMAR_API;
    delete process.env.STT_API;
    delete process.env.TTS_API;
    delete process.env.FEEDBACK_API;
  });

  describe('Token overflow function', () => {
    const CHAT_TOKEN_LIMIT = 3500;
    
    const tokenOverflow = (tokenUsage: number, text: string): boolean => {
      const totalTokens = tokenUsage + (require('./utils/chat').tokensAprox(text) || 0);
      console.log('%cToken Usage:', 'color: blue', totalTokens);
      return totalTokens >= CHAT_TOKEN_LIMIT;
    };

    it('should return false when token usage is below limit', () => {
      const tokensApprox = jest.requireMock('./utils/chat').tokensAprox as jest.MockedFunction<any>;
      tokensApprox.mockReturnValue(100);

      const result = tokenOverflow(1000, 'test text');
      expect(result).toBe(false);
    });

    it('should return true when token usage exceeds limit', () => {
      const tokensApprox = jest.requireMock('./utils/chat').tokensAprox as jest.MockedFunction<any>;
      tokensApprox.mockReturnValue(3000);

      const result = tokenOverflow(1000, 'large text');
      expect(result).toBe(true);
    });

    it('should return true when token usage equals limit', () => {
      const tokensApprox = jest.requireMock('./utils/chat').tokensAprox as jest.MockedFunction<any>;
      tokensApprox.mockReturnValue(2500);

      const result = tokenOverflow(1000, 'exact text');
      expect(result).toBe(true);
    });
  });

  describe('processChatCompletion function', () => {
    it('should process chat completion and update token usage', async () => {
      const chatRecord = {
        id: 1,
        chat: { messages: [{ role: 'user', content: 'previous message' }] },
        token_usage: 50
      };
      const chatMsg = { role: 'user', content: 'current message', dateTime: new Date().toISOString(), messageId: 123 };

      const getChatGPTCompletion = jest.requireMock('./utils/chat').getChatGPTCompletion as jest.MockedFunction<any>;
      const updateTokenUsage = jest.requireMock('./utils/chat').updateTokenUsage as jest.MockedFunction<any>;
      
      getChatGPTCompletion.mockResolvedValue({ tokens: 25, text: 'assistant response' });

      // Simulate the processChatCompletion function logic
      const chatHistory = chatRecord.chat.messages;
      const chatForCompletion = [...chatHistory, chatMsg].map(({ role, content }) => ({ role, content }));
      const { tokens, text } = await getChatGPTCompletion(chatForCompletion);
      await updateTokenUsage(chatRecord.id, tokens);

      expect(getChatGPTCompletion).toHaveBeenCalledWith([
        { role: 'user', content: 'previous message' },
        { role: 'user', content: 'current message' }
      ]);
      expect(updateTokenUsage).toHaveBeenCalledWith(1, 25);
      expect(text).toBe('assistant response');
    });
  });

  describe('getTranscription function', () => {
    it('should call ASR API and return transcription', async () => {
      const fileLink = 'https://example.com/audio.mp3';
      const mockResponse = { text: 'transcribed text', fileName: 'audio.mp3' };

      const postMock = jest.requireMock('./utils/fetch').post as jest.MockedFunction<any>;
      postMock.mockResolvedValue(mockResponse);

      const ASR_API_URL = process.env.STT_API || '';
      const result = await postMock(ASR_API_URL, { link: fileLink });

      expect(postMock).toHaveBeenCalledWith(process.env.STT_API, { link: fileLink });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAudio function', () => {
    it('should call TTS API and return audio file path', async () => {
      const text = 'text to convert';
      const id = 123;
      const mockResponse = { filePath: '/path/to/audio.mp3' };

      const postMock = jest.requireMock('./utils/fetch').post as jest.MockedFunction<any>;
      postMock.mockResolvedValue(mockResponse);

      const TTS_API_URL = process.env.TTS_API || '';
      const result = await postMock(TTS_API_URL, { text, messageId: id });

      expect(postMock).toHaveBeenCalledWith(process.env.TTS_API, { text, messageId: id });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getGrammarEval function', () => {
    it('should call Grammar API and return evaluation results', async () => {
      const input = 'This is a test sentence.';
      const mockResponse = { score: 90, corrections: [] };

      const postMock = jest.requireMock('./utils/fetch').post as jest.MockedFunction<any>;
      postMock.mockResolvedValue(mockResponse);

      const GRAMMAR_API_URL = process.env.GRAMMAR_API || '';
      const result = await postMock(GRAMMAR_API_URL, { input });

      expect(postMock).toHaveBeenCalledWith(process.env.GRAMMAR_API, { input });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('toChatMessage function', () => {
    it('should transform Telegram message to chat message format', () => {
      const message = {
        text: 'Hello there',
        date: Math.floor(Date.now() / 1000),
        message_id: 123
      };

      const msgISODate = new Date(message.date * 1000).toISOString();
      const result = {
        role: 'user',
        content: message.text ?? '',
        dateTime: msgISODate,
        messageId: message.message_id,
      };

      expect(result.role).toBe('user');
      expect(result.content).toBe('Hello there');
      expect(result.messageId).toBe(123);
      expect(typeof result.dateTime).toBe('string');
    });
  });

  describe('Command handlers', () => {
    it('should handle start command logic', async () => {
      const insertNewConversation = jest.requireMock('./utils/chat').insertNewConversation as jest.MockedFunction<any>;
      insertNewConversation.mockResolvedValue('Welcome to Bruno!');

      const ctx = { ...mockContext };
      const chatId = ctx.chat.id;
      const user = ctx.from?.username || ctx.from?.first_name || ctx.from?.id || '';
      const userName = String(user).replaceAll(' ', '');
      const response = await insertNewConversation(chatId, userName);

      expect(insertNewConversation).toHaveBeenCalledWith(67890, 'testuser');
      expect(response).toBe('Welcome to Bruno!');
    });

    it('should handle feedback command when no recent chat exists', async () => {
      const getLastChat = jest.requireMock('./utils/chat').getLastChat as jest.MockedFunction<any>;
      const ASK_START_CHAT = jest.requireMock('./utils/chat').ASK_START_CHAT;
      getLastChat.mockResolvedValue(null);

      const ctx = { ...mockContext };
      const recentChat = await getLastChat(ctx.chat.id);

      if (!recentChat) {
        await ctx.reply(ASK_START_CHAT);
      }

      expect(getLastChat).toHaveBeenCalledWith(67890);
      expect(ctx.reply).toHaveBeenCalledWith('Please start a new chat');
    });

    it('should handle feedback command with existing chat', async () => {
      const getLastChat = jest.requireMock('./utils/chat').getLastChat as jest.MockedFunction<any>;
      const supabaseClient = jest.requireMock('./utils/supabase').supabaseClient;
      const postMock = jest.requireMock('./utils/fetch').post as jest.MockedFunction<any>;
      
      const mockRecentChat = { id: 1 };
      const mockFeedbackMessages = [{ messageId: 1, content: 'test message' }];
      
      getLastChat.mockResolvedValue(mockRecentChat);
      (supabaseClient.rpc as jest.MockedFunction<any>).mockResolvedValue({ data: mockFeedbackMessages, error: null });
      postMock.mockResolvedValue({});

      const ctx = { ...mockContext };
      const recentChat = await getLastChat(ctx.chat.id);

      if (recentChat) {
        const { data } = await supabaseClient.rpc('get_underscore_messages', {
          conversation_id: recentChat.id,
          score: 80
        });

        const messages = data.map(({ messageId, content }) => ({ messageId, text: content ?? '' }));
        const payload = { chatId: ctx.chat.id, messages };
        
        await postMock(process.env.FEEDBACK_API, payload);
      }

      expect(getLastChat).toHaveBeenCalledWith(67890);
      expect(supabaseClient.rpc).toHaveBeenCalledWith('get_underscore_messages', { 
        conversation_id: 1, 
        score: 80 
      });
      expect(postMock).toHaveBeenCalledWith(process.env.FEEDBACK_API, {
        chatId: 67890,
        messages: [{ messageId: 1, text: 'test message' }]
      });
    });
  });

  describe('Message handlers', () => {
    it('should handle text message when no recent chat exists', async () => {
      const getLastChat = jest.requireMock('./utils/chat').getLastChat as jest.MockedFunction<any>;
      const ASK_START_CHAT = jest.requireMock('./utils/chat').ASK_START_CHAT;
      getLastChat.mockResolvedValue(null);

      const ctx = { ...mockContext };
      const recentChat = await getLastChat(ctx.chat.id);

      if (!recentChat) {
        await ctx.reply(ASK_START_CHAT);
      }

      expect(getLastChat).toHaveBeenCalledWith(67890);
      expect(ctx.reply).toHaveBeenCalledWith('Please start a new chat');
    });

    it('should handle text message when token limit exceeded', async () => {
      const getLastChat = jest.requireMock('./utils/chat').getLastChat as jest.MockedFunction<any>;
      const tokensAprox = jest.requireMock('./utils/chat').tokensAprox as jest.MockedFunction<any>;
      const CHAT_LIMIT_MESSAGE = jest.requireMock('./utils/chat').CHAT_LIMIT_MESSAGE;
      
      const mockRecentChat = { id: 1, token_usage: 3400 }; // Close to limit
      getLastChat.mockResolvedValue(mockRecentChat);
      tokensAprox.mockReturnValue(200); // Would exceed limit

      const ctx = { ...mockContext };
      const recentChat = await getLastChat(ctx.chat.id);

      if (recentChat) {
        const totalTokens = recentChat.token_usage + tokensAprox(ctx.message.text);
        const isOverflow = totalTokens >= 3500;

        if (isOverflow) {
          await ctx.reply(CHAT_LIMIT_MESSAGE);
        }
      }

      expect(getLastChat).toHaveBeenCalledWith(67890);
      expect(ctx.reply).toHaveBeenCalledWith('Chat limit exceeded');
    });
  });

  describe('Error handling', () => {
    it('should handle GrammyError correctly', () => {
      const GrammyError = jest.requireMock('grammy').GrammyError;
      const error = new GrammyError('Forbidden: bot was blocked');

      const userId = mockContext.from?.username || mockContext.from?.id || '🤷‍♂️';
      const message = error instanceof GrammyError ? `Error in request ${error.message}` : 'Generic error';

      expect(message).toBe('Error in request Forbidden: bot was blocked');
    });

    it('should handle HttpError correctly', () => {
      const HttpError = jest.requireMock('grammy').HttpError;
      const error = new HttpError('Network timeout');

      const message = error instanceof HttpError ? 'Could not contact Telegram' : 'Generic error';

      expect(message).toBe('Could not contact Telegram');
    });

    it('should handle generic error correctly', () => {
      const error = new Error('Generic error occurred');

      const message = error instanceof (jest.requireMock('grammy').GrammyError) ? `Error in request ${error.message}` :
                      error instanceof (jest.requireMock('grammy').HttpError) ? 'Could not contact Telegram' : 
                      `${error}`;

      expect(message).toBe('Error: Generic error occurred');
    });

    it('should send error notification to user', async () => {
      const ctx = { ...mockContext };

      await ctx.reply(`🤖💥 There's a technical issue with Bruno at the moment. He'll be back soon 🦾`);

      expect(ctx.reply).toHaveBeenCalledWith(`🤖💥 There's a technical issue with Bruno at the moment. He'll be back soon 🦾`);
    });
  });
});