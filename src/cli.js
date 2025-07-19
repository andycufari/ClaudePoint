/**
 * ClaudePoint CLI
 * Command line interface for checkpoint management
 */

import { program } from 'commander';
import CheckpointManager from './lib/checkpoint-manager.js';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { initializeSlashCommands } from './lib/slash-commands.js';

program
  .name('claudepoint')
  .description('The safest way to experiment with Claude Code')
  .version('1.1.2');

program
  .command('setup')
  .description('Setup ClaudePoint in the current project')
  .action(async () => {
    const spinner = ora('Setting up ClaudePoint...').start();
    
    try {
      const manager = new CheckpointManager();
      const result = await manager.setup();
      
      if (result.success) {
        spinner.succeed('ClaudePoint setup complete!');
        console.log(chalk.green('✅ Created .checkpoints directory'));
        console.log(chalk.green('✅ Updated .gitignore'));
        console.log(chalk.green('✅ Created configuration'));
        
        if (result.initialCheckpoint) {
          console.log(chalk.green(`✅ Created initial checkpoint: ${result.initialCheckpoint}`));
        }

        spinner.start('Creating Claude Code slash commands...');
        await initializeSlashCommands();
        spinner.succeed('Slash commands created!');
        console.log(chalk.green('✅ Created .claude/commands directory'));
        console.log(chalk.green('✅ Added /create-checkpoint command'));
        console.log(chalk.green('✅ Added /restore-checkpoint command'));
        console.log(chalk.green('✅ Added /list-checkpoints command'));
        console.log(chalk.green('✅ Added /checkpoint-status command'));
        
        console.log(chalk.blue('\n🚀 Claude Code slash commands:'));
        console.log('  /create-checkpoint - Create a new checkpoint');
        console.log('  /restore-checkpoint - Restore with interactive selection');
        console.log('  /list-checkpoints - List all checkpoints');
        console.log('  /checkpoint-status - Show current status');

        console.log(chalk.blue('\n📋 Quick commands:'));
        console.log('  claudepoint create --description "Your description"');
        console.log('  claudepoint list');
        console.log('  claudepoint restore checkpoint-name');
        console.log(chalk.yellow('\n💡 Tip: Always create a checkpoint before major changes!'));
      } else {
        spinner.fail(`Setup failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Setup failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('create')
  .description('Create a new checkpoint')
  .option('-n, --name <n>', 'Custom checkpoint name')
  .option('-d, --description <description>', 'Checkpoint description')
  .action(async (options) => {
    const spinner = ora('Creating checkpoint...').start();
    
    try {
      const manager = new CheckpointManager();
      const result = await manager.create(options.name, options.description);
      
      if (result.success) {
        spinner.succeed(`Checkpoint created: ${chalk.cyan(result.name)}`);
        console.log(`   Files: ${result.fileCount}`);
        console.log(`   Size: ${result.size}`);
        console.log(`   Description: ${result.description}`);
      } else {
        spinner.fail(`Create failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Create failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all checkpoints')
  .action(async () => {
    try {
      const manager = new CheckpointManager();
      const checkpoints = await manager.getCheckpoints();
      
      if (checkpoints.length === 0) {
        console.log(chalk.yellow('No checkpoints found.'));
        console.log('Create your first checkpoint with: claudepoint create');
        return;
      }

      console.log(chalk.blue(`📋 Available checkpoints (${checkpoints.length}):`));
      checkpoints.forEach((cp, index) => {
        console.log(`  ${chalk.cyan((index + 1) + '.')} ${chalk.bold(cp.name)}`);
        console.log(`     ${cp.description}`);
        console.log(`     ${new Date(cp.timestamp).toLocaleString()} | ${cp.fileCount} files | ${manager.formatSize(cp.totalSize)}`);
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('❌ List failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('restore <checkpoint>')
  .description('Restore a checkpoint')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(async (checkpoint, options) => {
    try {
      const manager = new CheckpointManager();
      
      if (options.dryRun) {
        const checkpoints = await manager.getCheckpoints();
        const targetCheckpoint = checkpoints.find(cp => 
          cp.name === checkpoint || cp.name.includes(checkpoint)
        );

        if (!targetCheckpoint) {
          console.log(chalk.red(`❌ Checkpoint not found: ${checkpoint}`));
          console.log(chalk.blue('Available checkpoints:'));
          checkpoints.slice(0, 5).forEach(cp => {
            console.log(`  - ${cp.name}`);
          });
          return;
        }

        const currentFiles = await manager.getProjectFiles();
        const filesToDelete = currentFiles.filter(f => !targetCheckpoint.files.includes(f));
        
        console.log(chalk.blue(`🔍 DRY RUN - Would restore: ${targetCheckpoint.name}`));
        console.log(`   Description: ${targetCheckpoint.description}`);
        console.log(`   Date: ${new Date(targetCheckpoint.timestamp).toLocaleString()}`);
        console.log(`   Files: ${targetCheckpoint.fileCount}`);
        
        if (filesToDelete.length > 0) {
          console.log(chalk.yellow(`   Would delete ${filesToDelete.length} files that didn't exist in checkpoint`));
        }
        
        console.log('\nUse restore without --dry-run to proceed.');
        return;
      }

      // Create emergency backup and confirm
      console.log(chalk.blue('📦 This will create an emergency backup before restoring...'));
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Restore checkpoint '${checkpoint}'? This will modify your codebase.`,
        default: false
      }]);

      if (!confirm) {
        console.log(chalk.red('❌ Restoration cancelled'));
        return;
      }

      const spinner = ora('Restoring checkpoint...').start();
      const result = await manager.restore(checkpoint, false);
      
      if (result.success) {
        spinner.succeed('Checkpoint restored successfully!');
        console.log(chalk.green(`   Emergency backup created: ${result.emergencyBackup}`));
        console.log(chalk.green(`   Restored: ${result.restored}`));
      } else {
        spinner.fail(`Restore failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Restore failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('changelog')
  .description('Show development history and session log')
  .action(async () => {
    try {
      const manager = new CheckpointManager();
      const changelog = await manager.getChangelog();
      
      if (changelog.length === 0) {
        console.log(chalk.yellow('No development history found.'));
        return;
      }

      console.log(chalk.blue('📋 Development History:'));
      changelog.forEach((entry, index) => {
        console.log(`\n${chalk.cyan((index + 1) + '.')} ${chalk.bold(entry.action)} - ${chalk.green(entry.timestamp)}`);
        console.log(`   ${entry.description}`);
        if (entry.details) {
          console.log(`   ${chalk.gray(entry.details)}`);
        }
      });
    } catch (error) {
      console.error(chalk.red('❌ Changelog failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('log <description>')
  .description('Add a custom entry to the development history')
  .option('-d, --details <details>', 'Detailed explanation of changes')
  .option('-t, --type <type>', 'Action type (CODE_CHANGE, REFACTOR, BUG_FIX, etc.)', 'CODE_CHANGE')
  .action(async (description, options) => {
    try {
      const manager = new CheckpointManager();
      await manager.logToChangelog(options.type, description, options.details);
      console.log(chalk.green(`✅ Changelog entry added: ${description}`));
    } catch (error) {
      console.error(chalk.red('❌ Log failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('init-commands')
  .description('Initialize Claude Code slash commands for ClaudePoint')
  .action(async () => {
    const spinner = ora('Creating Claude Code slash commands...').start();
    
    try {
      await initializeSlashCommands();
      spinner.succeed('Slash commands created successfully!');
      console.log(chalk.green('✅ Created .claude/commands directory'));
      console.log(chalk.green('✅ Added /create-checkpoint command'));
      console.log(chalk.green('✅ Added /restore-checkpoint command'));
      console.log(chalk.green('✅ Added /list-checkpoints command'));
      console.log(chalk.green('✅ Added /checkpoint-status command'));
      
      console.log(chalk.blue('\n🚀 Available slash commands in Claude Code:'));
      console.log('  /create-checkpoint - Create a new checkpoint');
      console.log('  /restore-checkpoint - Restore with interactive selection');
      console.log('  /list-checkpoints - List all checkpoints');
      console.log('  /checkpoint-status - Show current status');
      
      console.log(chalk.yellow('\n💡 Tip: Type / in Claude Code to see available commands!'));
    } catch (error) {
      spinner.fail('Failed to create slash commands');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();