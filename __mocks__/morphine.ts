// Create a mock class that can be instantiated
class MockMorphine {
  constructor() {
    return {};
  }
}

// Export both as default and as a named export
module.exports = MockMorphine;
module.exports.default = MockMorphine;