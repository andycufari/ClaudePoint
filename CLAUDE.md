# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaudePoint is a checkpoint management system for safe experimentation with Claude Code. It provides both CLI and MCP (Model Context Protocol) server functionality to create, manage, and restore codebase snapshots.

## Key Architecture

### Core Components

- **CheckpointManager** (`src/lib/checkpoint-manager.js`) - Core checkpoint functionality with file handling, compression, and metadata management
- **CLI Interface** (`src/cli.js`) - Command-line interface using Commander.js for direct user interaction
- **MCP Server** (`src/mcp-server.js`) - MCP server for Claude Code integration via stdio transport
- **Entry Point** (`bin/claudepoint.js`) - Smart entry point that detects MCP vs CLI mode based on TTY

### Dual Operation Modes

The application automatically detects runtime context:
- **MCP Mode**: When stdin/stdout are not TTY (Claude Code integration)
- **CLI Mode**: When running from terminal with TTY

## Common Development Commands

### Setup and Installation
```bash
npm install                    # Install dependencies
npm run start                  # Run the application
npm run dev                    # Development mode (same as start)
```

### Testing
```bash
npm test                       # Currently returns error - no tests configured
```

### Manual Testing
```bash
# Test CLI functionality
node bin/claudepoint.js setup
node bin/claudepoint.js create --description "Test checkpoint"
node bin/claudepoint.js list

# Test S3 backup functionality
node bin/claudepoint.js s3-config --bucket my-bucket --enable
node bin/claudepoint.js s3-test
node bin/claudepoint.js create --description "Test S3 backup"

# Test MCP server (requires MCP client)
echo '{"method": "initialize"}' | node bin/claudepoint.js
```

## Technical Details

### Checkpoint Storage
- Checkpoints stored in `.checkpoints/snapshots/` directory
- Each checkpoint contains:
  - `manifest.json` - Metadata (name, timestamp, description, file list)
  - `files.tar.gz` - Compressed file archive
- Configuration in `.checkpoints/config.json` (includes S3 backup settings)
- Development history tracked in `.checkpoints/changelog.json`

### S3 Backup Integration
- Optional automatic backup to Amazon S3 after checkpoint creation
- Configurable via CLI commands or MCP tools
- Supports AWS profiles or explicit credentials
- Uploads both tarball and manifest to S3
- S3 backup status logged in development history

### File Filtering
- Respects `.gitignore` patterns automatically
- Additional ignore patterns configurable in config.json
- Default ignores: node_modules, .git, .env files, build directories, IDE files

### MCP Tools Available
- `setup_claudepoint` - Initialize project
- `create_checkpoint` - Create new checkpoint (with optional S3 backup)
- `list_checkpoints` - Show available checkpoints
- `restore_checkpoint` - Restore previous state
- `get_changelog` - View development history
- `set_changelog` - Add custom history entries
- `configure_s3_backup` - Configure S3 backup settings
- `test_s3_connection` - Test S3 connectivity

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@aws-sdk/client-s3` - AWS S3 SDK for backup functionality
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ora` - Spinners
- `inquirer` - Interactive prompts
- `tar` - File compression/extraction

## Configuration

All configuration is handled via `.checkpoints/config.json` with sensible defaults. The configuration includes checkpoint limits, ignore patterns, naming templates, and S3 backup settings.