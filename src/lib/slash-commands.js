import fs from 'fs';
import path from 'path';

const { promises: fsPromises } = fs;

async function initializeSlashCommands(projectRoot = process.cwd()) {
  const commandsDir = path.join(projectRoot, '.claude', 'commands');
  
  // Create commands directory
  await fsPromises.mkdir(commandsDir, { recursive: true });
  
  // Create /create-checkpoint command
  const createCheckpointContent = `---
description: Create a new checkpoint of your codebase
argument-hint: [name] [description]
---

Use the ClaudePoint MCP tool to create a new checkpoint.

If arguments are provided:
- First argument: checkpoint name
- Remaining arguments: description

Example: /create-checkpoint auth-working Authentication system working perfectly

Steps:
1. Use the create_checkpoint tool from ClaudePoint
2. Pass the name and description from $ARGUMENTS if provided
3. Confirm the checkpoint was created successfully
`;
  
  // Create /restore-checkpoint command
  const restoreCheckpointContent = `---
description: Restore a previous checkpoint with interactive selection
---

Help the user restore a checkpoint using ClaudePoint's restore_checkpoint tool.

Steps:
1. First, use the list_checkpoints tool to show all available checkpoints with numbering
2. Ask the user: "Which checkpoint would you like to restore? Please provide the number or name."
3. Wait for the user to respond with their selection
4. Use the restore_checkpoint tool with the selected checkpoint name
5. Confirm the restoration was successful

Important: Always show the numbered list first and wait for user selection.
`;
  
  // Create /list-checkpoints command
  const listCheckpointsContent = `---
description: List all available checkpoints
---

Use the ClaudePoint MCP tool list_checkpoints to show all available checkpoints.

Display the results in a clear, organized format showing:
- Checkpoint name
- Description
- Date created
- Number of files
- Size
`;
  
  // Create /checkpoint-status command
  const checkpointStatusContent = `---
description: Show current checkpoint status and recent activity
---

Show the current status of checkpoints in this project using ClaudePoint tools.

Steps:
1. Use list_checkpoints to get total number of checkpoints and show the latest one
2. Use get_changelog to show recent checkpoint activity
3. Present a summary including:
   - Total number of checkpoints
   - Latest checkpoint details
   - Recent checkpoint operations (last 5 entries)
   
Format the output clearly to give a quick overview of the checkpoint system status.
`;
  
  // Write all command files
  await fsPromises.writeFile(path.join(commandsDir, 'create-checkpoint.md'), createCheckpointContent);
  await fsPromises.writeFile(path.join(commandsDir, 'restore-checkpoint.md'), restoreCheckpointContent);
  await fsPromises.writeFile(path.join(commandsDir, 'list-checkpoints.md'), listCheckpointsContent);
  await fsPromises.writeFile(path.join(commandsDir, 'checkpoint-status.md'), checkpointStatusContent);
  
  return {
    success: true,
    commandsCreated: [
      'create-checkpoint',
      'restore-checkpoint', 
      'list-checkpoints',
      'checkpoint-status'
    ]
  };
}

export { initializeSlashCommands };