import { logger, logTime } from './logger';

// Mock console.log to capture calls
const mockConsoleLog = jest.fn();

describe('Logger Utility', () => {
  beforeEach(() => {
    // Spy on console.log to capture calls
    jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
  });

  afterEach(() => {
    // Clear the mock after each test
    (console.log as jest.Mock).mockClear();
    // Restore console.log after each test
    (console.log as jest.Mock).mockRestore();
  });

  describe('logger', () => {
    it('should create a logger function with default service name when no service is provided', () => {
      const log = logger(); // No service name provided
      log('Test message');

      expect(console.log).toHaveBeenCalledWith(
        '%c[SERVICE] Test message',
        'color: white'
      );
    });

    it('should create a logger function with custom service name', () => {
      const log = logger('CUSTOM_SERVICE');
      log('Test message');

      expect(console.log).toHaveBeenCalledWith(
        '%c[CUSTOM_SERVICE] Test message',
        'color: white'
      );
    });

    it('should log a message with default color when no color is provided', () => {
      const log = logger('TEST_SERVICE');
      log('Test message'); // No color provided

      expect(console.log).toHaveBeenCalledWith(
        '%c[TEST_SERVICE] Test message',
        'color: white'
      );
    });

    it('should log a message with custom color', () => {
      const log = logger('TEST_SERVICE');
      log('Test message', 'red');

      expect(console.log).toHaveBeenCalledWith(
        '%c[TEST_SERVICE] Test message',
        'color: red'
      );
    });

    it('should handle empty message', () => {
      const log = logger('TEST_SERVICE');
      log(); // No message provided

      expect(console.log).toHaveBeenCalledWith(
        '%c[TEST_SERVICE] ',
        'color: white'
      );
    });

    it('should handle message with undefined values gracefully', () => {
      const log = logger('TEST_SERVICE');
      log(undefined);

      expect(console.log).toHaveBeenCalledWith(
        '%c[TEST_SERVICE] ',
        'color: white'
      );
    });
  });

  describe('logTime', () => {
    beforeEach(() => {
      // Mock Date.now to have predictable values for timing tests
      jest.useFakeTimers();
      jest.setSystemTime(100000); // Set a reference time
    });

    afterEach(() => {
      // Restore real timers after each test
      jest.useRealTimers();
    });

    it('should calculate and log elapsed time correctly', () => {
      const startTime = 98000; // Two seconds before the mock time
      logTime(startTime, 'ELAPSED_TIME');

      expect(console.log).toHaveBeenCalledWith(
        '%c[ELAPSED_TIME] 2s',
        'color: orchid'
      );
    });

    it('should use default label when no label is provided', () => {
      const startTime = 99000; // One second before the mock time
      logTime(startTime);

      expect(console.log).toHaveBeenCalledWith(
        '%c[TIME] 1s',
        'color: orchid'
      );
    });

    it('should handle zero elapsed time', () => {
      const startTime = 100000; // Same as current time
      logTime(startTime, 'ZERO_TIME');

      expect(console.log).toHaveBeenCalledWith(
        '%c[ZERO_TIME] 0s',
        'color: orchid'
      );
    });

    it('should convert milliseconds to seconds correctly', () => {
      const startTime = 99500; // 500ms before (0.5s)
      logTime(startTime, 'HALF_SECOND');

      expect(console.log).toHaveBeenCalledWith(
        '%c[HALF_SECOND] 0.5s',
        'color: orchid'
      );
    });
  });
});