# ClaudePoint Tests

This directory contains comprehensive tests for the ClaudePoint CheckpointManager, specifically validating the robust ignore pattern handling implemented with the `ignore` npm package.

## Test Coverage

The test suite validates all the key success factors of the improved ignore pattern handling:

### ✅ **Proper gitignore syntax support**
- Tests complex patterns including comments, empty lines, and various gitignore syntax
- Validates that the system correctly handles industry-standard gitignore patterns

### ✅ **Negation pattern support** 
- Tests `!pattern` syntax for exceptions (e.g., `!.env.example`)
- Ensures files that would normally be ignored can be included via negation

### ✅ **Nested directory handling**
- Tests complex nested patterns like `src/**/*.tmp`, `**/temp/`, `vendor/**/cache/`
- Validates proper directory traversal and pattern matching

### ✅ **Performance improvement**
- Tests that ignore matcher is cached once per session
- Validates that subsequent calls don't re-parse patterns

### ✅ **Consistency**
- Tests integration between `.gitignore` and config `additionalIgnores`
- Validates consistent behavior across multiple calls
- Tests handling of relative vs absolute paths

### ✅ **Maintainability**
- Tests leverage the robust `ignore` library behavior
- Edge cases and error handling are validated
- Tests work without `.gitignore` files present

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- **Ignore Pattern Handling**: Core functionality tests for gitignore patterns
- **Performance and Caching**: Tests for ignore matcher caching behavior
- **getProjectFiles Integration**: Integration tests with file system operations
- **Edge Cases and Error Handling**: Tests for unusual inputs and error conditions
- **Consistency Validation**: Tests for reliable and predictable behavior

## Test Environment

Tests use temporary directories for each test case to ensure isolation and avoid conflicts with the actual project files. All test artifacts are automatically cleaned up after each test.