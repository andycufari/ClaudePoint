import fs from 'fs';
import path from 'path';
import tar from 'tar';
const ignore = 'ignore';

const { promises: fsPromises } = fs;

class CheckpointManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.checkpointDir = path.join(this.projectRoot, '.checkpoints');
    this.snapshotsDir = path.join(this.checkpointDir, 'snapshots');
    this.configFile = path.join(this.checkpointDir, 'config.json');
    this.changelogFile = path.join(this.checkpointDir, 'changelog.json');
    this._ignoreMatcher = null; // Cache for ignore matcher
  }

  async ensureDirectories() {
    await fsPromises.mkdir(this.checkpointDir, { recursive: true });
    await fsPromises.mkdir(this.snapshotsDir, { recursive: true });
  }

  async loadConfig() {
    const defaultConfig = {
      maxCheckpoints: 10,
      autoName: true,
      additionalIgnores: [],
      nameTemplate: 'checkpoint_{timestamp}'
    };

    try {
      const configData = await fsPromises.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      // Merge with defaults for any missing keys
      return { ...defaultConfig, ...config };
    } catch (error) {
      // Create default config file
      await this.ensureDirectories();
      await fsPromises.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  }

  async getIgnoreMatcher() {
    if (this._ignoreMatcher) {
      return this._ignoreMatcher;
    }

    const ig = ignore();
    const config = await this.loadConfig();

    // Always ignore the .checkpoints directory
    ig.add(['.checkpoints', '.checkpoints/']);

    // Add additional ignore patterns from config
    if (config.additionalIgnores && config.additionalIgnores.length > 0) {
      ig.add(config.additionalIgnores);
    }

    // Add .gitignore patterns if file exists
    try {
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      ig.add(gitignoreContent);
    } catch (error) {
      // No gitignore file, continue with additional patterns only
    }

    this._ignoreMatcher = ig;
    return this._ignoreMatcher;
  }

  async shouldIgnore(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const ig = await this.getIgnoreMatcher();
    
    return ig.ignores(relativePath);
  }

  async getProjectFiles() {
    const files = [];
    
    async function walkDir(dir) {
      try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!(await this.shouldIgnore(fullPath))) {
              await walkDir.call(this, fullPath);
            }
          } else if (entry.isFile()) {
            if (!(await this.shouldIgnore(fullPath))) {
              const relativePath = path.relative(this.projectRoot, fullPath);
              files.push(relativePath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await walkDir.call(this, this.projectRoot);
    return files.sort();
  }

  generateCheckpointName(customName, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (customName) {
      return `${customName}_${timestamp}`;
    }
    
    if (description) {
      const cleanDesc = description.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 30);
      return `${cleanDesc}_${timestamp}`;
    }
    
    return `checkpoint_${timestamp}`;
  }

  async setup() {
    try {
      await this.ensureDirectories();
      
      // Setup gitignore
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      const gitignoreEntry = '.checkpoints/';
      
      try {
        let gitignoreContent = '';
        try {
          gitignoreContent = await fsPromises.readFile(gitignorePath, 'utf8');
        } catch (error) {
          // File doesn't exist, will create new one
        }
        
        if (!gitignoreContent.includes(gitignoreEntry)) {
          const newContent = gitignoreContent + 
            (gitignoreContent && !gitignoreContent.endsWith('\n') ? '\n' : '') +
            '\n# ClaudPoint checkpoint system\n' + gitignoreEntry + '\n';
          await fsPromises.writeFile(gitignorePath, newContent);
        }
      } catch (error) {
        // Could not update .gitignore, continue
      }
      
      // Create initial config
      await this.loadConfig();
      
      // Create initial checkpoint if files exist
      const files = await this.getProjectFiles();
      let initialCheckpoint = null;
      
      if (files.length > 0) {
        const result = await this.create('initial', 'Initial ClaudPoint setup');
        if (result.success) {
          initialCheckpoint = result.name;
        }
      }
      
      return {
        success: true,
        initialCheckpoint
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async create(name, description) {
    try {
      await this.ensureDirectories();
      const files = await this.getProjectFiles();
      
      if (files.length === 0) {
        return {
          success: false,
          error: 'No files found to checkpoint'
        };
      }

      const checkpointName = this.generateCheckpointName(name, description);
      const checkpointPath = path.join(this.snapshotsDir, checkpointName);
      await fsPromises.mkdir(checkpointPath, { recursive: true });

      // Calculate total size
      let totalSize = 0;
      for (const file of files) {
        try {
          const stats = await fsPromises.stat(path.join(this.projectRoot, file));
          totalSize += stats.size;
        } catch (error) {
          // File might have been deleted, skip
        }
      }

      // Create manifest
      const manifest = {
        name: checkpointName,
        timestamp: new Date().toISOString(),
        description: description || 'Manual checkpoint',
        files: files,
        fileCount: files.length,
        totalSize: totalSize
      };

      await fsPromises.writeFile(
        path.join(checkpointPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Create tarball
      const tarPath = path.join(checkpointPath, 'files.tar.gz');
      await tar.create(
        {
          gzip: true,
          file: tarPath,
          cwd: this.projectRoot
        },
        files
      );

      // Cleanup old checkpoints
      await this.cleanupOldCheckpoints();
      
      // Log to changelog
      await this.logToChangelog('CREATE_CHECKPOINT', `Created checkpoint: ${checkpointName}`, manifest.description);
      
      return {
        success: true,
        name: checkpointName,
        description: manifest.description,
        fileCount: files.length,
        size: this.formatSize(totalSize)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restore(checkpointName, dryRun = false) {
    try {
      const checkpoints = await this.getCheckpoints();
      const checkpoint = checkpoints.find(cp => 
        cp.name === checkpointName || cp.name.includes(checkpointName)
      );

      if (!checkpoint) {
        return {
          success: false,
          error: `Checkpoint not found: ${checkpointName}`
        };
      }

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          checkpoint: checkpoint
        };
      }

      // Create emergency backup
      const emergencyName = `emergency_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
      const backupResult = await this.create(emergencyName, 'Auto-backup before restore');
      
      if (!backupResult.success) {
        return {
          success: false,
          error: 'Failed to create emergency backup'
        };
      }

      // Get file differences
      const currentFiles = new Set(await this.getProjectFiles());
      const checkpointFiles = new Set(checkpoint.files);
      const filesToDelete = [...currentFiles].filter(f => !checkpointFiles.has(f));

      // Delete files that shouldn't exist
      for (const file of filesToDelete) {
        const fullPath = path.join(this.projectRoot, file);
        try {
          await fsPromises.unlink(fullPath);
        } catch (error) {
          // File already gone, continue
        }
      }

      // Extract checkpoint files
      const checkpointPath = path.join(this.snapshotsDir, checkpoint.name);
      const tarPath = path.join(checkpointPath, 'files.tar.gz');
      
      await tar.extract({
        file: tarPath,
        cwd: this.projectRoot
      });

      // Clean up empty directories
      await this.cleanupEmptyDirectories();

      // Log to changelog
      await this.logToChangelog('RESTORE_CHECKPOINT', `Restored checkpoint: ${checkpoint.name}`, `Emergency backup: ${emergencyName}`);

      return {
        success: true,
        emergencyBackup: backupResult.name,
        restored: checkpoint.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCheckpoints() {
    try {
      await this.ensureDirectories();
      const entries = await fsPromises.readdir(this.snapshotsDir, { withFileTypes: true });
      const checkpoints = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(this.snapshotsDir, entry.name, 'manifest.json');
          try {
            const manifestData = await fsPromises.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);
            checkpoints.push(manifest);
          } catch (error) {
            // Skip invalid checkpoints
          }
        }
      }

      return checkpoints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  async cleanupOldCheckpoints() {
    const config = await this.loadConfig();
    const checkpoints = await this.getCheckpoints();
    
    if (checkpoints.length > config.maxCheckpoints) {
      const toDelete = checkpoints.slice(config.maxCheckpoints);
      for (const checkpoint of toDelete) {
        const checkpointPath = path.join(this.snapshotsDir, checkpoint.name);
        try {
          await fsPromises.rm(checkpointPath, { recursive: true, force: true });
        } catch (error) {
          // Continue on error
        }
      }
    }
  }

  async cleanupEmptyDirectories() {
    const walkAndClean = async (dir) => {
      try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name);
            await walkAndClean(fullPath);
            
            // Try to remove if empty
            try {
              const remaining = await fsPromises.readdir(fullPath);
              if (remaining.length === 0) {
                await fsPromises.rmdir(fullPath);
              }
            } catch (error) {
              // Directory not empty or other error, continue
            }
          }
        }
      } catch (error) {
        // Can't read directory, continue
      }
    };

    await walkAndClean(this.projectRoot);
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  async logToChangelog(action, description, details = null) {
    try {
      let changelog = [];
      try {
        const changelogData = await fsPromises.readFile(this.changelogFile, 'utf8');
        changelog = JSON.parse(changelogData);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      const entry = {
        timestamp: new Date().toISOString(),
        action,
        description,
        details
      };

      changelog.unshift(entry); // Add to beginning
      
      // Keep only last 50 entries
      if (changelog.length > 50) {
        changelog = changelog.slice(0, 50);
      }

      await fsPromises.writeFile(this.changelogFile, JSON.stringify(changelog, null, 2));
    } catch (error) {
      // Don't fail the main operation if changelog fails
      console.error('Warning: Could not update changelog:', error.message);
    }
  }

  async getChangelog() {
    try {
      const changelogData = await fsPromises.readFile(this.changelogFile, 'utf8');
      const changelog = JSON.parse(changelogData);
      
      // Format timestamps for display
      return changelog.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp).toLocaleString()
      }));
    } catch (error) {
      return [];
    }
  }
}

export default CheckpointManager;