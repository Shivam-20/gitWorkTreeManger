# Git Worktree Manager

A powerful VS Code extension that enhances git worktree management with an intuitive interface, making it easier to work with multiple branches simultaneously.

## Features

### 🔧 Core Features
- **Visual Worktree Explorer**: See all your worktrees in a dedicated sidebar view
- **One-Click Switching**: Switch between worktrees with a single click
- **Smart Worktree Creation**: Create new worktrees for new or existing branches
- **Safe Removal**: Remove worktrees with confirmation and force options
- **Terminal Integration**: Open terminals directly in worktree directories
- **Auto-Refresh**: Automatically refresh the worktree list when changes occur

### 🚀 Quick Commands
- **List Worktrees**: View all worktrees in a quick-pick menu
- **Add New Worktree**: Create worktree for a new branch
- **Add Worktree from Branch**: Create worktree from existing branch
- **Remove Worktree**: Safely remove worktrees
- **Prune Worktrees**: Clean up stale worktree entries
- **Open in New Window**: Open worktrees in separate VS Code windows

## Installation

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to launch Extension Development Host
5. In the Extension Development Host, open the Command Palette (`Ctrl+Shift+P`) and run `Extensions: Install from VSIX`
6. Select the generated `.vsix` file from the project root

### Packaging
```bash
npm run package
```

## Usage

### Sidebar View
The extension adds a "Git Worktrees" view in the Explorer panel. This view shows:
- Main worktree (marked with home icon)
- All additional worktrees (marked with branch icons)
- Branch names and commit hashes in tooltips
- Click any worktree to switch to it

### Command Palette
Access all features through the Command Palette (`Ctrl+Shift+P`):

- `Git Worktree: List Worktrees` - Show all worktrees
- `Git Worktree: Add New Worktree` - Create worktree for new branch
- `Git Worktree: Add Worktree from Existing Branch` - Create worktree from existing branch
- `Git Worktree: Remove Worktree` - Remove a worktree
- `Git Worktree: Switch to Worktree` - Switch to a different worktree
- `Git Worktree: Open Worktree in New Window` - Open worktree in new VS Code window
- `Git Worktree: Prune Worktrees` - Clean up stale entries
- `Git Worktree: Refresh Worktree List` - Refresh the view

### Context Menu
Right-click on worktrees in the sidebar for quick actions:
- **Switch to Worktree**: Open in current window
- **Open in New Window**: Open in separate VS Code window
- **Open Terminal**: Launch terminal in worktree directory
- **Remove Worktree**: Delete the worktree

## Configuration

Access settings through `File > Preferences > Settings > Extensions > Git Worktree Manager`:

### Settings
- **`gitWorktree.defaultLocation`**: Default location for new worktrees (leave empty to use parent of main repository)
- **`gitWorktree.autoRefresh`**: Automatically refresh worktree list when changes are detected
- **`gitWorktree.showBranchNames`**: Show branch names in the worktree list
- **`gitWorktree.confirmBeforeRemove`**: Ask for confirmation before removing a worktree

## Requirements

- VS Code 1.75.0 or higher
- Git 2.5.0 or higher (for worktree support)
- Node.js 14.x or higher (for development)

## Git Worktree Basics

Git worktrees allow you to have multiple working directories for the same repository, each checked out to different branches. This is perfect for:

- Working on multiple features simultaneously
- Reviewing pull requests locally
- Testing different branches without stashing changes
- Continuous integration scenarios

### Example Workflow
```bash
# Create a new worktree for a feature branch
git worktree add ../my-feature feature/my-feature

# Switch between worktrees
cd ../my-feature
# Edit files...
git add .
git commit -m "Implement feature"

# Clean up when done
git worktree remove ../my-feature
```

## Troubleshooting

### Common Issues

**"No worktrees found"**
- Ensure you're in a git repository
- Check that git worktrees are supported (`git --version` should be 2.5.0+)

**"Failed to create worktree"**
- Verify the target directory doesn't already exist
- Ensure the branch name doesn't contain invalid characters
- Check write permissions for the target directory

**Extension not loading**
- Ensure dependencies are installed: `npm install`
- Compile the extension: `npm run compile`
- Restart VS Code after installing

### Debug Mode
To enable debug logging:
1. Open VS Code settings
2. Search for "Developer: Show Logs"
3. Select "Extension Host" to view extension logs

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
```bash
git clone <your-fork-url>
cd vscode-git-worktree-extension
npm install
npm run watch  # For development with auto-rebuild
```

Press `F5` to launch the Extension Development Host for testing.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Basic worktree management
- Sidebar view
- Command palette integration
- Configuration options

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/git-worktree-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/git-worktree-manager/discussions)

For questions or feature requests, please use GitHub Issues.
