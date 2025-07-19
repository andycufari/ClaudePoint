#!/usr/bin/env node

/**
 * Test script to check MCP SDK
 */

console.log('Checking MCP SDK...');

try {
  const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
  console.log('✅ MCP SDK loaded successfully');
  console.log('Server constructor:', typeof Server);
  
  // Try to create a simple server
  const server = new Server(
    { name: 'test', version: '1.1.1' },
    { capabilities: { tools: {} } }
  );
  
  console.log('✅ Server created successfully');
  console.log('setRequestHandler method:', typeof server.setRequestHandler);
  
} catch (error) {
  console.error('❌ Error with MCP SDK:', error.message);
  console.error('Full error:', error);
}