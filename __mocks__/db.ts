module.exports = {
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      eq: jest.fn(),
      gt: jest.fn(),
      order: jest.fn(),
    })),
  })),
  Database: {},
};