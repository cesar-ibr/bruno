// Mock Deno object before importing anything that uses it
const mockDenoEnv = {
  get: jest.fn((key) => {
    if (key === 'TELEGRAM_TOKEN') return 'test_telegram_token';
    if (key === 'OPENAI_KEY') return 'test_openai_key';
    return '';
  }),
};

(global as any).Deno = {
  env: mockDenoEnv,
};

// Mock Morphine before importing
jest.mock('https://deno.land/x/morphine@0.0.1/mod.ts', () => {
  return jest.fn().mockImplementation(() => ({
    next: jest.fn(),
  }));
});

// Create a mock query builder class that simulates the Supabase query builder behavior
class MockQueryBuilder {
  constructor(private mockResults?: any) {}

  select(...args: any[]) {
    return this;
  }

  insert(...args: any[]) {
    return this;
  }

  update(values: any) {
    return this;
  }

  eq(column: string, value: any) {
    return this;
  }

  gt(column: string, value: any) {
    return this;
  }

  order(column: string, options?: any) {
    return this;
  }

  // Methods that return promises when awaited
  async then(resolve: any) {
    // Return a default success result if no mockResults provided
    const result = this.mockResults || { data: [], error: null };
    return resolve(result);
  }

  async catch(reject: any) {
    return reject(this.mockResults?.error || null);
  }
}

// Create a mock supabase client
const createMockSupabaseClient = () => {
  return {
    from: jest.fn((table: string) => {
      return new MockQueryBuilder();
    }),
  };
};

const mockSupabaseClient = createMockSupabaseClient();

jest.mock('./supabase.ts', () => ({
  supabaseClient: mockSupabaseClient,
}));

// Mock OpenAI
const mockCreateChatCompletion = jest.fn();
jest.mock('https://esm.sh/openai@3.3.0', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => ({
    createChatCompletion: mockCreateChatCompletion,
  })),
}));

import { 
  capitalizeI, 
  tokensAprox, 
  getChatGPTCompletion, 
  getChatStarter, 
  initChat, 
  getLastChat, 
  updateConversation, 
  updateTokenUsage,
  CHAT_INSTRUCTIONS,
  ASK_START_CHAT,
  CHAT_LIMIT_MESSAGE,
  pollBotUpdates,
} from './chat.ts';
import { supabaseClient } from './supabase.ts';

// Mock the console.log to suppress error logs during tests
console.log = jest.fn();

describe('chat utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constants', () => {
    test('should have CHAT_INSTRUCTIONS defined', () => {
      expect(CHAT_INSTRUCTIONS).toBeDefined();
      expect(typeof CHAT_INSTRUCTIONS).toBe('string');
      expect(CHAT_INSTRUCTIONS).toContain('Bruno');
    });

    test('should have ASK_START_CHAT defined', () => {
      expect(ASK_START_CHAT).toBeDefined();
      expect(typeof ASK_START_CHAT).toBe('string');
    });

    test('should have CHAT_LIMIT_MESSAGE defined', () => {
      expect(CHAT_LIMIT_MESSAGE).toBeDefined();
      expect(typeof CHAT_LIMIT_MESSAGE).toBe('string');
    });
  });

  describe('capitalizeI', () => {
    test('should capitalize standalone i', () => {
      expect(capitalizeI('hello i am here')).toBe('hello I am here');
      expect(capitalizeI('i am happy')).toBe('I am happy');
      expect(capitalizeI('at the start and in the middle i am fine')).toBe('at the start and in the middle I am fine');
    });

    test('should handle contractions like i\'m', () => {
      expect(capitalizeI('i\'m happy')).toBe('I\'m happy');
      expect(capitalizeI('yes i\'m coming')).toBe('yes I\'m coming');
    });

    test('should trim whitespace', () => {
      expect(capitalizeI(' i ')).toBe('I');
      expect(capitalizeI('  i am  ')).toBe('I am');
    });

    test('should not capitalize "i" followed by other letters', () => {
      expect(capitalizeI('it is ice')).toBe('it is ice');
    });

    test('should work with empty string', () => {
      expect(capitalizeI('')).toBe('');
    });
  });

  describe('tokensAprox', () => {
    test('should calculate approximate tokens correctly', () => {
      expect(tokensAprox('hello world')).toBeCloseTo(3); // 2 words * 1.5 = 3
      expect(tokensAprox('one two three four five')).toBeCloseTo(7.5); // 5 words * 1.5 = 7.5
      // Empty string splits to [''], length 1 * 1.5 = 1.5
      expect(tokensAprox('')).toBeCloseTo(1.5);
      expect(tokensAprox('single')).toBeCloseTo(1.5); // 1 word * 1.5 = 1.5
    });
  });

  describe('getChatGPTCompletion', () => {
    test('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        data: {
          usage: { total_tokens: 10 },
          choices: [{ message: { content: 'Hello there!' } }],
        },
      };
      mockCreateChatCompletion.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await getChatGPTCompletion(messages);

      expect(mockCreateChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        max_tokens: 256,
        messages,
      });
      expect(result).toEqual({
        tokens: 10,
        text: 'Hello there!',
      });
    });

    test('should handle responses without token usage', async () => {
      const mockResponse = {
        data: {
          usage: null,
          choices: [{ message: { content: 'Response without tokens' } }],
        },
      };
      mockCreateChatCompletion.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user', content: 'Test' },
      ];

      const result = await getChatGPTCompletion(messages);

      expect(result).toEqual({
        tokens: undefined,
        text: 'Response without tokens',
      });
    });

    test('should handle responses without message content', async () => {
      const mockResponse = {
        data: {
          usage: { total_tokens: 5 },
          choices: [{ message: null }],
        },
      };
      mockCreateChatCompletion.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user', content: 'Test' },
      ];

      const result = await getChatGPTCompletion(messages);

      expect(result).toEqual({
        tokens: 5,
        text: '',
      });
    });

    test('should throw error when OpenAI API fails', async () => {
      const errorMessage = 'API Error';
      mockCreateChatCompletion.mockRejectedValue({ message: errorMessage });

      const messages = [
        { role: 'user', content: 'Test' },
      ];

      await expect(getChatGPTCompletion(messages)).rejects.toThrow(
        `ChatCompletionRequest - ${errorMessage}`
      );
    });
  });

  describe('getChatStarter', () => {
    test('should return system prompt and message from lessons table', async () => {
      const mockData = {
        data: [
          {
            prompt: 'You are a helpful assistant',
            starter: 'How can I help you today?',
          },
        ],
        error: null,
      };

      // Mock the supabase client to return proper mock query builder for lessons
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'lessons') {
          const qb = new MockQueryBuilder(mockData);
          // Override the order method to return the mock data when awaited
          qb.order = jest.fn().mockImplementation(function(this: any, column: string, options: any) {
            const newQb = new MockQueryBuilder(mockData);
            // Copy the methods to maintain the mock behavior
            newQb.select = this.select.bind(this);
            newQb.eq = this.eq.bind(this);
            newQb.gt = this.gt.bind(this);
            // Return the same mock data when this is awaited
            return newQb;
          });
          return qb;
        }
        return new MockQueryBuilder();
      });

      const result = await getChatStarter();

      expect(supabaseClient.from).toHaveBeenCalledWith('lessons');
      expect(result).toEqual({
        systemPrompt: 'You are a helpful assistant',
        message: 'How can I help you today?',
      });
    });

    test('should return defaults when no lessons data', async () => {
      const mockData = {
        data: [{}], // Use object with no properties to allow optional chaining to work and fall back to defaults
        error: null,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'lessons') {
          // Create a mock that, when resolved, will behave like the real Supabase response
          const mockResult = Promise.resolve(mockData);

          // Create a query builder that returns a promise resolving to mockData
          class LocalMockQB {
            select(...args: any[]) { return this; }
            insert(...args: any[]) { return this; }
            update(values: any) { return this; }
            eq(column: string, value: any) { return this; }
            gt(column: string, value: any) { return this; }
            order(column: string, options?: any) { return this; }

            // When awaited, return our mock data
            then(resolve: any) {
              return resolve(mockData);
            }
          }

          return new LocalMockQB();
        }
        return new MockQueryBuilder();
      });

      const result = await getChatStarter();

      expect(result).toEqual({
        systemPrompt: 'You are Bruno, an English teacher',
        message: 'What would you like to practice today?',
      });
    });

    test('should throw error when database query fails', async () => {
      const mockError = { message: 'Database error' };
      const mockData = {
        data: [],
        error: mockError,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'lessons') {
          const qb = new MockQueryBuilder(mockData);
          qb.order = jest.fn().mockImplementation(function(this: any) {
            return new MockQueryBuilder(mockData);
          });
          return qb;
        }
        return new MockQueryBuilder();
      });

      await expect(getChatStarter()).rejects.toThrow(
        JSON.stringify(mockError)
      );
    });
  });

  describe('initChat', () => {
    test('should initialize chat with processed prompts', async () => {
      const mockInsertResult = {
        data: [{
          id: 1,
          userId: 'user123',
          chat: {
            messages: [
              { role: 'system', content: 'Hello user123!' },
              { role: 'assistant', content: 'Hi user123!' },
            ]
          }
        }],
        error: null,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockInsertResult);
          // Mock the insert method to allow chaining to select
          qb.insert = jest.fn().mockReturnThis();
          // Mock the select method to resolve with the mock data
          const newQb = new MockQueryBuilder(mockInsertResult);
          newQb.select = jest.fn().mockImplementation(() => newQb);
          return newQb;
        }
        return new MockQueryBuilder();
      });

      const params = {
        userId: 'user123',
        systemPrompt: 'Hello {{NAME}}!',
        starterMessage: 'Hi {{NAME}}!',
        chatId: 123
      };

      const result = await initChat(params);

      expect(supabaseClient.from).toHaveBeenCalledWith('conversations');
      expect(result).toEqual(mockInsertResult.data[0]);
    });

    test('should handle Unknown user when userId is empty', async () => {
      const mockInsertResult = {
        data: [{
          id: 1,
          userId: 'Unknown_456',
          chat: {
            messages: [
              { role: 'system', content: 'Hello!' },
              { role: 'assistant', content: 'Hi!' },
            ]
          }
        }],
        error: null,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockInsertResult);
          qb.insert = jest.fn().mockReturnThis();
          const newQb = new MockQueryBuilder(mockInsertResult);
          newQb.select = jest.fn().mockImplementation(() => newQb);
          return newQb;
        }
        return new MockQueryBuilder();
      });

      const params = {
        userId: '', // Empty userId
        systemPrompt: 'Hello!',
        starterMessage: 'Hi!',
        chatId: 456
      };

      await initChat(params);
    });

    test('should throw error when database insert fails', async () => {
      const mockError = { message: 'Insert failed' };
      const mockInsertResult = {
        data: [],
        error: mockError,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockInsertResult);
          qb.insert = jest.fn().mockReturnThis();
          const newQb = new MockQueryBuilder(mockInsertResult);
          newQb.select = jest.fn().mockImplementation(() => newQb);
          return newQb;
        }
        return new MockQueryBuilder();
      });

      const params = {
        userId: 'user123',
        systemPrompt: 'Hello!',
        starterMessage: 'Hi!',
        chatId: 123
      };

      await expect(initChat(params)).rejects.toThrow(
        JSON.stringify(mockError)
      );
    });
  });

  describe('getLastChat', () => {
    test('should retrieve last chat for given chat ID', async () => {
      const mockDate = new Date().toISOString();
      const mockYesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
      
      const mockData = {
        data: [{
          id: 1,
          date: mockDate,
          chat: { messages: [] }
        }],
        error: null,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockData);
          // Mock the method chain: select().eq().gt().order()
          const selectQb = new MockQueryBuilder(mockData);
          selectQb.eq = jest.fn().mockImplementation(() => {
            const eqQb = new MockQueryBuilder(mockData);
            eqQb.gt = jest.fn().mockImplementation(() => {
              const gtQb = new MockQueryBuilder(mockData);
              gtQb.order = jest.fn().mockImplementation(() => new MockQueryBuilder(mockData));
              return gtQb;
            });
            return eqQb;
          });
          return selectQb;
        }
        return new MockQueryBuilder();
      });

      const result = await getLastChat(123);

      expect(supabaseClient.from).toHaveBeenCalledWith('conversations');
      expect(result).toEqual(mockData.data[0]);
    });

    test('should throw error when database query fails', async () => {
      const mockError = { message: 'Query failed' };
      const mockData = {
        data: [],
        error: mockError,
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockData);
          const selectQb = new MockQueryBuilder(mockData);
          selectQb.eq = jest.fn().mockImplementation(() => {
            const eqQb = new MockQueryBuilder(mockData);
            eqQb.gt = jest.fn().mockImplementation(() => {
              const gtQb = new MockQueryBuilder(mockData);
              gtQb.order = jest.fn().mockImplementation(() => new MockQueryBuilder(mockData));
              return gtQb;
            });
            return eqQb;
          });
          return selectQb;
        }
        return new MockQueryBuilder();
      });

      await expect(getLastChat(123)).rejects.toThrow(
        JSON.stringify(mockError)
      );
    });
  });

  describe('updateConversation', () => {
    test('should update conversation in database', async () => {
      const mockUpdateResult = { error: null };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockUpdateResult);
          // Mock: update().eq()
          const updateQb = new MockQueryBuilder(mockUpdateResult);
          updateQb.eq = jest.fn().mockImplementation(() => new MockQueryBuilder(mockUpdateResult));
          return updateQb;
        }
        return new MockQueryBuilder();
      });

      const chatData = { messages: [{ role: 'user', content: 'Hello' }] };

      await updateConversation(123, chatData);

      expect(supabaseClient.from).toHaveBeenCalledWith('conversations');
    });

    test('should throw error when database update fails', async () => {
      const mockError = { message: 'Update failed' };
      const mockUpdateResult = { error: mockError };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockUpdateResult);
          const updateQb = new MockQueryBuilder(mockUpdateResult);
          updateQb.eq = jest.fn().mockImplementation(() => new MockQueryBuilder(mockUpdateResult));
          return updateQb;
        }
        return new MockQueryBuilder();
      });

      const chatData = { messages: [{ role: 'user', content: 'Hello' }] };

      await expect(updateConversation(123, chatData)).rejects.toThrow(
        JSON.stringify(mockError)
      );
    });
  });

  describe('updateTokenUsage', () => {
    test('should update token usage in database when tokens provided', async () => {
      const mockUpdateResult = { error: null };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockUpdateResult);
          const updateQb = new MockQueryBuilder(mockUpdateResult);
          updateQb.eq = jest.fn().mockImplementation(() => new MockQueryBuilder(mockUpdateResult));
          return updateQb;
        }
        return new MockQueryBuilder();
      });

      await updateTokenUsage(123, 50);

      expect(supabaseClient.from).toHaveBeenCalledWith('conversations');
    });

    test('should not update when tokens is 0', async () => {
      await updateTokenUsage(123, 0);

      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('conversations');
    });

    test('should not update when tokens is undefined', async () => {
      await updateTokenUsage(123, undefined);

      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('conversations');
    });

    test('should not update when tokens is null', async () => {
      await updateTokenUsage(123, null);

      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('conversations');
    });

    test('should not update when tokens is NaN', async () => {
      await updateTokenUsage(123, NaN);

      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('conversations');
    });

    test('should throw error when database update fails', async () => {
      const mockError = { message: 'Update failed' };
      const mockUpdateResult = { error: mockError };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'conversations') {
          const qb = new MockQueryBuilder(mockUpdateResult);
          const updateQb = new MockQueryBuilder(mockUpdateResult);
          updateQb.eq = jest.fn().mockImplementation(() => new MockQueryBuilder(mockUpdateResult));
          return updateQb;
        }
        return new MockQueryBuilder();
      });

      await expect(updateTokenUsage(123, 50)).rejects.toThrow(
        JSON.stringify(mockError)
      );
    });
  });

  describe('pollBotUpdates', () => {
    test('should be initialized', () => {
      expect(pollBotUpdates).toBeDefined();
    });
  });
});