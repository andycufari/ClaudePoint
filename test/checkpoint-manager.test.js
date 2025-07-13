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

    test('should always ignore .checkpoints directory', async () => {
      // .checkpoints should be ignored even without explicit configuration
      await checkpointManager.ensureDirectories();
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await fs.writeFile(path.join(tempDir, '.checkpoints', 'config.json'), '{}');

      expect(await checkpointManager.shouldIgnore(path.join(tempDir, 'app.js'))).toBe(false);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.checkpoints'))).toBe(true);
      expect(await checkpointManager.shouldIgnore(path.join(tempDir, '.checkpoints', 'config.json'))).toBe(true);
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

  describe('Configuration Management', () => {
    test('should load default config when no config file exists', async () => {
      const config = await checkpointManager.loadConfig();
      
      expect(config).toEqual({
        maxCheckpoints: 10,
        autoName: true,
        additionalIgnores: [],
        nameTemplate: 'checkpoint_{timestamp}'
      });
      
      // Should create config file
      const configData = await fs.readFile(checkpointManager.configFile, 'utf8');
      const savedConfig = JSON.parse(configData);
      expect(savedConfig).toEqual(config);
    });

    test('should load existing config and merge with defaults', async () => {
      await checkpointManager.ensureDirectories();
      const customConfig = {
        maxCheckpoints: 5,
        additionalIgnores: ['*.tmp', 'cache/']
      };
      await fs.writeFile(checkpointManager.configFile, JSON.stringify(customConfig, null, 2));

      const config = await checkpointManager.loadConfig();
      
      expect(config).toEqual({
        maxCheckpoints: 5,
        autoName: true,
        additionalIgnores: ['*.tmp', 'cache/'],
        nameTemplate: 'checkpoint_{timestamp}'
      });
    });

    test('should handle malformed config file gracefully', async () => {
      await checkpointManager.ensureDirectories();
      await fs.writeFile(checkpointManager.configFile, 'invalid json {');

      const config = await checkpointManager.loadConfig();
      
      // Should fall back to defaults
      expect(config).toEqual({
        maxCheckpoints: 10,
        autoName: true,
        additionalIgnores: [],
        nameTemplate: 'checkpoint_{timestamp}'
      });
    });
  });

  describe('Directory Management', () => {
    test('should ensure directories exist', async () => {
      // Directories shouldn't exist initially
      await expect(fs.access(checkpointManager.checkpointDir)).rejects.toThrow();
      await expect(fs.access(checkpointManager.snapshotsDir)).rejects.toThrow();

      await checkpointManager.ensureDirectories();

      // Directories should exist now
      await expect(fs.access(checkpointManager.checkpointDir)).resolves.not.toThrow();
      await expect(fs.access(checkpointManager.snapshotsDir)).resolves.not.toThrow();
    });

    test('should not fail when directories already exist', async () => {
      await checkpointManager.ensureDirectories();
      await checkpointManager.ensureDirectories(); // Second call should not fail
      
      await expect(fs.access(checkpointManager.checkpointDir)).resolves.not.toThrow();
      await expect(fs.access(checkpointManager.snapshotsDir)).resolves.not.toThrow();
    });
  });

  describe('Checkpoint Naming', () => {
    test('should generate name with custom name', () => {
      const name = checkpointManager.generateCheckpointName('my-checkpoint');
      expect(name).toMatch(/^my-checkpoint_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    test('should generate name from description', () => {
      const name = checkpointManager.generateCheckpointName(null, 'Feature: Add user authentication system');
      expect(name).toMatch(/^feature_add_user_authenticatio_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    test('should generate default name when no custom name or description', () => {
      const name = checkpointManager.generateCheckpointName();
      expect(name).toMatch(/^checkpoint_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    test('should clean description properly', () => {
      const name = checkpointManager.generateCheckpointName(null, 'Test!@#$%^&*()[]{}|\\:";\'<>?,./`~');
      expect(name).toMatch(/^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    test('should truncate long descriptions', () => {
      const longDesc = 'This is a very long description that should be truncated to 30 characters max';
      const name = checkpointManager.generateCheckpointName(null, longDesc);
      expect(name).toMatch(/^this_is_a_very_long_descriptio_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe('Checkpoint Creation', () => {
    test('should create checkpoint successfully', async () => {
      // Create some test files
      await fs.writeFile(path.join(tempDir, 'app.js'), 'console.log("hello");');
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Test Project');
      await fs.mkdir(path.join(tempDir, 'src'));
      await fs.writeFile(path.join(tempDir, 'src', 'index.js'), 'module.exports = {};');

      const result = await checkpointManager.create('test-checkpoint', 'Test checkpoint creation');

      expect(result.success).toBe(true);
      expect(result.name).toMatch(/^test-checkpoint_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
      expect(result.description).toBe('Test checkpoint creation');
      expect(result.fileCount).toBe(3); // .checkpoints directory is now ignored
      expect(result.size).toMatch(/^\d+\.\d+[KMGT]?B$/);

      // Verify checkpoint files exist
      const checkpointPath = path.join(checkpointManager.snapshotsDir, result.name);
      await expect(fs.access(checkpointPath)).resolves.not.toThrow();
      await expect(fs.access(path.join(checkpointPath, 'manifest.json'))).resolves.not.toThrow();
      await expect(fs.access(path.join(checkpointPath, 'files.tar.gz'))).resolves.not.toThrow();

      // Verify manifest content
      const manifestData = await fs.readFile(path.join(checkpointPath, 'manifest.json'), 'utf8');
      const manifest = JSON.parse(manifestData);
      expect(manifest.name).toBe(result.name);
      expect(manifest.description).toBe('Test checkpoint creation');
      expect(manifest.files).toContain('app.js');
      expect(manifest.files).toContain('README.md');
      expect(manifest.files).toContain('src/index.js');
      expect(manifest.files).not.toContain('.checkpoints/config.json'); // Should be ignored
      expect(manifest.fileCount).toBe(3);
    });

    test('should fail when no files found', async () => {
      // Use a gitignore that ignores everything to simulate no files
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*\n');
      await fs.writeFile(path.join(tempDir, 'test.txt'), 'this will be ignored');
      
      const result = await checkpointManager.create('empty-checkpoint', 'Empty test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No files found to checkpoint');
    });

    test('should respect ignore patterns during creation', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*.log\nnode_modules/\n');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await fs.writeFile(path.join(tempDir, 'debug.log'), 'log data');
      await fs.mkdir(path.join(tempDir, 'node_modules'));
      await fs.writeFile(path.join(tempDir, 'node_modules', 'lib.js'), 'library');

      const result = await checkpointManager.create('filtered-checkpoint', 'Test filtering');

      expect(result.success).toBe(true);
      expect(result.fileCount).toBe(2); // app.js and .gitignore only (.checkpoints ignored)

      // Verify manifest
      const checkpointPath = path.join(checkpointManager.snapshotsDir, result.name);
      const manifestData = await fs.readFile(path.join(checkpointPath, 'manifest.json'), 'utf8');
      const manifest = JSON.parse(manifestData);
      expect(manifest.files).toContain('app.js');
      expect(manifest.files).toContain('.gitignore');
      expect(manifest.files).not.toContain('.checkpoints/config.json'); // Should be ignored
      expect(manifest.files).not.toContain('debug.log');
      expect(manifest.files).not.toContain('node_modules/lib.js');
    });
  });

  describe('Checkpoint Listing and Management', () => {
    test('should list checkpoints in reverse chronological order', async () => {
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      // Create multiple checkpoints with small delays
      const checkpoint1 = await checkpointManager.create('first', 'First checkpoint');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const checkpoint2 = await checkpointManager.create('second', 'Second checkpoint');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const checkpoint3 = await checkpointManager.create('third', 'Third checkpoint');

      const checkpoints = await checkpointManager.getCheckpoints();

      expect(checkpoints).toHaveLength(3);
      expect(checkpoints[0].name).toBe(checkpoint3.name); // Most recent first
      expect(checkpoints[1].name).toBe(checkpoint2.name);
      expect(checkpoints[2].name).toBe(checkpoint1.name);
    });

    test('should cleanup old checkpoints when max exceeded', async () => {
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      
      // Set max checkpoints to 2
      await checkpointManager.ensureDirectories();
      const config = { maxCheckpoints: 2, autoName: true, additionalIgnores: [], nameTemplate: 'checkpoint_{timestamp}' };
      await fs.writeFile(checkpointManager.configFile, JSON.stringify(config, null, 2));

      // Create 3 checkpoints
      await checkpointManager.create('first', 'First');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.create('second', 'Second');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.create('third', 'Third'); // This should trigger cleanup

      const checkpoints = await checkpointManager.getCheckpoints();
      
      expect(checkpoints).toHaveLength(2);
      expect(checkpoints[0].description).toBe('Third');
      expect(checkpoints[1].description).toBe('Second');
    });

    test('should handle empty snapshots directory', async () => {
      const checkpoints = await checkpointManager.getCheckpoints();
      expect(checkpoints).toEqual([]);
    });

    test('should skip invalid checkpoint directories', async () => {
      await checkpointManager.ensureDirectories();
      
      // Create a valid checkpoint
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');
      await checkpointManager.create('valid', 'Valid checkpoint');

      // Create invalid directory (no manifest)
      await fs.mkdir(path.join(checkpointManager.snapshotsDir, 'invalid-checkpoint'));
      
      // Create directory with invalid manifest
      const invalidPath = path.join(checkpointManager.snapshotsDir, 'invalid-manifest');
      await fs.mkdir(invalidPath);
      await fs.writeFile(path.join(invalidPath, 'manifest.json'), 'invalid json {');

      const checkpoints = await checkpointManager.getCheckpoints();
      
      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0].description).toBe('Valid checkpoint');
    });
  });

  describe('Utility Functions', () => {
    test('should format file sizes correctly', () => {
      expect(checkpointManager.formatSize(512)).toBe('512.0B');
      expect(checkpointManager.formatSize(1024)).toBe('1.0KB');
      expect(checkpointManager.formatSize(1536)).toBe('1.5KB');
      expect(checkpointManager.formatSize(1024 * 1024)).toBe('1.0MB');
      expect(checkpointManager.formatSize(1024 * 1024 * 1024)).toBe('1.0GB');
      expect(checkpointManager.formatSize(1024 * 1024 * 1024 * 1024)).toBe('1024.0GB');
    });

    test('should cleanup empty directories', async () => {
      // Create nested directory structure
      await fs.mkdir(path.join(tempDir, 'deep', 'nested', 'empty'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'another', 'path'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'another', 'file.txt'), 'content'); // Not empty

      // Verify directories exist
      await expect(fs.access(path.join(tempDir, 'deep', 'nested', 'empty'))).resolves.not.toThrow();
      await expect(fs.access(path.join(tempDir, 'another', 'path'))).resolves.not.toThrow();

      await checkpointManager.cleanupEmptyDirectories();

      // Empty directories should be removed
      await expect(fs.access(path.join(tempDir, 'deep'))).rejects.toThrow();
      
      // Non-empty directories should remain
      await expect(fs.access(path.join(tempDir, 'another'))).resolves.not.toThrow();
      await expect(fs.access(path.join(tempDir, 'another', 'file.txt'))).resolves.not.toThrow();
    });
  });

  describe('Changelog Management', () => {
    test('should log to changelog', async () => {
      await checkpointManager.ensureDirectories();
      await checkpointManager.logToChangelog('TEST_ACTION', 'Test description', 'Test details');

      const changelog = await checkpointManager.getChangelog();
      
      expect(changelog).toHaveLength(1);
      expect(changelog[0].action).toBe('TEST_ACTION');
      expect(changelog[0].description).toBe('Test description');
      expect(changelog[0].details).toBe('Test details');
      expect(changelog[0].timestamp).toBeDefined();
    });

    test('should maintain changelog order (newest first)', async () => {
      await checkpointManager.ensureDirectories();
      await checkpointManager.logToChangelog('FIRST', 'First action');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.logToChangelog('SECOND', 'Second action');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.logToChangelog('THIRD', 'Third action');

      const changelog = await checkpointManager.getChangelog();
      
      expect(changelog).toHaveLength(3);
      expect(changelog[0].action).toBe('THIRD'); // Most recent first
      expect(changelog[1].action).toBe('SECOND');
      expect(changelog[2].action).toBe('FIRST');
    });

    test('should limit changelog to 50 entries', async () => {
      await checkpointManager.ensureDirectories();
      // Add 52 entries
      for (let i = 0; i < 52; i++) {
        await checkpointManager.logToChangelog('ACTION', `Entry ${i}`);
      }

      const changelog = await checkpointManager.getChangelog();
      
      expect(changelog).toHaveLength(50);
      expect(changelog[0].description).toBe('Entry 51'); // Most recent
      expect(changelog[49].description).toBe('Entry 2'); // 50th most recent
    });

    test('should handle empty changelog', async () => {
      const changelog = await checkpointManager.getChangelog();
      expect(changelog).toEqual([]);
    });

    test('should handle malformed changelog file', async () => {
      await checkpointManager.ensureDirectories();
      await fs.writeFile(checkpointManager.changelogFile, 'invalid json {');

      const changelog = await checkpointManager.getChangelog();
      expect(changelog).toEqual([]);
    });

    test('should continue operation when changelog fails', async () => {
      // Make changelog file unwritable by creating it as a directory
      await checkpointManager.ensureDirectories();
      await fs.mkdir(checkpointManager.changelogFile);

      // Should not throw, should continue silently
      await expect(checkpointManager.logToChangelog('TEST', 'Test')).resolves.not.toThrow();
    });
  });

  describe('Project Setup', () => {
    test('should setup project successfully', async () => {
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      const result = await checkpointManager.setup();

      expect(result.success).toBe(true);
      expect(result.initialCheckpoint).toBeDefined();

      // Should create directories
      await expect(fs.access(checkpointManager.checkpointDir)).resolves.not.toThrow();
      await expect(fs.access(checkpointManager.snapshotsDir)).resolves.not.toThrow();

      // Should create config file
      await expect(fs.access(checkpointManager.configFile)).resolves.not.toThrow();

      // Should update .gitignore
      const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      expect(gitignoreContent).toContain('.checkpoints/');
      expect(gitignoreContent).toContain('# ClaudPoint checkpoint system');

      // Should create initial checkpoint
      const checkpoints = await checkpointManager.getCheckpoints();
      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0].name).toMatch(/^initial_/);
    });

    test('should handle setup when no files exist', async () => {
      // Make sure there are absolutely no files by setting up an ignore pattern for everything
      await fs.writeFile(path.join(tempDir, '.gitignore'), '*\n');
      
      const result = await checkpointManager.setup();

      expect(result.success).toBe(true);
      expect(result.initialCheckpoint).toBeNull();

      // Should still create directories and config
      await expect(fs.access(checkpointManager.checkpointDir)).resolves.not.toThrow();
      await expect(fs.access(checkpointManager.configFile)).resolves.not.toThrow();
    });

    test('should not duplicate .gitignore entries', async () => {
      await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules/\n.checkpoints/\n*.log\n');
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      await checkpointManager.setup();

      const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      const matches = gitignoreContent.match(/\.checkpoints\//g);
      expect(matches).toHaveLength(1); // Should only appear once
    });

    test('should handle .gitignore update errors gracefully', async () => {
      // Make .gitignore unwritable by creating it as a directory
      await fs.mkdir(path.join(tempDir, '.gitignore'));
      await fs.writeFile(path.join(tempDir, 'app.js'), 'app code');

      const result = await checkpointManager.setup();

      // Should still succeed even if .gitignore update fails
      expect(result.success).toBe(true);
    });

    test('should handle setup errors gracefully', async () => {
      // Create a scenario that would cause setup to fail
      const invalidCheckpointManager = new CheckpointManager('/invalid/path/that/does/not/exist');
      
      const result = await invalidCheckpointManager.setup();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Checkpoint Restoration', () => {
    let checkpointName;

    beforeEach(async () => {
      // Create initial files and checkpoint
      await fs.writeFile(path.join(tempDir, 'original.js'), 'original content');
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Original README');
      
      const result = await checkpointManager.create('test-restore', 'Checkpoint for restore testing');
      checkpointName = result.name;
      
      // Modify files after checkpoint
      await fs.writeFile(path.join(tempDir, 'original.js'), 'modified content');
      await fs.writeFile(path.join(tempDir, 'new-file.js'), 'new file content');
      await fs.unlink(path.join(tempDir, 'README.md'));
    });

    test('should perform dry run restore', async () => {
      const result = await checkpointManager.restore(checkpointName, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint.name).toBe(checkpointName);

      // Files should not be modified in dry run
      const modifiedContent = await fs.readFile(path.join(tempDir, 'original.js'), 'utf8');
      expect(modifiedContent).toBe('modified content');
    });

    test('should restore checkpoint successfully', async () => {
      const result = await checkpointManager.restore(checkpointName);

      expect(result.success).toBe(true);
      expect(result.emergencyBackup).toBeDefined();
      expect(result.restored).toBe(checkpointName);

      // Original file should be restored
      const restoredContent = await fs.readFile(path.join(tempDir, 'original.js'), 'utf8');
      expect(restoredContent).toBe('original content');

      // README should be restored
      const readmeContent = await fs.readFile(path.join(tempDir, 'README.md'), 'utf8');
      expect(readmeContent).toBe('# Original README');

      // New file should be removed
      await expect(fs.access(path.join(tempDir, 'new-file.js'))).rejects.toThrow();

      // Emergency backup should be created
      const checkpoints = await checkpointManager.getCheckpoints();
      const emergencyBackup = checkpoints.find(cp => cp.name === result.emergencyBackup);
      expect(emergencyBackup).toBeDefined();
    });

    test('should find checkpoint by partial name', async () => {
      const result = await checkpointManager.restore('test-restore'); // Partial name

      expect(result.success).toBe(true);
      expect(result.restored).toBe(checkpointName);
    });

    test('should handle non-existent checkpoint', async () => {
      const result = await checkpointManager.restore('non-existent-checkpoint');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Checkpoint not found');
    });

    test('should handle restore errors gracefully', async () => {
      // Delete the checkpoint tar file to simulate corruption
      const checkpointPath = path.join(checkpointManager.snapshotsDir, checkpointName);
      await fs.unlink(path.join(checkpointPath, 'files.tar.gz'));

      const result = await checkpointManager.restore(checkpointName);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});