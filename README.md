# Git Worktree Manager VS Code Extension

A powerful VS Code extension that enhances git worktree management with an intuitive interface, making it easier to work with multiple branches simultaneously.

## Features

### Core Features
- **Visual Worktree Explorer** - See all worktrees in a dedicated sidebar view
- **One-Click Switching** - Switch between worktrees with a single click
- **Smart Worktree Creation** - Create worktrees for new or existing branches
- **Directory Selection** - Choose worktree location via file dialog or manual input
- **Branch Operations** - Switch and create branches within worktrees
- **Sync Operations** - Pull and push changes directly from sidebar
- **Safe Removal** - Remove worktrees with confirmation and force options
- **Terminal Integration** - Open terminals directly in worktree directories
- **Copy Path** - Copy worktree path to clipboard
- **Auto-Refresh** - Automatically refresh when changes occur

### Context Menu Options

When right-clicking on a worktree in the sidebar, you have access to:

**Group 1: Open Actions**
- Switch to Worktree - Open worktree in current window
- Open in New Window - Open worktree in new VS Code window
- Open Terminal - Open terminal in worktree directory
- Copy Path - Copy worktree path to clipboard

**Group 2: Branch Operations**
- Switch Branch - Change to a different branch within the worktree
- Create Branch - Create a new branch in the worktree

**Group 3: Sync Operations**
- Pull Changes - Pull latest changes from remote
- Push Changes - Push local changes to remote

**Group 4: Management**
- Remove Worktree - Delete the worktree (with confirmation)

### Available Commands

| Command | Description | Access Method |
|---------|-------------|----------------|
| `Git Worktree: List Worktrees` | Show all worktrees | Command Palette |
| `Git Worktree: Add New Worktree` | Create worktree for new branch | Command Palette, Sidebar Title |
| `Git Worktree: Add Worktree from Existing Branch` | Create worktree from existing branch | Command Palette, Sidebar Title |
| `Git Worktree: Remove Worktree` | Remove a worktree | Command Palette, Context Menu |
| `Git Worktree: Switch to Worktree` | Switch to a different worktree | Command Palette, Context Menu, Click |
| `Git Worktree: Open Worktree in New Window` | Open worktree in new VS Code window | Command Palette, Context Menu |
| `Git Worktree: Prune Worktrees` | Clean up stale entries | Command Palette, Sidebar Title |
| `Git Worktree: Refresh Worktree List` | Refresh the view | Command Palette, Sidebar Title |
| `Git Worktree: Open Terminal in Worktree` | Launch terminal in worktree directory | Command Palette, Context Menu |
| `Git Worktree: Switch Branch in Worktree` | Change branch within worktree | Command Palette, Context Menu |
| `Git Worktree: Create Branch in Worktree` | Create new branch in worktree | Command Palette, Context Menu |
| `Git Worktree: Pull Changes in Worktree` | Pull from remote | Context Menu |
| `Git Worktree: Push Changes from Worktree` | Push to remote | Context Menu |
| `Git Worktree: Copy Worktree Path` | Copy path to clipboard | Context Menu |

## Installation

### From VSIX Package

1. Download the latest `.vsix` file from the [Releases](https://github.com/Shivam-20/gitWorkTreeManger/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
4. Type `Extensions: Install from VSIX...`
5. Select the downloaded `.vsix` file
6. Click `Install`

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/Shivam-20/gitWorkTreeManger.git
   cd gitWorkTreeManger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Press `F5` to launch the Extension Development Host for testing

## Requirements

- VS Code 1.75.0 or higher
- Git 2.5.0 or higher (for worktree support)
- Node.js 14.x or higher (for development)

## Usage

### Creating a Worktree with File Dialog

1. Press `Ctrl+Shift+P` and type `Git Worktree: Add New Worktree`
2. Enter a branch name (e.g., `feature/my-feature`)
3. Choose location method:
   - **Browse for Directory...** - Opens a file dialog to select a folder
   - **Enter Path Manually** - Type the path directly
4. Select or enter the location
5. Choose to open the new worktree

### Switching Branches in a Worktree

1. Right-click on a worktree in the sidebar
2. Select `Switch Branch in Worktree`
3. Choose a branch from the list
4. The branch is switched within that worktree

### Syncing Changes

1. Right-click on a worktree in the sidebar
2. Select `Pull Changes in Worktree` to pull from remote
3. Or select `Push Changes from Worktree` to push to remote
4. Wait for progress notification

## Configuration

Access settings through `File > Preferences > Settings > Extensions > Git Worktree Manager`:

- **`gitWorktree.defaultLocation`** - Default location for new worktrees (leave empty to use parent of main repository)
- **`gitWorktree.autoRefresh`** - Automatically refresh worktree list when changes are detected
- **`gitWorktree.showBranchNames`** - Show branch names in the worktree list
- **`gitWorktree.confirmBeforeRemove`** - Ask for confirmation before removing a worktree

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
cd ../main
git worktree remove ../my-feature
```

## Development

### Project Structure

```
git-worktree-extension/
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── gitWorktreeManager.ts # Git operations
│   └── worktreeProvider.ts   # Tree data provider
├── out/                      # Compiled JavaScript files
├── resources/
│   ├── icon.png            # Extension icon
│   └── worktree-icon.png   # Activity bar icon
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

### Running Tests

```bash
# Run linter
npm run lint

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup

```bash
git clone https://github.com/Shivam-20/gitWorkTreeManger.git
cd gitWorkTreeManger
npm install
npm run watch  # For development with auto-rebuild
```

Press `F5` to launch the Extension Development Host for testing.

## Troubleshooting

### Common Issues

**"No worktrees found"**
- Ensure you're in a git repository
- Check that git worktrees are supported (`git --version` should be 2.5.0+)

**"Extension not loading"**
- Ensure dependencies are installed: `npm install`
- Compile the extension: `npm run compile`
- Restart VS Code after installing

**"Failed to create worktree"**
- Verify the target directory doesn't already exist
- Ensure the branch name doesn't contain invalid characters
- Check write permissions for the target directory

### Debug Mode

To enable debug logging:
1. Open VS Code settings
2. Search for "Developer: Show Logs"
3. Select "Extension Host" to view extension logs

## License

MIT License - see [LICENSE](LICENSE) file for details

## Changelog

### v1.0.0
- Initial release
- Basic worktree management
- Sidebar view with worktree list
- Command palette integration
- Configuration options
- Visual file dialog for worktree location
- Enhanced context menu with 9 actions
- Branch switching within worktrees
- Pull and push operations from sidebar
- Copy worktree path to clipboard

## Support

- **Issues**: [GitHub Issues](https://github.com/Shivam-20/gitWorkTreeManger/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shivam-20/gitWorkTreeManger/discussions)

For questions or feature requests, please use GitHub Issues.

## Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Uses [Git](https://git-scm.com/docs/git-worktree) for worktree management
- Icons from VS Code theme
