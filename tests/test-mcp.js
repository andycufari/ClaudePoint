#!/usr/bin/env node

/**
 * Test script to verify MCP server functionality
 */

console.log('Testing ClaudePoint MCP server...');
console.log('isStdio check:', !process.stdin.isTTY && !process.stdout.isTTY);
console.log('stdin.isTTY:', process.stdin.isTTY);
console.log('stdout.isTTY:', process.stdout.isTTY);

// Force run as MCP server for testing
require('./src/mcp-server.js');