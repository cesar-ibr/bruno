import { Database } from './db';

describe('Database Types', () => {
  // Type tests for Json type
  describe('Json type', () => {
    it('should accept primitive types', () => {
      const jsonString: string = 'hello';
      const jsonNumber: number = 42;
      const jsonBoolean: boolean = true;
      const jsonNull: null = null;

      expect(jsonString).toBe('hello');
      expect(jsonNumber).toBe(42);
      expect(jsonBoolean).toBe(true);
      expect(jsonNull).toBeNull();
    });

    it('should accept object types', () => {
      const jsonObject: { [key: string]: any } = {
        stringVal: 'test',
        numberVal: 123,
        booleanVal: true,
        nullVal: null,
        nested: {
          deep: 'value'
        }
      };

      expect(jsonObject.stringVal).toBe('test');
      expect(jsonObject.nested.deep).toBe('value');
    });

    it('should accept array types', () => {
      const jsonArray: (string | number | boolean | null)[] = ['hello', 42, true, null];
      expect(jsonArray).toEqual(['hello', 42, true, null]);
    });
  });

  // Type tests for Database interface
  describe('Database interface', () => {
    it('should define ASR output table types correctly', () => {
      const asrRow: Database['public']['Tables']['asr_output']['Row'] = {
        file: 'audio.mp3',
        id: 1,
        output: 'transcribed text',
        score: 0.95
      };

      const asrInsert: Database['public']['Tables']['asr_output']['Insert'] = {
        file: 'audio.mp3',
        output: 'transcribed text',
        score: 0.95
      };

      const asrUpdate: Database['public']['Tables']['asr_output']['Update'] = {
        output: 'updated transcribed text',
        score: 0.98
      };

      expect(asrRow.file).toBe('audio.mp3');
      expect(asrRow.id).toBe(1);
      expect(asrRow.output).toBe('transcribed text');
      expect(asrRow.score).toBe(0.95);

      // For insert type, id should be optional
      expect(asrInsert.file).toBe('audio.mp3');

      // For update type, fields should be optional
      expect(asrUpdate.output).toBe('updated transcribed text');
    });

    it('should define conversations table types correctly', () => {
      const conversationRow: Database['public']['Tables']['conversations']['Row'] = {
        chat: {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        },
        chat_id: 1,
        date: '2023-01-01T00:00:00Z',
        id: 1,
        token_usage: 100,
        topics: 'greeting',
        userId: 'user-123'
      };

      const conversationInsert: Database['public']['Tables']['conversations']['Insert'] = {
        chat: {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        },
        userId: 'user-123'
      };

      const conversationUpdate: Database['public']['Tables']['conversations']['Update'] = {
        token_usage: 150,
        topics: 'greeting, welcome'
      };

      expect(conversationRow.chat).toBeDefined();
      expect(conversationRow.userId).toBe('user-123');
      expect(conversationRow.token_usage).toBe(100);
      expect(Array.isArray((conversationRow.chat as any).messages)).toBe(true);

      // For insert type, id and other auto-generated fields should be optional
      expect(conversationInsert.userId).toBe('user-123');

      // For update type, all fields should be optional
      expect(conversationUpdate.token_usage).toBe(150);
    });

    it('should define lessons table types correctly', () => {
      const lessonRow: Database['public']['Tables']['lessons']['Row'] = {
        created_at: '2023-01-01T00:00:00Z',
        id: 1,
        prompt: 'Write about greetings',
        starter: 'Hello world',
        topics: 'greetings, introduction'
      };

      const lessonInsert: Database['public']['Tables']['lessons']['Insert'] = {
        prompt: 'Write about greetings',
        starter: 'Hello world'
      };

      const lessonUpdate: Database['public']['Tables']['lessons']['Update'] = {
        topics: 'greetings, introduction, welcome'
      };

      expect(lessonRow.prompt).toBe('Write about greetings');
      expect(lessonRow.starter).toBe('Hello world');
      expect(lessonRow.topics).toBe('greetings, introduction');

      // For insert type, id and created_at should be optional
      expect(lessonInsert.prompt).toBe('Write about greetings');

      // For update type, all fields should be optional
      expect(lessonUpdate.topics).toBe('greetings, introduction, welcome');
    });
  });

  describe('Composite types', () => {
    it('should define message composite type correctly', () => {
      const message: Database['public']['CompositeTypes']['message'] = {
        score: 0.95,
        content: 'This is a test message'
      };

      expect(message.score).toBe(0.95);
      expect(message.content).toBe('This is a test message');
    });

    it('should define messagerec composite type correctly', () => {
      const messageRec: Database['public']['CompositeTypes']['messagerec'] = {
        score: 0.98,
        content: 'This is a test message record'
      };

      expect(messageRec.score).toBe(0.98);
      expect(messageRec.content).toBe('This is a test message record');
    });
  });

  describe('Function types', () => {
    it('should define get_underscore_messages function types correctly', () => {
      const args: Database['public']['Functions']['get_underscore_messages']['Args'] = {
        conversation_id: 1,
        score: 0.8
      };
      const returns: Database['public']['Functions']['get_underscore_messages']['Returns'] = [
        { score: 0.9, content: 'test message' }
      ];

      expect(args.conversation_id).toBe(1);
      expect(args.score).toBe(0.8);
      expect(returns.length).toBe(1);
      expect(returns[0].score).toBe(0.9);
    });
  });

  // Test that relationships are empty arrays as defined
  describe('Table relationships', () => {
    it('should have empty relationships for all tables', () => {
      const asrRelationships: Database['public']['Tables']['asr_output']['Relationships'] = [];
      const conversationsRelationships: Database['public']['Tables']['conversations']['Relationships'] = [];
      const lessonsRelationships: Database['public']['Tables']['lessons']['Relationships'] = [];

      expect(asrRelationships).toEqual([]);
      expect(conversationsRelationships).toEqual([]);
      expect(lessonsRelationships).toEqual([]);
    });
  });
});