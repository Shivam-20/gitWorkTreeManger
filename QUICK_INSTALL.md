# Git Worktree Extension - Quick Install

Quick reference for installing the Git Worktree Manager extension for VS Code.

---

## Quick Install (Automated)

Run the installation script:

```bash
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
./install.sh
```

The script will:
1. ✓ Check prerequisites (VS Code, Git, Node.js, npm)
2. ✓ Install dependencies
3. ✓ Compile the extension
4. ✓ Package the extension (.vsix file)
5. ✓ Install in VS Code
6. ✓ Verify installation

---

## Quick Install (Manual)

### Step 1: Navigate to Extension Directory
```bash
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Package Extension
```bash
npx @vscode/vsce package
```

### Step 4: Install in VS Code
```bash
code --install-extension git-worktree-manager-1.0.0.vsix
```

### Step 5: Reload VS Code
Press `Ctrl+Shift+P` → Type `Developer: Reload Window`

---

## Verify Installation

1. Look for the **"Git Worktrees"** icon in the Activity Bar (left sidebar)
2. Open a git repository to see your worktrees
3. Press `Ctrl+Shift+P` and type "Git Worktree" to see all commands

---

## Uninstall

```bash
code --uninstall-extension tryToDEv.git-worktree-manager
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `vsce not found` | Use `npx @vscode/vsce package` instead |
| `out/extension.js not found` | Run `npm run compile` |
| `SVGs can't be used as icons` | Convert SVG to PNG format (see INSTALLATION_GUIDE.md) |
| Permission denied | Run with `sudo` or use `--user` flag |
| Extension not showing | Reload VS Code window |

For detailed troubleshooting, see [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md).

---

## Extension Features

- **Visual Worktree Explorer** - See all worktrees in sidebar
- **One-Click Switching** - Switch between worktrees easily
- **Smart Creation** - Create worktrees for new or existing branches
- **Directory Selection** - Choose worktree location via file dialog
- **Branch Operations** - Switch and create branches within worktrees
- **Sync Operations** - Pull and push changes directly from sidebar
- **Safe Removal** - Remove worktrees with confirmation
- **Terminal Integration** - Open terminals in worktree directories
- **Copy Path** - Copy worktree path to clipboard
- **Auto-Refresh** - Automatically refresh when changes occur

---

## Commands

| Command | Description |
|---------|-------------|
| `Git Worktree: List Worktrees` | Show all worktrees |
| `Git Worktree: Add New Worktree` | Create worktree for new branch |
| `Git Worktree: Add Worktree from Existing Branch` | Create worktree from existing branch |
| `Git Worktree: Remove Worktree` | Remove a worktree |
| `Git Worktree: Switch to Worktree` | Switch to a different worktree |
| `Git Worktree: Open Worktree in New Window` | Open worktree in new VS Code window |
| `Git Worktree: Prune Worktrees` | Clean up stale entries |
| `Git Worktree: Refresh Worktree List` | Refresh the view |
| `Git Worktree: Open Terminal in Worktree` | Launch terminal in worktree directory |
| `Git Worktree: Switch Branch in Worktree` | Change branch within a worktree |
| `Git Worktree: Create Branch in Worktree` | Create new branch in worktree |
| `Git Worktree: Pull Changes in Worktree` | Pull latest changes from remote |
| `Git Worktree: Push Changes from Worktree` | Push local changes to remote |
| `Git Worktree: Copy Worktree Path` | Copy worktree path to clipboard |

---

## Requirements

- VS Code 1.75.0 or higher
- Git 2.5.0 or higher
- Node.js 14.x or higher

---

## File Structure

```
vscode-git-worktree-extension/
├── out/                    # Compiled JavaScript files
│   ├── extension.js
│   ├── gitWorktreeManager.js
│   └── worktreeProvider.js
├── src/                    # TypeScript source files
│   ├── extension.ts
│   ├── gitWorktreeManager.ts
│   └── worktreeProvider.ts
├── resources/              # Icons and assets
│   ├── icon.svg
│   └── worktree-icon.svg
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── INSTALLATION_GUIDE.md   # Detailed installation guide
├── QUICK_INSTALL.md        # This file
├── install.sh              # Automated installation script
└── README.md               # Extension documentation
```

---

## For More Information

- **Detailed Guide**: [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md)
- **Extension Docs**: [`README.md`](README.md)
- **VS Code Extension API**: https://code.visualstudio.com/api
- **Git Worktree Docs**: https://git-scm.com/docs/git-worktree
