#!/usr/bin/env node

/**
 * ClaudePoint MCP Server
 * The safest way to experiment with Claude Code
 * 
 * GitHub: https://github.com/Andycufari/ClaudePoint
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} = require('@modelcontextprotocol/sdk/types.js');
const CheckpointManager = require('./lib/checkpoint-manager.js');

class ClaudePointMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'claudepoint',
        version: '1.1.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Use environment variable, home directory, or current directory (in that order)
    const workingDir = process.env.CLAUDEPOINT_PROJECT_DIR || 
                    process.env.HOME || 
                    process.cwd();
    console.error(`[claudepoint] Using working directory: ${workingDir}`);
    this.manager = new CheckpointManager(workingDir);
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_checkpoint',
            description: 'Create a new checkpoint of the current codebase',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Optional custom name for the checkpoint'
                },
                description: {
                  type: 'string',
                  description: 'Description of what this checkpoint represents'
                }
              }
            }
          },
          {
            name: 'list_checkpoints',
            description: 'List all available checkpoints in the current project',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'restore_checkpoint',
            description: 'Restore a previous checkpoint (creates emergency backup first)',
            inputSchema: {
              type: 'object',
              properties: {
                checkpoint: {
                  type: 'string',
                  description: 'Name or partial name of the checkpoint to restore'
                },
                dry_run: {
                  type: 'boolean',
                  description: 'Preview changes without actually restoring',
                  default: false
                }
              },
              required: ['checkpoint']
            }
          },
          {
            name: 'setup_claudepoint',
            description: 'Setup ClaudePoint in the current project (creates .checkpoints dir, updates .gitignore)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_changelog',
            description: 'Get development history and changelog of all checkpoint activities',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'set_changelog',
            description: 'Add a custom entry to the development history (for Claude Code to log what changes were made)',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Brief description of what changes were made'
                },
                details: {
                  type: 'string',
                  description: 'Optional detailed explanation of the changes'
                },
                action_type: {
                  type: 'string',
                  description: 'Type of action (e.g., REFACTOR, ADD_FEATURE, BUG_FIX, OPTIMIZATION)',
                  default: 'CODE_CHANGE'
                }
              },
              required: ['description']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_checkpoint':
            return await this.handleCreateCheckpoint(args);
          
          case 'list_checkpoints':
            return await this.handleListCheckpoints(args);
          
          case 'restore_checkpoint':
            return await this.handleRestoreCheckpoint(args);
          
          case 'setup_claudepoint':
            return await this.handleSetup(args);
          
          case 'get_changelog':
            return await this.handleGetChangelog(args);
          
          case 'set_changelog':
            return await this.handleSetChangelog(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleCreateCheckpoint(args) {
    const { name, description } = args || {};
    
    try {
      await this.manager.ensureDirectories();
      const files = await this.manager.getProjectFiles();
      
      if (files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ No files found to checkpoint! Make sure you\'re in a project directory and run setup first.'
            }
          ]
        };
      }

      const result = await this.manager.create(name, description);
      
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Checkpoint created: ${result.name}\n   Files: ${result.fileCount}\n   Size: ${result.size}\n   Description: ${result.description || 'Manual checkpoint'}`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create checkpoint: ${result.error}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating checkpoint: ${error.message}`
          }
        ]
      };
    }
  }

  async handleSetChangelog(args) {
    const { description, details, action_type = 'CODE_CHANGE' } = args || {};
    
    if (!description) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Error: Description is required for changelog entry'
          }
        ]
      };
    }

    try {
      await this.manager.logToChangelog(action_type, description, details);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Changelog entry added: ${description}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error adding changelog entry: ${error.message}`
          }
        ]
      };
    }
  }

  async handleGetChangelog(args) {
    try {
      const changelog = await this.manager.getChangelog();
      
      if (changelog.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📋 No development history found. Start creating checkpoints to build your project timeline!'
            }
          ]
        };
      }

      let output = `📋 Development History (${changelog.length} entries):\n\n`;
      
      changelog.slice(0, 10).forEach((entry, index) => {
        output += `${index + 1}. **${entry.action}** - ${entry.timestamp}\n`;
        output += `   ${entry.description}\n`;
        if (entry.details) {
          output += `   _${entry.details}_\n`;
        }
        output += '\n';
      });

      if (changelog.length > 10) {
        output += `... and ${changelog.length - 10} more entries. Use CLI 'claudepoint changelog' for full history.`;
      }

      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error getting changelog: ${error.message}`
          }
        ]
      };
    }
  }

  async handleListCheckpoints(args) {
    try {
      const checkpoints = await this.manager.getCheckpoints();
      
      if (checkpoints.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📋 No checkpoints found. Create your first checkpoint with create_checkpoint!'
            }
          ]
        };
      }

      let output = `📋 Available checkpoints (${checkpoints.length}):\n\n`;
      
      checkpoints.forEach((cp, index) => {
        const date = new Date(cp.timestamp).toLocaleString();
        output += `${index + 1}. ${cp.name}\n`;
        output += `   📝 ${cp.description}\n`;
        output += `   📅 ${date} | ${cp.fileCount} files | ${this.manager.formatSize(cp.totalSize)}\n\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing checkpoints: ${error.message}`
          }
        ]
      };
    }
  }

  async handleRestoreCheckpoint(args) {
    const { checkpoint, dry_run = false } = args || {};
    
    try {
      const checkpoints = await this.manager.getCheckpoints();
      const targetCheckpoint = checkpoints.find(cp => 
        cp.name === checkpoint || cp.name.includes(checkpoint)
      );

      if (!targetCheckpoint) {
        const available = checkpoints.slice(0, 5).map(cp => `  - ${cp.name}`).join('\n');
        return {
          content: [
            {
              type: 'text',
              text: `❌ Checkpoint not found: ${checkpoint}\n\nAvailable checkpoints:\n${available}`
            }
          ]
        };
      }

      if (dry_run) {
        const currentFiles = await this.manager.getProjectFiles();
        const filesToDelete = currentFiles.filter(f => !targetCheckpoint.files.includes(f));
        
        let output = `🔍 DRY RUN - Would restore: ${targetCheckpoint.name}\n`;
        output += `   📝 Description: ${targetCheckpoint.description}\n`;
        output += `   📅 Date: ${new Date(targetCheckpoint.timestamp).toLocaleString()}\n`;
        output += `   📁 Files: ${targetCheckpoint.fileCount}\n`;
        
        if (filesToDelete.length > 0) {
          output += `   🗑️  Would delete ${filesToDelete.length} files that didn't exist in checkpoint\n`;
        }
        
        output += '\nUse restore_checkpoint without dry_run to proceed.';
        
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      }

      // Perform actual restore
      const result = await this.manager.restore(checkpoint, false);
      
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Checkpoint restored successfully!\n   📦 Emergency backup created: ${result.emergencyBackup}\n   🔄 Restored: ${targetCheckpoint.name}\n   📁 Files restored: ${targetCheckpoint.fileCount}`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to restore checkpoint: ${result.error}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error restoring checkpoint: ${error.message}`
          }
        ]
      };
    }
  }

  async handleSetup(args) {
    try {
      const result = await this.manager.setup();
      
      if (result.success) {
        let output = '🚀 ClaudePoint setup complete!\n\n';
        output += '✅ Created .checkpoints directory\n';
        output += '✅ Updated .gitignore\n';
        output += '✅ Created configuration\n';
        
        if (result.initialCheckpoint) {
          output += `✅ Created initial checkpoint: ${result.initialCheckpoint}\n`;
        }
        
        output += '\n📋 Quick commands:\n';
        output += '  • create_checkpoint - Create a new checkpoint\n';
        output += '  • list_checkpoints - See all checkpoints\n';
        output += '  • restore_checkpoint - Restore a previous state\n';
        output += '  • get_changelog - View development history\n';
        output += '\n💡 Tip: Always create a checkpoint before major changes!';
        
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Setup failed: ${result.error}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error during setup: ${error.message}`
            }
          ]
        };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ClaudePoint MCP server running on stdio');
    console.error('Available tools: setup_claudepoint, create_checkpoint, list_checkpoints, restore_checkpoint, get_changelog, set_changelog');
  }
}

// Start the server
const server = new ClaudePointMCPServer();
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = ClaudePointMCPServer;
