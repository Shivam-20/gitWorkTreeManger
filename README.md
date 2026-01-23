# Git Worktree Handler VS Code Extension

A powerful VS Code extension that enhances git worktree management with an intuitive interface, making it easier to work with multiple branches simultaneously.

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

### Requirements

- VS Code 1.75.0 or higher
- Git 2.5.0 or higher (for worktree support)
- Node.js 14.x or higher (for development)

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

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
- Try refreshing the worktree view

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

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/Shivam-20/gitWorkTreeManger/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shivam-20/gitWorkTreeManger/discussions)

For questions or feature requests, please use GitHub Issues.

## Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Uses [Git](https://git-scm.com/docs/git-worktree) for worktree management
