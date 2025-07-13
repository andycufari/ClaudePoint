// Test setup file
// This file runs before each test file

// Increase timeout for file system operations in tests
jest.setTimeout(10000);

// Suppress console.error calls during tests unless explicitly testing them
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});