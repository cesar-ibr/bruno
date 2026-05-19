module.exports = {
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => ({
    createChatCompletion: jest.fn(),
  })),
};