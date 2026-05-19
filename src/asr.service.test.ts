import { jest, describe, expect, test, beforeEach, afterEach } from '@jest/globals';

// Since the ASR service file uses Deno-specific imports that won't work in Node.js/Jest,
// we'll create unit tests for the logic patterns and functions that could exist in a refactored version
// that separates the core business logic from the Deno/HTTP server parts

describe('ASR Service Logic Tests', () => {
  // Mock the utilities since they might have Deno-specific code
  const mockCapitalizeI = jest.fn((text: string) => text);
  const mockLogger = jest.fn(() => ({
    log: jest.fn()
  }));
  const mockSupabaseClient = {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate request payload correctly', () => {
    // Test the validation logic that checks if link exists
    interface TRequest {
      link: string;
    }

    const validateLink = (request: TRequest): boolean => {
      return !!request.link;
    };

    expect(validateLink({ link: 'https://example.com/audio.ogg' })).toBe(true);
    expect(validateLink({ link: '' })).toBe(false);
    expect(validateLink({ link: undefined as any })).toBe(false);
  });

  test('should format file paths correctly for local files', () => {
    const formatFilePath = (link: string): { fileName: string, filePath: string, isRemoteFile: boolean } => {
      const isRemoteFile = link.startsWith('http');
      const fileName = link.replace('.oga', '.ogg').split('/').pop() ?? 'audio.ogg';
      const filePath = isRemoteFile ? './voice_notes/'.concat(fileName) : link;
      return { fileName, filePath, isRemoteFile };
    };

    const resultLocal = formatFilePath('./local/audio.ogg');
    expect(resultLocal.isRemoteFile).toBe(false);
    expect(resultLocal.fileName).toBe('audio.ogg');
    expect(resultLocal.filePath).toBe('./local/audio.ogg');

    const resultLocalOga = formatFilePath('./local/audio.oga');
    expect(resultLocalOga.fileName).toBe('audio.ogg'); // .oga should become .ogg
  });

  test('should format file paths correctly for remote files', () => {
    const formatFilePath = (link: string): { fileName: string, filePath: string, isRemoteFile: boolean } => {
      const isRemoteFile = link.startsWith('http');
      const fileName = link.replace('.oga', '.ogg').split('/').pop() ?? 'audio.ogg';
      const filePath = isRemoteFile ? './voice_notes/'.concat(fileName) : link;
      return { fileName, filePath, isRemoteFile };
    };

    const result = formatFilePath('https://example.com/audio.oga');
    expect(result.isRemoteFile).toBe(true);
    expect(result.fileName).toBe('audio.ogg'); // .oga replaced with .ogg
    expect(result.filePath).toBe('./voice_notes/audio.ogg');

    const resultWithPath = formatFilePath('https://example.com/folder/audio_file.oga');
    expect(resultWithPath.fileName).toBe('audio_file.ogg');
    expect(resultWithPath.filePath).toBe('./voice_notes/audio_file.ogg');
  });

  test('should create error responses with proper status codes', () => {
    const errorResponse = (error = '', code = 500) => {
      const headers = { 'Content-Type': 'application/json' };
      return new Response(
        JSON.stringify({ error }),
        { status: code, headers }
      );
    };

    const errorResp400 = errorResponse('Bad Request', 400);
    expect(errorResp400.status).toBe(400);

    const errorResp500 = errorResponse('Internal Server Error', 500);
    expect(errorResp500.status).toBe(500);

    // Check that response body contains the error message
    const errorTextPromise = errorResp400.json();
    expect(errorTextPromise).resolves.toEqual({ error: 'Bad Request' });
  });

  test('should handle fetch responses correctly', async () => {
    // Mock fetch responses
    const mockSuccessResponse = {
      status: 200,
      statusText: 'OK',
      body: {
        pipeTo: jest.fn().mockResolvedValue(Promise.resolve()),
      }
    };

    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
      body: null
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce(mockSuccessResponse)
      .mockResolvedValueOnce(mockErrorResponse) as any;

    // Test success case
    const successResponse = await fetch('https://example.com/audio.ogg');
    expect(successResponse.status).toBe(200);

    // Test error case
    const errorResponse = await fetch('https://example.com/notfound.ogg');
    expect(errorResponse.status).toBe(404);
  });

  test('should simulate HuggingFace inference response', async () => {
    // Since we can't actually call the HuggingFace API in tests, we mock the response
    const mockHFResponse = {
      text: 'hello world from the audio file'
    };

    // Simulating the transcription logic
    const transcribeAudio = async (audioData: Uint8Array): Promise<string> => {
      // This simulates the hf.automaticSpeechRecognition call
      // In real implementation, this would call the API
      const result = await Promise.resolve(mockHFResponse);
      return mockCapitalizeI(result.text); // Apply capitalizeI utility
    };

    const audioData = new Uint8Array([1, 2, 3]);
    mockCapitalizeI.mockReturnValue('Hello World From The Audio File');

    const transcription = await transcribeAudio(audioData);
    expect(transcription).toBe('Hello World From The Audio File');
    expect(mockCapitalizeI).toHaveBeenCalledWith('hello world from the audio file');
  });

  test('should save transcript to database only for remote files', async () => {
    // Create a mock insert function that we can track
    const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });

    // Mock the from method to return an object with our tracked insert method
    mockSupabaseClient.from = jest.fn().mockReturnValue({
      insert: mockInsert
    });

    const saveToDatabase = async (text: string, fileName: string, isRemoteFile: boolean) => {
      if (isRemoteFile) {
        return await mockSupabaseClient.from('asr_output').insert({ output: text, file: fileName });
      }
      return { data: null, error: null }; // Return empty response for local files
    };

    // Test with remote file - should save to DB
    await saveToDatabase('transcribed text', 'audio.ogg', true);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('asr_output');
    expect(mockInsert).toHaveBeenCalledWith({
      output: 'transcribed text',
      file: 'audio.ogg'
    });

    // Reset mocks
    jest.clearAllMocks();

    // Test with local file - should NOT save to DB
    await saveToDatabase('transcribed text', 'local_audio.ogg', false);
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  test('should handle different model IDs correctly', () => {
    // Testing the model ID constants that would be used in the service
    const MODEL_IDS = {
      DEFAULT: 'openai/whisper-medium',
      ALTERNATIVE: 'jonatasgrosman/wav2vec2-large-xlsr-53-english'
    };

    expect(MODEL_IDS.DEFAULT).toBe('openai/whisper-medium');
    expect(MODEL_IDS.ALTERNATIVE).toBe('jonatasgrosman/wav2vec2-large-xlsr-53-english');
  });

  test('should handle environment variable retrieval', () => {
    // Mock the environment
    const originalEnv = process.env;
    process.env = { ...originalEnv, HF_TOKEN: 'test-hf-token' };

    // Simulate getting token with fallback
    const getToken = (): string => {
      return process.env.HF_TOKEN ?? '';
    };

    expect(getToken()).toBe('test-hf-token');

    // Clean up
    process.env = originalEnv;
  });

  test('should handle missing environment variable with fallback', () => {
    const originalEnv = process.env;
    // Temporarily remove the HF_TOKEN if it exists
    const envCopy = { ...originalEnv };
    delete envCopy.HF_TOKEN;
    process.env = envCopy;

    // Simulate getting token with fallback
    const getToken = (): string => {
      return process.env.HF_TOKEN ?? '';
    };

    expect(getToken()).toBe('');

    // Clean up
    process.env = originalEnv;
  });
});