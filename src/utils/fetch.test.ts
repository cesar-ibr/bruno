import { get, post } from './fetch';

// Mock global fetch
global.fetch = jest.fn();

describe('fetch utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make a GET request and return JSON data when status is 200', async () => {
      const mockResponse = { data: 'test' };
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 200,
        url: mockUrl,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await get(mockUrl);

      expect(global.fetch).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when response status is not 200', async () => {
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 404,
        url: mockUrl,
        statusText: 'Not Found',
      } as Response);

      await expect(get(mockUrl)).rejects.toThrow('HTTP 404 - Not Found');
    });

    it('should use default URL "/" when no URL is provided', async () => {
      const mockResponse = { data: 'default' };
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 200,
        url: '/',
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await get();

      expect(global.fetch).toHaveBeenCalledWith('/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('post', () => {
    it('should make a POST request with correct options and return JSON data when status is 200', async () => {
      const mockPayload = { name: 'test', value: 123 };
      const mockResponse = { success: true };
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 200,
        url: mockUrl,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await post(mockUrl, mockPayload);

      expect(global.fetch).toHaveBeenCalledWith(mockUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          connection: 'keep-alive',
        },
        body: JSON.stringify(mockPayload)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request with empty payload when no payload is provided', async () => {
      const mockResponse = { success: true };
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 200,
        url: mockUrl,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await post(mockUrl);

      expect(global.fetch).toHaveBeenCalledWith(mockUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          connection: 'keep-alive',
        },
        body: JSON.stringify({})
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use default URL "/" when no URL is provided', async () => {
      const mockResponse = { data: 'default' };
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 200,
        url: '/',
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await post();

      expect(global.fetch).toHaveBeenCalledWith('/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          connection: 'keep-alive',
        },
        body: JSON.stringify({})
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when response status is not 200', async () => {
      const mockPayload = { name: 'test' };
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 500,
        url: mockUrl,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(post(mockUrl, mockPayload)).rejects.toThrow('HTTP 500 - Internal Server Error');
    });

    it('should throw an error with correct method in message when POST fails', async () => {
      const mockPayload = { name: 'test' };
      const mockUrl = '/api/test';
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        status: 400,
        url: mockUrl,
        statusText: 'Bad Request',
      } as Response);

      const promise = post(mockUrl, mockPayload);
      await expect(promise).rejects.toThrow('HTTP 400 - Bad Request');
    });
  });
});