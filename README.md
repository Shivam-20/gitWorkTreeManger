# Git Worktree Handler

A powerful VS Code extension that enhances git worktree management with an intuitive interface and helpful commands, making it easier to work with multiple branches simultaneously.

## Features

- **Explorer View**: Visualize and manage all your worktrees in a dedicated sidebar view.
- **Status Bar Integration**: See your current worktree and branch at a glance in the status bar.
- **Quick Switching**: Easily switch between worktrees using the explorer, Status Bar, or Quick Pick (Ctrl+Shift+P).
- **Visual Indicators**:
  - `*` indicator and orange icons for worktrees with uncommitted changes.
  - `↑`/`↓` indicators for ahead/behind sync status.
- **Worktree Notes**: Attach persistent notes to your worktrees to track tasks or PR numbers.
- **Grouping**: Automatically see your most recently used worktrees in a "Recent" section.
- **Advanced Tools**:
  - **Multi-Search**: Search across all your worktrees simultaneously.
  - **Cleanup**: Identify and bulk-remove worktrees whose branches have already been merged.
  - **Main Branch Switching**: Safely switch your main worktree branch with auto-stashing.
- **Branch Management**: Create, switch, and delete branches directly within worktrees.
- **Smart Creation**:
  - Create new worktrees from new or existing branches.
  - Automatic directory validation and safety checks.
  - Option to open in current or new window.
- **Safety First**:
  - Auto-stashing feature when switching main worktree branches.
  - Protected main worktree deletion.
  - Branch locking detection.
- **Customizable**: Sort worktrees by branch name or path, and configure status bar visibility.

## Usage

### Quick Start
1. Open a folder that is part of a Git repository.
2. Click the **Git Worktree** icon in the Activity Bar.
3. Use the **+** (plus) icon to add a new worktree.

### Common Commands
Open the Command Palette (`Ctrl+Shift+P`) and type `Git Worktree`:

- `Git Worktree: List Worktrees` - Show a quick pick list of all worktrees.
- `Git Worktree: Add New Worktree` - Create a new worktree.
- `Git Worktree: Switch to Worktree` - Switch the current window to another worktree.
- `Git Worktree: Remove Worktree` - Remove a worktree and its directory.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/Shivam-20/gitWorkTreeManger/issues)
- **Source**: [GitHub Repository](https://github.com/Shivam-20/gitWorkTreeManger)
