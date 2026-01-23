# Contributing to Git Worktree Handler

Contributions are welcome! Please follow these guidelines to get started.

## Project Structure

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
└── README.md                 # User documentation
```

## Requirements

- VS Code 1.75.0 or higher
- Git 2.5.0 or higher (for worktree support)
- Node.js 14.x or higher (for development)

## Building

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

## Running Tests

```bash
# Run linter
npm run lint

# Run tests
npm test
```

## Development Setup

```bash
git clone https://github.com/Shivam-20/gitWorkTreeManger.git
cd gitWorkTreeManger
npm install
npm run watch  # For development with auto-rebuild
```

Press `F5` to launch the Extension Development Host for testing.

## Contributing Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
