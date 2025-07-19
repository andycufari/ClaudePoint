---
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
