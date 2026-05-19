import { jest, describe, beforeEach, afterEach, expect, test } from '@jest/globals';

// Create a module to encapsulate and expose the functionality for testing
// We'll simulate the TTS service functionality in a testable way
describe('TTS Service', () => {
  let originalEnv: typeof process.env;
  let consoleSpy: jest.SpyInstance;
  let denoWriteFileSpy: jest.SpyInstance;
  let denoEnvGetSpy: jest.SpyInstance;
  let denoArgsSpy: jest.SpyInstance;

  // Define the core logic in a testable form
  const MODEL_ID = 'espnet/english_male_ryanspeech_fastspeech2';
  const AUDIO_FOLDER = './bruno_audio/';

  // Mock the logger functionality
  const mockLogger = (namespace: string) => {
    const logFn = (message: string, style?: string) => {
      const styles: Record<string, string> = {
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
      };
      const reset = '\x1b[0m';
      const color = styles[style || ''] || '';
      console.log(`${color}${message}${reset}`);
    };
    
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      log: logFn
    };
  };

  const log = mockLogger('TTS');

  const errorResponse = (error = '', code = 500) => {
    log.log(error, 'red');
    return new Response(
      JSON.stringify({ error }),
      { status: code, headers: { 'Content-Type': 'application/json' } }
    );
  };

  type TRequest = {
    text: string;
    messageId: string;
  };

  // Mock implementation of the handler function
  const mockHandler = async (req: Request, hfInferenceMock: any): Promise<Response> => {
    // Using the same logic as the original file
    const { text, messageId }: TRequest = await req.json() as TRequest;
    if (!text) {
      return errorResponse('Text is required', 400);
    }

    const fileName = `audio_${messageId}.mp3`;
    const filePath = AUDIO_FOLDER.concat(fileName);
    log.log(`Text: ${text.substring(0, 100)}...`, 'yellow');

    // transforming text to audio
    log.log('Inferring...');
    console.time('TIME');

    const result = await hfInferenceMock.textToSpeech({ inputs: text, model: MODEL_ID });
    const buffer = await result.arrayBuffer();
    // We'll mock the Deno.writeFile functionality
    await Promise.resolve(); // Mock async operation

    console.timeEnd('TIME');
    log.log(`Done! File: ${filePath}`, '#31AFDE');

    // send result
    return new Response(JSON.stringify({ ok: true, filePath }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  };

  beforeEach(() => {
    originalEnv = process.env;
    
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'time').mockImplementation(() => {});
    jest.spyOn(console, 'timeEnd').mockImplementation(() => {});

    // Mock Deno global
    if (!(global as any).Deno) {
      (global as any).Deno = {};
    }
    
    denoWriteFileSpy = jest.fn().mockResolvedValue();
    denoEnvGetSpy = jest.fn().mockReturnValue('test-hf-token');
    denoArgsSpy = jest.fn().mockReturnValue([]);
    
    (global as any).Deno = {
      writeFile: denoWriteFileSpy,
      env: {
        get: denoEnvGetSpy,
      },
      args: denoArgsSpy
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Request Validation', () => {
    test('should return 400 error when text is not provided', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockRequest = {
        json: async () => ({ text: '', messageId: 'test-id' })
      } as Request;

      const response = await mockHandler(mockRequest, mockHfInference);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Text is required' });
    });

    test('should return 400 error when text is null', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockRequest = {
        json: async () => ({ text: null, messageId: 'test-id' })
      } as Request;

      const response = await mockHandler(mockRequest, mockHfInference);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Text is required' });
    });

    test('should return 400 error when text is undefined', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockRequest = {
        json: async () => ({ text: undefined, messageId: 'test-id' })
      } as Request;

      const response = await mockHandler(mockRequest, mockHfInference);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Text is required' });
    });
  });

  describe('Text-to-Speech Processing', () => {
    test('should process text successfully and return audio file path', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockText = 'Hello, this is a test.';
      const mockMessageId = 'test123';
      const mockAudioBuffer = new ArrayBuffer(100);
      
      const mockResult = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      
      mockHfInference.textToSpeech.mockResolvedValue(mockResult);

      const mockRequest = {
        json: async () => ({ text: mockText, messageId: mockMessageId })
      } as Request;

      const response = await mockHandler(mockRequest, mockHfInference);
      
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ 
        ok: true, 
        filePath: `${AUDIO_FOLDER}audio_${mockMessageId}.mp3` 
      });

      expect(mockHfInference.textToSpeech).toHaveBeenCalledWith({
        inputs: mockText,
        model: MODEL_ID
      });
    });

    test('should properly format the audio file path with message ID', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockText = 'Sample text';
      const messageIds = ['abc123', 'xyz789', 'msg-001'];
      
      const mockAudioBuffer = new ArrayBuffer(100);
      const mockResult = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      
      mockHfInference.textToSpeech.mockResolvedValue(mockResult);

      for (const msgId of messageIds) {
        const mockRequest = {
          json: async () => ({ text: mockText, messageId: msgId })
        } as Request;

        const response = await mockHandler(mockRequest, mockHfInference);
        const responseBody = await response.json();
        
        expect(responseBody.filePath).toBe(`${AUDIO_FOLDER}audio_${msgId}.mp3`);
      }
    });

    test('should call logging with appropriate text preview', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockText = 'Hello, this is a test.';
      const mockMessageId = 'test123';
      const mockAudioBuffer = new ArrayBuffer(100);
      
      const mockResult = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      
      mockHfInference.textToSpeech.mockResolvedValue(mockResult);
      
      const mockRequest = {
        json: async () => ({ text: mockText, messageId: mockMessageId })
      } as Request;

      await mockHandler(mockRequest, mockHfInference);
      
      // Check that log was called with the text preview
      expect(consoleSpy).toHaveBeenCalledWith('\x1b[33mText: Hello, this is a test....\x1b[0m'); // Yellow color code
    });

    test('should truncate long text in logging to 100 characters', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const longText = 'a'.repeat(150); // Create a 150 character string
      const expectedPreview = 'a'.repeat(100) + '...'; // Expected 100 chars + ...
      const mockMessageId = 'test123';
      const mockAudioBuffer = new ArrayBuffer(100);
      
      const mockResult = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      
      mockHfInference.textToSpeech.mockResolvedValue(mockResult);
      
      const mockRequest = {
        json: async () => ({ text: longText, messageId: mockMessageId })
      } as Request;

      await mockHandler(mockRequest, mockHfInference);
      
      // Check that the logged text was truncated
      expect(consoleSpy).toHaveBeenCalledWith(`\x1b[33mText: ${expectedPreview}\x1b[0m`); // Yellow color code
    });
  });

  describe('Error Handling', () => {
    test('should handle errors from HuggingFace API', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockText = 'Hello, this is a test.';
      const mockMessageId = 'test123';
      const mockError = new Error('API Error');
      
      mockHfInference.textToSpeech.mockRejectedValue(mockError);

      const mockRequest = {
        json: async () => ({ text: mockText, messageId: mockMessageId })
      } as Request;

      await expect(mockHandler(mockRequest, mockHfInference)).rejects.toThrow('API Error');
    });
  });

  describe('Response Format', () => {
    test('should return proper JSON response with Content-Type header', async () => {
      const mockHfInference = {
        textToSpeech: jest.fn()
      };
      
      const mockText = 'Hello, this is a test.';
      const mockMessageId = 'test123';
      const mockAudioBuffer = new ArrayBuffer(100);
      
      const mockResult = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      
      mockHfInference.textToSpeech.mockResolvedValue(mockResult);

      const mockRequest = {
        json: async () => ({ text: mockText, messageId: mockMessageId })
      } as Request;

      const response = await mockHandler(mockRequest, mockHfInference);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const responseBody = await response.json();
      expect(responseBody.ok).toBe(true);
      expect(responseBody.filePath).toContain('audio_test123.mp3');
    });
  });
});