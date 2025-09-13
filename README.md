[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/andycufari-claudepoint-badge.png)](https://mseep.ai/app/andycufari-claudepoint)

# ClaudePoint 🚀

**The ultimate hacking companion for Claude Code.** Deploy claudepoints, experiment fearlessly, time travel instantly.

[![npm version](https://badge.fury.io/js/claudepoint.svg)](https://badge.fury.io/js/claudepoint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> *"Like having a time machine for your code - deploy, experiment, undo like a digital wizard"* 🕰️⚡

## What's this?

Ever had that moment when Claude is about to hack your entire codebase and you think "this could either be genius or catastrophic"? That's when you need ClaudePoint.

**Dead simple** - lock in your digital DNA, let Claude break things beautifully, and if the matrix glitches, restore instantly. No git gymnastics, no complexity, just pure hacking power.

## Quick Start (literally 30 seconds) ⚡

```bash
# Install globally
npm install -g claudepoint

# Navigate to your project
cd your-awesome-project

# One-command setup (MCP + Hooks + Commands)
claudepoint setup

# 🚨 IMPORTANT: If you chose global/user scope, run this:
claude mcp add-from-claude-desktop

# You're now equipped to hack fearlessly 🕶️
```

**That's it!** ClaudePoint now works automatically:
- ✅ Creates checkpoints before bulk edits
- ✅ MCP server configured
- ✅ Slash commands installed
- ✅ Ready to use in Claude Code

> **⚠️ Note**: If MCP tools don't appear, make sure you ran `claude mcp add-from-claude-desktop` in your project directory after setup!

## Command Arsenal 🎮

### The Hacker Way
Just tell Claude: "deploy a claudepoint before you start" or "undo to the last claudepoint". The matrix responds instantly.

### Manual Matrix Control
```bash
claudepoint                           # Deploy claudepoint (default action!)
claudepoint undo                      # Instant time hack to last claudepoint
claudepoint changes                   # Scan code matrix for modifications  
claudepoint list                      # Browse your claudepoint vault
claudepoint restore awesome-feature   # Time travel to specific claudepoint
claudepoint config                    # Enter configuration mode
```

## Spectacular Features 🎆

**🕰️ Instant Time Travel** - One command `undo` and you're back to your last stable reality. No questions asked.

**🔍 Change Scanner** - See exactly what files Claude modified since your last claudepoint. Perfect for reviewing AI changes.

**💾 Full Reality Snapshots** - Every claudepoint captures your complete digital universe. No partial saves, no broken dimensions.

**🪝 Auto-Deploy Before Chaos** - Hooks automatically create safety nets before Claude attempts bulk edits. Intelligent anti-spam protection prevents checkpoint flooding (30-second cooldown).

**📊 Adventure Timeline** - Track your coding journey. "What epic changes did we make yesterday?"

**🧹 Smart Cleanup Matrix** - Automatically manages your claudepoint collection by age and count. Set it, forget it, stay organized.

## Real World Matrix Hacking 🌐

```bash
# Before that insane refactor
claudepoint # Deploy instant safety net

# After Claude "optimized" everything and reality collapsed  
claudepoint undo # Back to stable dimension

# Scan what changed in this coding session
claudepoint changes

# Browse your vault of digital artifacts
claudepoint list

# Check your adventure timeline
claudepoint changelog
```

## Configuration Matrix ⚙️

ClaudePoint creates `.claudepoint/config.json` with perfect defaults:

```json
{
  "maxCheckpoints": 10,        // Maintain 10 reality snapshots
  "maxAge": 30,               // Delete ancient claudepoints (0 = eternal)
  "autoName": true,           // Auto-generate epic names
  "ignorePatterns": [         // Exclude from the matrix
    "node_modules", ".git", ".env", "*.log", 
    ".DS_Store", "dist", "build", ".next", ".claudepoint"
  ]
}
```

**Checkpoint Management:**
- Preserves your 10 most recent claudepoints
- Archives anything older than 30 days  
- Runs cleanup automatically after each deployment
- Fully customizable for your workflow

## Claude Code Integration 🤖

**Automatic Setup:**
```bash
claudepoint setup
# Handles everything: MCP server, hooks, and commands

# 🚨 CRITICAL: If you chose global/user scope, run this in your project:
claude mcp add-from-claude-desktop
```

**Scope Options:**
- `claudepoint setup` - Project scope (default)
- `claudepoint setup --scope user` - User scope (all projects)
- `claudepoint setup --scope global` - System-wide

**What it configures:**
1. ⚙️ MCP server for ClaudePoint tools
2. 🪝 Hooks for automatic checkpoints (with intelligent anti-spam)
3. 📝 Slash commands for quick access
4. 💾 Initial checkpoint of your project

## Pro Hacker Tips 🕶️

1. **Hooks are your safety net** - Enable during setup. They'll save you when Claude gets too creative.
2. **Anti-spam protection** - Automatic checkpoints won't spam (30-second cooldown). Manual checkpoints always work.
3. **Name your reality snapshots** - "auth-working" beats "claudepoint_2024_12_15_143022"  
4. **Review the timeline** - `claudepoint changelog` shows your coding adventure history
5. **Tune the matrix** - `claudepoint config` shows all your settings at a glance
6. **Scan before deploying** - `claudepoint changes` shows what Claude modified

## Command Reference 🎯

```bash
# Setup (once per project)
claudepoint setup                     # Complete setup with interactive prompts
claudepoint setup --scope user        # Setup for all your projects
claudepoint setup --scope global      # System-wide setup
claudepoint setup --force             # Reinstall even if configured

# Create checkpoints  
claudepoint                           # Quick deploy (default action)
claudepoint create -d "epic feature"  # Deploy with description
claudepoint create -n "v2.0"         # Deploy with custom name

# Time travel
claudepoint undo                      # Instant restore to last checkpoint  
claudepoint restore v2.0              # Restore specific checkpoint

# Inspect changes
claudepoint changes                   # What changed since last checkpoint
claudepoint list                      # Browse all checkpoints
claudepoint changelog                 # View development history

# Configuration
claudepoint config                    # View current configuration
claudepoint hooks status              # Check hooks integration status

# Maintenance
claudepoint uninstall                 # Remove ClaudePoint from system
claudepoint check-mcp                 # Debug MCP configuration
```

## Available Tools & Commands 🛠️

**Slash Commands (type / in Claude Code):**
- `/claudepoint` - Create a checkpoint
- `/undo` - Quick restore to last checkpoint
- `/claudepoint-list` - Browse your checkpoints
- `/claudepoint-restore` - Restore specific checkpoint
- `/changes` - See what changed
- `/claudepoint-changelog` - View history
- `/ultrathink` - Activate deep reasoning

**MCP Tools (automatic via hooks):**
- `create_claudepoint` - Deploy new checkpoint
- `undo_claudepoint` - Instant restore  
- `list_claudepoints` - Browse collection
- `restore_claudepoint` - Time travel
- `get_changes` - Scan modifications

## Troubleshooting the Matrix 🔧

**"Command not found"** - Add npm global to your PATH:
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

**MCP tools not appearing in Claude Code?**
1. **🚨 MOST COMMON**: Run `claude mcp add-from-claude-desktop` in your project directory
2. Restart Claude Code completely
3. Check that setup completed without errors

**Hooks not responding?** 
1. Run `claudepoint hooks status` to check integration
2. Restart Claude Code after setup
3. Ensure you ran `claudepoint setup` in your project
4. Check `.claudepoint/hooks.log` for detailed debugging

**Claudepoints consuming too much space?** - Add more patterns to `ignorePatterns` in your config matrix

## ClaudePoint vs Git: The Matrix Comparison 📊

| Aspect | ClaudePoint | Git Commits |
|--------|-------------|-------------|
| **Setup Speed** | 30 seconds ⚡ | Several minutes ⏱️ |
| **Complexity** | Hacker-simple 🎯 | Learning curve 📚 |
| **Claude Integration** | ✅ Native matrix powers | ❌ Manual gymnastics |
| **Auto-Safety** | ✅ Before risky changes | ❌ Manual vigilance |
| **Time Travel** | ✅ One command | ❌ Multiple incantations |
| **Reality Snapshots** | ✅ Complete universe | ❌ Partial diffs |
| **Undo Experience** | ✅ `claudepoint undo` | ❌ `git reset --hard` gymnastics |

**The Truth**: ClaudePoint complements Git perfectly. Use Git for version history, ClaudePoint for experimental safety nets!

## Advanced Matrix Hacking 🌟

**Multi-Project Matrix:** ClaudePoint operates per-project. Global hooks automatically detect the correct vault.

**Custom Ignore Patterns:**
```json
{
  "additionalIgnores": ["secret-files", "*.backup"],
  "ignorePatterns": ["node_modules"]  // Complete override
}
```

**Matrix Cleanup Tuning:**
```json
{
  "maxCheckpoints": 25,  // More reality snapshots
  "maxAge": 7           // Weekly archive cycle
}
```

**Force Include Critical Files:**
```json
{
  "forceInclude": ["important-config.*", ".env.example"]
}
```

## Contributing to the Matrix 🤝

Pull requests welcome. Keep it simple. Make it spectacular. Break things beautifully.

## Support the Mission ⭐

Star it on [GitHub](https://github.com/Andycufari/ClaudePoint) if ClaudePoint saved your digital bacon 🥓

Join the hacker revolution - make AI experimentation fearless!

---

**Crafted by [@Andycufari](https://x.com/andycufari) - a vibe coder who learned that even digital wizards need an undo button** 🕶️

*For developers who hack reality with AI and need that safety net when experimenting in the code matrix* 🚀✨

**ClaudePoint: Where fearless experimentation meets instant time travel** ⚡🕰️