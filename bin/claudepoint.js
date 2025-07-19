#!/usr/bin/env node

/**
 * ClaudePoint Entry Point
 * Detects if running via Claude Code MCP or as CLI
 */

// Check if this is running as an MCP server
// MCP servers communicate via stdin/stdout, so we check for TTY
// CLI mode: both stdin and stdout are TTY
// MCP mode: neither stdin nor stdout are TTY (pipes)
// Also check for CLI arguments to force CLI mode
const hasCliArgs = process.argv.length > 2;
const isMCPServer = !process.stdin.isTTY && !process.stdout.isTTY && !hasCliArgs;

// Debug info for troubleshooting
if (process.env.DEBUG) {
  console.error('ClaudePoint Debug Info:');
  console.error('process.stdin.isTTY:', process.stdin.isTTY);
  console.error('process.stdout.isTTY:', process.stdout.isTTY);
  console.error('isMCPServer:', isMCPServer);
  console.error('process.argv:', process.argv);
  console.error('process.env.NODE_ENV:', process.env.NODE_ENV);
}

async function main() {
  if (isMCPServer) {
    // Running as MCP server via Claude Code
    await import('../src/mcp-server.js');
  } else {
    // Running as CLI
    await import('../src/cli.js');
  }
}

main().catch(error => {
  console.error('Failed to start ClaudePoint:', error);
  process.exit(1);
});