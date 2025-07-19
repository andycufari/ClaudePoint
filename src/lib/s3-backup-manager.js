const { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');

class S3BackupManager {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  async initializeClient() {
    if (!this.config.enabled) {
      throw new Error('S3 backup is not enabled');
    }

    if (!this.config.bucket) {
      throw new Error('S3 bucket is not configured');
    }

    // Configure AWS credentials
    const clientConfig = {
      region: this.config.region || 'us-east-1'
    };

    // Use explicit credentials if provided
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      };
    } else if (this.config.useProfile) {
      // Use AWS profile (default behavior if no explicit credentials)
      // The SDK will automatically use the profile or environment variables
    } else {
      // Use environment variables or instance profile
      // This is the default behavior
    }

    this.client = new S3Client(clientConfig);
  }

  async uploadCheckpoint(checkpointPath, checkpointName, manifest) {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      const tarPath = path.join(checkpointPath, 'files.tar.gz');
      const manifestPath = path.join(checkpointPath, 'manifest.json');

      // Upload tarball
      const tarKey = `${this.config.prefix}${checkpointName}/files.tar.gz`;
      const tarData = await fs.readFile(tarPath);
      
      const tarCommand = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: tarKey,
        Body: tarData,
        ContentType: 'application/gzip',
        Metadata: {
          'checkpoint-name': checkpointName,
          'file-count': manifest.fileCount.toString(),
          'total-size': manifest.totalSize.toString(),
          'timestamp': manifest.timestamp
        }
      });

      const tarResult = await this.client.send(tarCommand);

      // Upload manifest
      const manifestKey = `${this.config.prefix}${checkpointName}/manifest.json`;
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      
      const manifestCommand = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: manifestKey,
        Body: manifestData,
        ContentType: 'application/json',
        Metadata: {
          'checkpoint-name': checkpointName,
          'timestamp': manifest.timestamp
        }
      });

      const manifestResult = await this.client.send(manifestCommand);

      return {
        success: true,
        tarUrl: `s3://${this.config.bucket}/${tarKey}`,
        manifestUrl: `s3://${this.config.bucket}/${manifestKey}`,
        tarETag: tarResult.ETag,
        manifestETag: manifestResult.ETag
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkConnection() {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      // Try to check if bucket exists by attempting to head a dummy object
      const testKey = `${this.config.prefix}connection-test`;
      
      try {
        await this.client.send(new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: testKey
        }));
      } catch (error) {
        // If object doesn't exist, that's fine - we just want to test bucket access
        if (error.name !== 'NotFound') {
          throw error;
        }
      }

      return {
        success: true,
        message: `Successfully connected to S3 bucket: ${this.config.bucket}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanupOldBackups() {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      const { retentionDays, maxBackups, autoCleanup } = this.config;
      
      if (!autoCleanup) {
        return {
          success: true,
          message: 'Auto cleanup is disabled',
          deleted: 0
        };
      }

      // List all objects with the prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: this.config.prefix
      });

      const response = await this.client.send(listCommand);
      
      if (!response.Contents || response.Contents.length === 0) {
        return {
          success: true,
          message: 'No backups found',
          deleted: 0
        };
      }

      // Parse checkpoint names and dates from object keys
      const backups = [];
      for (const object of response.Contents) {
        const key = object.Key;
        if (key.endsWith('manifest.json')) {
          // Extract checkpoint name from key: prefix/checkpoint-name/manifest.json
          const checkpointName = key.replace(this.config.prefix, '').replace('/manifest.json', '');
          
          // Parse timestamp from checkpoint name (format: *_YYYY-MM-DDTHH-MM-SS)
          const timestampMatch = checkpointName.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})$/);
          if (timestampMatch) {
            const timestamp = timestampMatch[1].replace(/-/g, ':').replace('T', 'T').slice(0, -3) + ':' + timestampMatch[1].slice(-2);
            const date = new Date(timestamp);
            
            if (!isNaN(date.getTime())) {
              backups.push({
                name: checkpointName,
                date: date,
                lastModified: object.LastModified,
                key: key.replace('/manifest.json', '')
              });
            }
          }
        }
      }

      // Sort by date (newest first)
      backups.sort((a, b) => b.date - a.date);

      const toDelete = [];
      const now = new Date();
      const retentionDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

      // Mark backups for deletion based on retention rules
      for (let i = 0; i < backups.length; i++) {
        const backup = backups[i];
        const shouldDelete = 
          (i >= maxBackups) || // Exceed max backup count
          (backup.date < retentionDate); // Older than retention period

        if (shouldDelete) {
          toDelete.push(backup);
        }
      }

      // Delete marked backups
      let deletedCount = 0;
      for (const backup of toDelete) {
        try {
          // Delete tarball
          await this.client.send(new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: `${backup.key}/files.tar.gz`
          }));

          // Delete manifest
          await this.client.send(new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: `${backup.key}/manifest.json`
          }));

          deletedCount++;
        } catch (error) {
          // Continue deleting other backups even if one fails
          console.warn(`Failed to delete backup ${backup.name}:`, error.message);
        }
      }

      return {
        success: true,
        message: `Cleaned up ${deletedCount} old backups`,
        deleted: deletedCount,
        total: backups.length,
        retained: backups.length - deletedCount
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listBackups() {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: this.config.prefix
      });

      const response = await this.client.send(listCommand);
      
      if (!response.Contents || response.Contents.length === 0) {
        return {
          success: true,
          backups: []
        };
      }

      const backups = [];
      for (const object of response.Contents) {
        const key = object.Key;
        if (key.endsWith('manifest.json')) {
          const checkpointName = key.replace(this.config.prefix, '').replace('/manifest.json', '');
          backups.push({
            name: checkpointName,
            lastModified: object.LastModified,
            size: object.Size,
            key: key.replace('/manifest.json', '')
          });
        }
      }

      // Sort by last modified (newest first)
      backups.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

      return {
        success: true,
        backups: backups
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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
}

module.exports = S3BackupManager;