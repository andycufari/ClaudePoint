# ClaudePoint MCP🎯

**The safest way to 'vibe code' with Claude Code.** Create instant checkpoints of your codebase, experiment fearlessly, and restore instantly if things go wrong.

[![npm version](https://badge.fury.io/js/claudepoint.svg)](https://badge.fury.io/js/claudepoint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node-18+-blue.svg)](https://nodejs.org/downloads/)

> *"The undo button your codebase deserves"*

## ✨ Features

- 🚀 **Global NPM package** - Install once, use everywhere
- 🤖 **Claude Code & Desktop integration** - Direct MCP support
- 📋 **Development history & changelog** - Track all activities with automatic logging
- 📝 **Custom changelog entries** - Claude Code can document its own changes
- 📦 **Smart compression** - Efficient tar.gz storage
- 🔍 **Robust ignore handling** - Industry-standard gitignore support with negation patterns
- 🛡️ **Safe restoration** - Auto-backup before every restore
- 🧹 **Auto cleanup** - Configurable checkpoint limits
- ⚡ **Fast operations** - Optimized for development workflows with caching
- 🧪 **Comprehensive testing** - 98%+ test coverage with 51 validation tests

## 🚀 Quick Start

### 1. Install ClaudePoint globally

```bash
npm install -g claudepoint
```

### 2. Configure Claude Code or Claude Desktop

#### For Claude Code (Command Line):
```bash
claude mcp add claudepoint claudepoint
```

#### For Claude Desktop (GUI Application):
Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "claudepoint": {
      "command": "claudepoint",
      "args": []
    }
  }
}
```

### 3. Let Claude manage checkpoints

**In any Claude Code or Claude Desktop conversation:**

- "Setup checkpoints for this project"
- "Create a checkpoint before refactoring"
- "Show me our development history from previous sessions"
- "List all my checkpoints"
- "Restore the checkpoint from before the auth changes"
- "Log that you just refactored the authentication system"

Claude will automatically use ClaudePoint tools!

## 🤖 How to Instruct Claude

Once configured, you can naturally tell Claude:

### **Using Slash Commands (Fastest!):**
```
/create-checkpoint working-auth Everything works perfectly here
/list-checkpoints
/restore-checkpoint
/checkpoint-status
```

### **Project Setup:**
```
"Setup checkpoints for this project and show me what we've worked on before"
```

### **Before making changes:**
```
"Create a checkpoint before you start - call it 'before auth refactor'"
```

### **During development:**
```
"Now refactor the authentication to use OAuth, and log what you're doing"
```

### **After changes:**
```
"Document that you just added the OAuth integration with detailed changelog entry"
```

### **Session context:**
```
"What checkpoints do we have and what was the last thing we were working on?"
```

### **Recovery:**
```
"Something went wrong, restore the last working checkpoint"
```

### **Development timeline:**
```
"Show me our complete development history across all sessions"
```

Claude will handle all operations automatically using the MCP tools!

## 🔧 Manual CLI Usage

You can also use ClaudePoint directly:

```bash
# Setup in any project
cd your-project
claudepoint setup

# Create checkpoint
claudepoint create --description "Before major refactor"

# List checkpoints
claudepoint list

# View development history
claudepoint changelog

# Add custom changelog entry
claudepoint log "Fixed authentication bug" --details "Resolved OAuth token expiration issue" --type "BUG_FIX"

# Restore checkpoint
claudepoint restore "before-major" --dry-run
claudepoint restore "before-major"

# Initialize slash commands for Claude Code
claudepoint init-commands
```

## 🚀 Slash Commands (NEW!)

ClaudePoint now supports Claude Code slash commands for faster operations! These commands appear in Claude Code when you type `/`.

### Setup Slash Commands

```bash
# During initial setup
claudepoint setup

# Or add to existing project
claudepoint init-commands
```

### Available Slash Commands

- **`/create-checkpoint`** - Create a checkpoint with optional name and description
  - Example: `/create-checkpoint auth-working Authentication system complete`
  
- **`/restore-checkpoint`** - Interactive checkpoint restoration
  - Shows numbered list of checkpoints
  - Waits for your selection (by number or name)
  
- **`/list-checkpoints`** - Quick view of all checkpoints
  
- **`/checkpoint-status`** - Current status and recent activity

### How It Works

The slash commands are simple markdown files in `.claude/commands/` that guide Claude to use the appropriate ClaudePoint MCP tools. You can customize them after generation to fit your workflow!

## 🛠️ MCP Tools (For Claude)

When Claude has ClaudePoint configured, it can use:

- **`setup_claudepoint`** - Initialize checkpoints in current project
- **`create_checkpoint`** - Create new checkpoint with name/description
- **`list_checkpoints`** - Show all available checkpoints
- **`restore_checkpoint`** - Restore previous state (with emergency backup)
- **`get_changelog`** - View development history and session activities
- **`set_changelog`** - Add custom entries to development history
- **`init_slash_commands`** - Initialize Claude Code slash commands for the project

## 📋 Development History & Session Continuity

ClaudePoint automatically tracks all your development activities and enables Claude to document its own work:

### **What Gets Tracked Automatically:**
- ✅ **Project setup** - When ClaudePoint was initialized
- ✅ **Checkpoint creation** - Every checkpoint with description
- ✅ **Checkpoint restoration** - When you rolled back changes
- ✅ **Emergency backups** - Auto-backups before restores

### **What Claude Can Log:**
- ✅ **Code changes** - "Refactored authentication system"
- ✅ **Bug fixes** - "Fixed memory leak in user sessions"
- ✅ **Feature additions** - "Added real-time chat functionality"
- ✅ **Optimizations** - "Improved API response times by 40%"

### **Example Development Timeline:**
```
📋 Development History:
1. SETUP - ClaudePoint initialized in project
2. CREATE_CHECKPOINT - Created checkpoint: initial_setup
3. REFACTOR - Refactored authentication system to use OAuth
4. CREATE_CHECKPOINT - Created checkpoint: oauth_implementation  
5. BUG_FIX - Fixed memory leak in user session handling
6. ADD_FEATURE - Added real-time chat functionality
7. RESTORE_CHECKPOINT - Restored checkpoint: oauth_implementation
```

### **Claude Integration Benefits:**
```
You: "What have we been working on?"
Claude: Uses get_changelog → Shows complete development timeline

You: "Refactor the auth system and document what you're doing"
Claude: 
1. Uses create_checkpoint → Saves current state
2. Makes the changes
3. Uses set_changelog → Documents "Refactored authentication to use OAuth"
```

## 🎯 Complete Development Workflow

### 1. Project Setup & Context
```
You: "Setup checkpoints and show me our development history"
Claude: Uses setup_claudepoint + get_changelog → Full project context
```

### 2. Before Major Changes
```
You: "Create a checkpoint before refactoring the auth system"
Claude: Uses create_checkpoint → Saves current state + logs activity
```

### 3. Making Changes with Documentation
```
You: "Refactor authentication to use OAuth and document the changes"
Claude: 
- Makes the changes
- Uses set_changelog → Logs "Refactored authentication system to use OAuth"
```

### 4. If Issues Arise
```
You: "This isn't working, go back to the previous version"
Claude: Uses restore_checkpoint → Emergency backup + restore + logs activity
```

### 5. Next Session
```
You: "What were we working on last time?"
Claude: Uses get_changelog → Shows recent development history with detailed context
```

### 6. Continuing Work
```
You: "Continue where we left off with the authentication refactor"
Claude: Understands context from changelog and continues appropriately
```

## 📁 What Gets Saved

ClaudePoint automatically:
- ✅ **Respects .gitignore** - Industry-standard ignore pattern handling with negation support
- ✅ **Handles complex patterns** - Nested directories, wildcards, and exception rules (!pattern)  
- ✅ **Compresses efficiently** - Uses tar.gz for small storage
- ✅ **Tracks metadata** - Timestamps, descriptions, file counts
- ✅ **Logs activities** - Complete development history in changelog.json
- ✅ **Auto-cleans** - Removes old checkpoints (configurable limit)
- ✅ **Performance optimized** - Cached ignore pattern matching for speed

## 🛡️ Safety Features

### Emergency Backup
Every restore creates an emergency backup first:
```
📦 Emergency backup: emergency_backup_2025-05-30T15-45-30
🔄 Restoring: auth_refactor_2025-05-30T14-30-15
✅ Restore complete!
```

### Dry Run Mode
Preview changes safely:
```
claudepoint restore "checkpoint-name" --dry-run
```

### Smart Name Matching
Use partial names:
```
"Restore the auth checkpoint" → Finds "auth_refactor_2025-05-30T14-30-15"
```

### Complete Session Memory
Track development across sessions:
```
📋 Development History shows exactly what was done when, by whom, and why
```

## ⚙️ Configuration

Auto-created `.checkpoints/config.json`:

```json
{
  "maxCheckpoints": 10,
  "autoName": true,
  "additionalIgnores": ["my-custom-dir"],
  "nameTemplate": "checkpoint_{timestamp}"
}
```

ClaudePoint relies entirely on your project's `.gitignore` file for ignore patterns, with optional `additionalIgnores` for custom exclusions. This provides full gitignore compatibility including negation patterns, nested directories, and complex syntax.

## 🧪 Testing & Quality Assurance

ClaudePoint includes a comprehensive testing infrastructure ensuring reliability and correctness:

### **Test Coverage**
- ✅ **98.36% statement coverage** - Thorough validation of all code paths
- ✅ **100% function coverage** - Every method tested and validated
- ✅ **51 comprehensive tests** - Covering all functionality and edge cases

### **Test Categories**
- **Ignore Pattern Handling** - Complex gitignore syntax, negation patterns, nested directories
- **Performance & Caching** - Ignore matcher caching and optimization validation
- **Configuration Management** - Config loading, merging, and error handling
- **Checkpoint Operations** - Creation, restoration, listing, and cleanup
- **Project Integration** - File discovery, ignore pattern application
- **Error Handling** - Malformed files, missing dependencies, edge cases
- **Changelog Management** - Activity logging and history tracking
- **Utility Functions** - File operations, formatting, and cleanup

### **Running Tests**
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode for development
npm run test:watch
```

### **Quality Validation**
Tests validate all key success factors including:
- ✅ Proper gitignore syntax support with complex patterns
- ✅ Negation pattern support (!pattern exceptions)
- ✅ Nested directory handling (src/**/*.tmp, **/temp/)
- ✅ Performance optimization through caching
- ✅ Consistency between .gitignore and config patterns
- ✅ Error resilience and graceful degradation

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18 or higher
- NPM (comes with Node.js)

### Global Installation
```bash
# Install globally
npm install -g claudepoint

# Verify installation
claudepoint --version
```

### Claude Code Setup
```bash
# Add ClaudePoint as MCP server
claude mcp add claudepoint claudepoint

# Verify configuration
claude mcp list
claude mcp get claudepoint
```

### Claude Desktop Setup

1. **Find your config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add ClaudePoint configuration:**
   ```json
   {
     "mcpServers": {
       "claudepoint": {
         "command": "claudepoint",
         "args": []
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Project Setup
```bash
# In any project directory
cd your-project
claudepoint setup
```

## 🔧 Troubleshooting

### Installation Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm uninstall -g claudepoint
npm install -g claudepoint
```

### Claude Code MCP Issues
```bash
# Check if properly configured
claude mcp list
claude mcp get claudepoint

# Remove and re-add if needed
claude mcp remove claudepoint
claude mcp add claudepoint claudepoint
```

### Claude Desktop Issues
1. Verify config file location and syntax
2. Restart Claude Desktop completely
3. Check that `claudepoint` command works in terminal
4. Ensure Node.js is in system PATH

### "No files found to checkpoint"
1. Run `claudepoint setup` first
2. Check if `.gitignore` is too restrictive
3. Verify you're in a project directory with files

### Command Not Found
```bash
# Check global installation
npm list -g claudepoint

# Check PATH includes npm global bin
npm config get prefix

# If needed, add to PATH or use npx
npx claudepoint setup
```

## 🎉 Pro Tips

### 1. **Always setup first**
```bash
claudepoint setup
```

### 2. **Use descriptive checkpoints**
```
"Create a checkpoint called 'working-auth' - the OAuth integration is perfect here"
```

### 3. **Document your work**
```
"Log that you just optimized the database queries and improved response times by 40%"
```

### 4. **Check session history**
```
"Show me what we worked on in our last few sessions"
```

### 5. **Use dry-run for safety**
```bash
claudepoint restore "some-checkpoint" --dry-run
```

### 6. **Combine with Git perfectly**
- **ClaudePoint**: Rapid experimentation within sessions
- **Git**: Permanent version control across sessions
- **Perfect workflow**: Checkpoint → Experiment → Commit successful changes

## 📊 Why ClaudePoint?

| Feature | ClaudePoint | Git Commits | File Copies |
|---------|------------|-------------|-------------|
| **Setup Time** | 30 seconds | Minutes | Manual |
| **Claude Integration** | ✅ Native | ❌ | ❌ |
| **Auto Documentation** | ✅ With AI | ❌ | ❌ |
| **Session Continuity** | ✅ Complete | ❌ | ❌ |
| **Emergency Backup** | ✅ Always | ❌ | ❌ |
| **Fast Restore** | ✅ Instant | ❌ Complex | ❌ Manual |
| **Space Efficient** | ✅ Compressed | ✅ | ❌ |
| **Development Timeline** | ✅ Rich History | ❌ Basic | ❌ |
| **Gitignore Support** | ✅ Full Syntax | ✅ Basic | ❌ |


## 🤝 Contributing

Want to improve ClaudePoint?

1. Fork: `https://github.com/Andycufari/ClaudePoint`
2. Feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request

## 🐛 Issues & Support

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/Andycufari/ClaudePoint/issues)
- 💡 **Feature requests**: [GitHub Issues](https://github.com/Andycufari/ClaudePoint/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Andycufari/ClaudePoint/discussions)

## ⭐ Show Your Support

If ClaudePoint saves your code (and sanity), give it a star! ⭐

## 📄 License

MIT License - Use it however you want!

---

**Made with ❤️ for the Claude Code community**

Follow [@Andycufari](https://github.com/Andycufari) for more dev tools!
