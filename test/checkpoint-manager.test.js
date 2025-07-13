const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const CheckpointManager = require('../src/lib/checkpoint-manager');

describe('CheckpointManager', () => {
  let tempDir;
  let checkpointManager;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claudepoint-test-'));
    checkpointManager = new CheckpointManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Ignore Pattern Handling', () => {
    test('should handle basic gitignore patterns', async () => {
      // Create test files and .gitignore
      await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules\nnode_modules/\n*.log\n.env\n');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'console.log("hello");');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'debug info');
      await fs.writeFile(path.join(tempDir, '.env'), 'SECRET=123');
      
      await fs.mkdir(path.join(tempDir, 'node_modules'));
      await fs.writeFile(path.join(tempDir, 'node_modules', 'package.json'), '{}');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'debug.log'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'node_modules'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'node_modules', 'package.json'))).toBe(true);
    });

    test('should handle negation patterns (!pattern)', async () => {
      // Test negation patterns - include files that would otherwise be ignored
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.env\n!.env.example\n*.log\n!important.log\n');
      await fs.writeFile(path.join(tempDir, '.env'), 'SECRET=123');
      await fs.writeFile(path.join(tempDir, '.env.example'), 'SECRET=your_secret_here');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'debug info');
      await fs.writeFile(path.join(tempDir, 'important.log'), 'important log');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env.example'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'debug.log'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'important.log'))).toBe(false);
    });

    test('should handle nested directory patterns', async () => {
      // Test complex nested patterns
      await fs.writeFile(path.join(tempDir, '.gitignore'), 
        'build\nbuild/\n' +
        'src/**/*.tmp\n' +
        'docs/private\ndocs/private/\n' +
        '**/temp\n**/temp/\n' +
        'vendor/**/cache\nvendor/**/cache/\n'
      );

      // Create directory structure
      await fs.mkdir(path.join(tempDir, 'build'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'utils'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'docs', 'private'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'docs', 'public'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'deep', 'nested', 'temp'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'vendor', 'lib', 'cache'), { recursive: true });

      // Create test files
      await fs.writeFile(path.join(tempDir, 'build', 'output.js'), 'built file');
      await fs.writeFile(path.join(tempDir, 'src', 'components', 'test.tmp'), 'temp file');
      await fs.writeFile(path.join(tempDir, 'src', 'components', 'component.js'), 'component');
      await fs.writeFile(path.join(tempDir, 'src', 'utils', 'helper.tmp'), 'temp file');
      await fs.writeFile(path.join(tempDir, 'docs', 'private', 'secret.md'), 'secret');
      await fs.writeFile(path.join(tempDir, 'docs', 'public', 'readme.md'), 'public docs');
      await fs.writeFile(path.join(tempDir, 'deep', 'nested', 'temp', 'file.txt'), 'temp file');
      await fs.writeFile(path.join(tempDir, 'vendor', 'lib', 'cache', 'data.json'), 'cache');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'build'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'build', 'output.js'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'src', 'components', 'test.tmp'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'src', 'components', 'component.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'src', 'utils', 'helper.tmp'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'docs', 'private'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'docs', 'private', 'secret.md'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'docs', 'public', 'readme.md'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'deep', 'nested', 'temp'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'vendor', 'lib', 'cache'))).toBe(true);
    });

    test('should handle complex gitignore syntax', async () => {
      // Test complex patterns including comments, empty lines, and edge cases
      await fs.writeFile(path.join(tempDir, '.gitignore'), 
        '# Comments should be ignored\n' +
        '\n' +
        '# Logs\n' +
        '*.log\n' +
        'logs\nlogs/\n' +
        '\n' +
        '# Dependency directories\n' +
        'node_modules\nnode_modules/\n' +
        'bower_components\nbower_components/\n' +
        '\n' +
        '# Environment files\n' +
        '.env*\n' +
        '!.env.example\n' +
        '\n' +
        '# IDE files\n' +
        '.vscode\n.vscode/\n' +
        '*.swp\n' +
        '*~\n' +
        '\n' +
        '# OS generated files\n' +
        '.DS_Store\n' +
        'Thumbs.db\n' +
        '\n' +
        '# Build outputs\n' +
        'dist\ndist/\n' +
        'build\nbuild/\n' +
        '*.min.js\n' +
        '*.min.css\n'
      );

      // Create test files
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await fs.writeFile(path.join(tempDir, 'error.log'), 'error log');
      await fs.writeFile(path.join(tempDir, '.env'), 'secrets');
      await fs.writeFile(path.join(tempDir, '.env.example'), 'example env');
      await fs.writeFile(path.join(tempDir, 'file.swp'), 'vim swap');
      await fs.writeFile(path.join(tempDir, 'backup~'), 'backup file');
      await fs.writeFile(path.join(tempDir, '.DS_Store'), 'mac file');
      await fs.writeFile(path.join(tempDir, 'app.min.js'), 'minified');
      await fs.writeFile(path.join(tempDir, 'style.css'), 'styles');

      await fs.mkdir(path.join(tempDir, 'logs'));
      await fs.mkdir(path.join(tempDir, 'node_modules'));
      await fs.mkdir(path.join(tempDir, '.vscode'));
      await fs.mkdir(path.join(tempDir, 'dist'));

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'error.log'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env.example'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'file.swp'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'backup~'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.DS_Store'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.min.js'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'style.css'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'logs'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'node_modules'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.vscode'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'dist'))).toBe(true);
    });

    test('should integrate .gitignore and config additionalIgnores patterns', async () => {
      // Test that both .gitignore and config patterns work together
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\nnode_modules\nnode_modules/\n');
      
      // Setup config with additional ignores
      await checkpointManager.ensureDirectories();
      const config = {
        maxCheckpoints: 10,
        autoName: true,
        additionalIgnores: ['*.tmp', 'cache', 'cache/', 'secret.txt'],
        nameTemplate: 'checkpoint_{timestamp}'
      };
      await fs.writeFile(checkpointManager.configFile, JSON.stringify(config, null, 2));

      // Create test files
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'log from gitignore');
      await fs.writeFile(path.join(tempDir, 'temp.tmp'), 'tmp from config');
      await fs.writeFile(path.join(tempDir, 'secret.txt'), 'secret from config');
      await fs.mkdir(path.join(tempDir, 'cache'));
      await fs.mkdir(path.join(tempDir, 'node_modules'));

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'debug.log'))).toBe(true); // From .gitignore
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'temp.tmp'))).toBe(true); // From config
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'secret.txt'))).toBe(true); // From config
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'cache'))).toBe(true); // From config
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'node_modules'))).toBe(true); // From .gitignore
    });

    test('should work without .gitignore file', async () => {
      // Test that system works when no .gitignore exists
      await checkpointManager.ensureDirectories();
      const config = {
        maxCheckpoints: 10,
        autoName: true,
        additionalIgnores: ['*.tmp', 'cache', 'cache/'],
        nameTemplate: 'checkpoint_{timestamp}'
      };
      await fs.writeFile(checkpointManager.configFile, JSON.stringify(config, null, 2));

      // Create test files
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await fs.writeFile(path.join(tempDir, 'temp.tmp'), 'tmp file');
      await fs.mkdir(path.join(tempDir, 'cache'));

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'temp.tmp'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'cache'))).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache ignore matcher for performance', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\nnode_modules/\n');
      
      // First call should create the matcher
      const matcher1 = await checkpointManager.getIgnoreMatcher();
      expect(matcher1).toBeDefined();
      
      // Second call should return cached matcher
      const matcher2 = await checkpointManager.getIgnoreMatcher();
      expect(matcher2).toBe(matcher1); // Should be the same object reference
      
      // Verify it's actually cached in the instance
      expect(checkpointManager._ignoreMatcher).toBe(matcher1);
    });

    test('should not re-parse patterns on subsequent shouldIgnore calls', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\n*.tmp\n');
      await fs.writeFile(path.join(tempDir, 'file1.log'), 'log1');
      await fs.writeFile(path.join(tempDir, 'file2.tmp'), 'tmp1');
      await fs.writeFile(path.join(tempDir, 'file3.js'), 'js file');

      // Multiple calls should use cached matcher
      const start = process.hrtime.bigint();
      
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file1.log'));
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file2.tmp'));
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file3.js'));
      
      // Second round should be faster due to caching
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file1.log'));
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file2.tmp'));
      await checkpointManager.shouldIgnore(path.join(tempDir, 'file3.js'));
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      // Should complete reasonably quickly (under 100ms for these simple operations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('getProjectFiles Integration', () => {
    test('should return correctly filtered file list', async () => {
      // Create a realistic project structure
      await fs.writeFile(path.join(tempDir, '.gitignore'), 
        'node_modules/\n' +
        '*.log\n' +
        '.env\n' +
        '!.env.example\n' +
        'dist/\n'
      );

      // Create directory structure
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'dist'), { recursive: true });

      // Create files
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'README.md'), 'readme');
      await fs.writeFile(path.join(tempDir, '.env'), 'secrets');
      await fs.writeFile(path.join(tempDir, '.env.example'), 'example');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'log');
      await fs.writeFile(path.join(tempDir, 'src', 'app.js'), 'app');
      await fs.writeFile(path.join(tempDir, 'src', 'utils.js'), 'utils');
      await fs.writeFile(path.join(tempDir, 'node_modules', 'package.json'), 'dependency');
      await fs.writeFile(path.join(tempDir, 'dist', 'bundle.js'), 'built');

      const files = await checkpointManager.getProjectFiles();
      
      // Should include these files
      expect(files).toContain('package.json');
      expect(files).toContain('README.md');
      expect(files).toContain('.env.example'); // Negation pattern
      expect(files).toContain('src/app.js');
      expect(files).toContain('src/utils.js');
      
      // Should NOT include these files
      expect(files).not.toContain('.env');
      expect(files).not.toContain('debug.log');
      expect(files).not.toContain('node_modules/package.json');
      expect(files).not.toContain('dist/bundle.js');
      
      // Files should be sorted
      const sortedFiles = [...files].sort();
      expect(files).toEqual(sortedFiles);
    });

    test('should handle vendor directory correctly', async () => {
      // Setup config with vendor in additionalIgnores (as per original requirements)
      await checkpointManager.ensureDirectories();
      const config = {
        maxCheckpoints: 10,
        autoName: true,
        additionalIgnores: ['vendor', 'vendor/'],
        nameTemplate: 'checkpoint_{timestamp}'
      };
      await fs.writeFile(checkpointManager.configFile, JSON.stringify(config, null, 2));

      // Create vendor directory
      await fs.mkdir(path.join(tempDir, 'vendor'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'vendor', 'library.js'), 'vendor code');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      const files = await checkpointManager.getProjectFiles();
      
      expect(files).toContain('app.js');
      expect(files).not.toContain('vendor/library.js');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed .gitignore gracefully', async () => {
      // Create .gitignore with some unusual content
      await fs.writeFile(path.join(tempDir, '.gitignore'), 
        '# Normal comment\n' +
        '*.log\n' +
        '\n' +
        '   \n' + // Whitespace only line
        'normal_pattern\n' +
        'spaced_pattern\n' + // Pattern without surrounding spaces (corrected)
        '\n'
      );

      await fs.writeFile(path.join(tempDir, 'test.log'), 'log');
      await fs.writeFile(path.join(tempDir, 'normal_pattern'), 'normal');
      await fs.writeFile(path.join(tempDir, 'spaced_pattern'), 'spaced');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'test.log'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'normal_pattern'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'spaced_pattern'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
    });

    test('should handle empty .gitignore file', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
    });

    test('should handle files with special characters in names', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\n');
      
      // Create files with special characters (that are valid in filenames)
      await fs.writeFile(path.join(tempDir, 'file with spaces.js'), 'spaces');
      await fs.writeFile(path.join(tempDir, 'file-with-dashes.js'), 'dashes');
      await fs.writeFile(path.join(tempDir, 'file_with_underscores.js'), 'underscores');
      await fs.writeFile(path.join(tempDir, 'file.with.dots.js'), 'dots');
      await fs.writeFile(path.join(tempDir, 'special (file).log'), 'should be ignored');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'file with spaces.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'file-with-dashes.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'file_with_underscores.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'file.with.dots.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'special (file).log'))).toBe(true);
    });
  });

  describe('Consistency Validation', () => {
    test('should provide consistent results across multiple calls', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), 
        '*.log\n' +
        'node_modules/\n' +
        '.env*\n' +
        '!.env.example\n'
      );

      await fs.writeFile(path.join(tempDir, 'app.js'), 'app');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'log');
      await fs.writeFile(path.join(tempDir, '.env'), 'env');
      await fs.writeFile(path.join(tempDir, '.env.example'), 'example');

      // Call multiple times and ensure consistent results
      for (let i = 0; i < 5; i++) {
        expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
        expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'debug.log'))).toBe(true);
        expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env'))).toBe(true);
        expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.env.example'))).toBe(false);
      }
    });

    test('should handle relative vs absolute paths consistently', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\nsrc/temp\nsrc/temp/\n');
      
      await fs.mkdir(path.join(tempDir, 'src', 'temp'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'src', 'temp', 'file.js'), 'temp file');
      await fs.writeFile(path.join(tempDir, 'test.log'), 'log');

      // Test with absolute paths
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'test.log'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'src', 'temp', 'file.js'))).toBe(true);
      
      // Results should be consistent regardless of how we reference the files
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'src', 'temp'))).toBe(true);
    });
  });
});