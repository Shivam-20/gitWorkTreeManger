# Git Worktree Manager Extension - Final Installation Instructions

## Overview

The Git Worktree Manager extension for VS Code is now fully compiled and ready for installation. The extension is published at: https://github.com/Shivam-20/gitWorkTreeManger.git

## Quick Installation

### Method 1: Install from Folder (Recommended)

1. Open VS Code
2. Press `F1` or `Ctrl+Shift+P` to open the Command Palette
3. Type "Extensions: Install from VSIX..." and press Enter
4. Navigate to the extension folder: `git-worktree-extension/`
5. Select the extension (VS Code will detect it from the `package.json` file)

### Method 2: Manual Installation

1. Open VS Code
2. Press `F1` or `Ctrl+Shift+P` to open the Command Palette
3. Type "Extensions: Install Extensions" and press Enter
4. Click the "..." menu in the Extensions panel
5. Select "Install from VSIX..."
6. Navigate to the `git-worktree-extension/` directory
7. Select the extension

### Method 3: Using Command Line

```bash
code --install-extension /path/to/git-worktree-extension/
```

## Post-Installation

After installing the extension:

1. **Reload VS Code** - Press `Ctrl+Shift+P` and type "Developer: Reload Window"
2. **Verify Installation** - Look for "Git Worktree Manager" in the Extensions panel
3. **Open a Git Repository** - The extension only works in git repositories
4. **Access the Extension** - The worktree view appears in the sidebar under "Git Worktree Manager"

## Features

The extension includes the following features:

### Core Features
- **List Worktrees** - View all worktrees in the sidebar
- **Create Worktree** - Create new worktrees with custom branches
- **Add Existing Branch** - Create worktree from existing branch
- **Remove Worktree** - Remove worktrees (with confirmation)
- **Prune Worktrees** - Clean up stale worktree entries
- **Auto Refresh** - Automatically refreshes when worktree changes

### New Features
- **Directory Selection with File Dialog** - Browse for worktree location using visual file dialog
- **Switch Branch in Worktree** - Switch to different branches within a worktree
- **Create Branch in Worktree** - Create new branches from within a worktree
- **Pull Changes in Worktree** - Pull changes directly from the sidebar
- **Push Changes from Worktree** - Push changes directly from the sidebar
- **Copy Worktree Path** - Copy worktree path to clipboard
- **Open Terminal** - Open terminal in worktree directory
- **Open in New Window** - Open worktree in new VS Code window

### Enhanced Context Menu
Right-click on any worktree to access:
- **Open Actions**: Switch, Open in New Window, Open Terminal, Copy Path
- **Branch Operations**: Switch Branch, Create Branch
- **Sync Operations**: Pull Changes, Push Changes
- **Management**: Remove Worktree

## Security Improvements

The extension includes security improvements:
- **Branch Name Validation** - Prevents command injection through branch names
- **Path Validation** - Prevents directory traversal and system directory access
- **Remote Detection** - Automatically detects remote name (not hardcoded to 'origin')

## Troubleshooting

### Extension Not Showing
- Reload VS Code window
- Check that you're in a git repository
- Verify the extension is enabled in Extensions panel

### Commands Not Working
- Ensure you have git installed
- Check that the current folder is a git repository
- Try running git commands manually to verify git is working

### Worktree Creation Fails
- Verify the target directory exists and is writable
- Check that the branch name is valid
- Ensure you have the necessary git permissions

## Development

To modify or extend the extension:

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Watch for changes: `npm run watch`
4. Package extension: `npm run package`

## Repository

- **GitHub**: https://github.com/Shivam-20/gitWorkTreeManger.git
- **Latest Commit**: `2c49ad8` - Fix TypeScript compilation error

## Support

For issues or feature requests, please visit the GitHub repository and create an issue.

## Version History

- **v1.0.0** - Initial release with all core features and new enhancements
  - Directory selection with file dialog
  - Enhanced context menu with 9 actions
  - Branch switching and creation in worktrees
  - Pull/push operations
  - Security improvements (branch validation, path validation)
  - Remote detection for robustness
