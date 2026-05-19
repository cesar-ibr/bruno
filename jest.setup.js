// jest.setup.js - Setup file for Jest tests

// Mock global Deno object
global.Deno = {
  env: {
    get: (key) => {
      if (key === 'TELEGRAM_TOKEN') return 'test-telegram-token';
      if (key === 'OPENAI_KEY') return 'test-openai-key';
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_KEY') return 'test-supabase-key';
      return null;
    },
  },
};