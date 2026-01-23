# Git Worktree Extension - Installation Guide

This guide provides detailed instructions for installing the Git Worktree Manager extension for VS Code from the local source files.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
   - [Method 1: Install from VSIX Package](#method-1-install-from-vsix-package)
   - [Method 2: Load Unpacked Extension](#method-2-load-unpacked-extension)
   - [Method 3: Development Mode](#method-3-development-mode)
3. [Troubleshooting](#troubleshooting)
4. [Post-Installation Verification](#post-installation-verification)

---

## Prerequisites

Before installing the extension, ensure you have the following:

### Required Software

| Software | Minimum Version | How to Check |
|----------|----------------|--------------|
| VS Code | 1.75.0 or higher | `code --version` |
| Git | 2.5.0 or higher | `git --version` |
| Node.js | 14.x or higher | `node --version` |
| npm | 6.x or higher | `npm --version` |

### Verify Prerequisites

```bash
# Check VS Code version
code --version

# Check Git version
git --version

# Check Node.js version
node --version

# Check npm version
npm --version
```

---

## Installation Methods

### Method 1: Install from VSIX Package (Recommended)

This method creates a `.vsix` package file that can be installed in VS Code.

#### Step 1: Navigate to Extension Directory

```bash
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
```

#### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added XXX packages, and audited XXX packages in Xs
found 0 vulnerabilities
```

#### Step 3: Compile the Extension

The extension source files are in the `src/` directory and need to be compiled to JavaScript. The compiled files should already be in the `out/` directory, but if you need to recompile:

```bash
npm run compile
```

**Expected Output:**
```
tsc -p ./
```

#### Step 4: Package the Extension

Create a `.vsix` package using the VS Code Extension Manager (vsce):

```bash
# Option A: If vsce is installed globally
vsce package

# Option B: Using npx (recommended if vsce not installed globally)
npx @vscode/vsce package
```

**Expected Output:**
```
Executing prepublish script 'npm run vscode:prepublish'...
npm run compile
...
Created: /path/to/git-worktree-manager-1.0.0.vsix (XXXX KB)
```

#### Step 5: Install the VSIX Package in VS Code

**Option A: Using Command Palette**

1. Open VS Code
2. Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
3. Type `Extensions: Install from VSIX...`
4. Select the generated `.vsix` file from the extension directory
5. Wait for installation to complete
6. Reload VS Code when prompted

**Option B: Using Command Line**

```bash
# From the extension directory
code --install-extension git-worktree-manager-1.0.0.vsix
```

**Expected Output:**
```
Extension 'git-worktree-manager' was successfully installed!
```

---

### Method 2: Load Unpacked Extension

This method loads the extension directly from the source directory without packaging.

#### Step 1: Ensure Compiled Files Exist

Verify that the `out/` directory contains the compiled JavaScript files:

```bash
ls -la /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension/out/
```

**Expected Output:**
```
extension.js
gitWorktreeManager.js
worktreeProvider.js
```

#### Step 2: Load Extension in VS Code

1. Open VS Code
2. Press `F5` to launch the **Extension Development Host**
   - This opens a new VS Code window with the extension loaded
3. Alternatively, for permanent installation:
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
   - Type `Developer: Load Unpacked Extension`
   - Navigate to and select the extension directory:
     ```
     /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
     ```

#### Step 3: Verify Installation

- Look for the "Git Worktrees" icon in the Activity Bar (left sidebar)
- The extension should appear in the Extensions panel under "Installed"

---

### Method 3: Development Mode

Use this method if you plan to modify the extension or need to debug it.

#### Step 1: Install Dependencies

```bash
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
npm install
```

#### Step 2: Compile the Extension

```bash
npm run compile
```

#### Step 3: Launch Extension Development Host

1. Open the extension folder in VS Code:
   ```bash
   code /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
   ```

2. Press `F5` to launch the Extension Development Host
   - A new VS Code window will open with your extension loaded
   - Changes to the source code will require recompilation

#### Step 4: Enable Auto-Rebuild (Optional)

For development convenience, enable watch mode to automatically rebuild on changes:

```bash
npm run watch
```

In a separate terminal, run this command. It will automatically recompile TypeScript files when they change.

---

## Troubleshooting

### Issue 1: "Cannot find module '@vscode/vsce'"

**Cause:** The vsce package is not installed globally or via npx.

**Solution:**
```bash
# Install vsce globally
npm install -g @vscode/vsce

# Or use npx (no installation needed)
npx @vscode/vsce package
```

---

### Issue 2: "out/extension.js not found"

**Cause:** The extension hasn't been compiled yet.

**Solution:**
```bash
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension
npm run compile
```

---

### Issue 3: "Publisher name is required"

**Cause:** The `package.json` has a placeholder publisher name.

**Solution:**

Edit [`package.json`](package.json:6) and change the publisher field:

```json
{
  "publisher": "your-actual-publisher-name"
}
```

For local development, you can use any name like "local-dev" or "my-publisher".

---

### Issue 4: "SVGs can't be used as icons"

**Cause:** VS Code extensions require PNG format for icons, not SVG.

**Solution:**

The extension now includes PNG icons. If you encounter this error:

1. Convert SVG icons to PNG format:
   ```bash
   # Using Python with PIL/Pillow
   python3 -c "from PIL import Image, ImageDraw; img = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); draw = ImageDraw.Draw(img); draw.rectangle([20, 20, 108, 108], fill=(66, 133, 244, 255), outline=(255, 255, 255, 255), width=4); img.save('resources/icon.png')"
   python3 -c "from PIL import Image, ImageDraw; img = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); draw = ImageDraw.Draw(img); draw.rectangle([10, 10, 118, 118], fill=(66, 133, 244, 255), outline=(255, 255, 255, 255), width=4); draw.rectangle([30, 30, 98, 98], fill=(255, 255, 255, 255), outline=(66, 133, 244, 255), width=3); img.save('resources/worktree-icon.png')"
   ```

2. Update [`package.json`](package.json:79) to reference PNG icons:
   ```json
   {
     "icon": "resources/icon.png"
   }
   ```

3. Update view container and view icons:
   ```json
   {
     "viewsContainers": {
       "activitybar": [
         {
           "icon": "resources/worktree-icon.png"
         }
       ]
     },
     "views": {
       "git-worktree-explorer": [
         {
           "icon": "resources/worktree-icon.png"
         }
       ]
     }
   }
   ```

4. Rebuild the extension:
   ```bash
   npm run compile
   npx @vscode/vsce package
   ```

---

### Issue 5: Extension doesn't appear after installation

**Cause:** VS Code needs to be reloaded or the extension failed to activate.

**Solution:**

1. Reload VS Code:
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
   - Type `Developer: Reload Window`

2. Check Extension Host logs:
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
   - Type `Developer: Show Logs`
   - Select "Extension Host"

3. Verify the extension is enabled:
   - Go to Extensions panel (Ctrl+Shift+X)
   - Search for "Git Worktree Manager"
   - Ensure it's enabled

---

### Issue 6: "No worktrees found" error

**Cause:** Not in a git repository or git worktree support is not available.

**Solution:**

1. Verify you're in a git repository:
   ```bash
   git status
   ```

2. Check git version supports worktrees:
   ```bash
   git --version
   # Should be 2.5.0 or higher
   ```

3. Create a test worktree:
   ```bash
   git worktree add ../test-worktree HEAD
   ```

---

### Issue 7: Permission denied when installing

**Cause:** Insufficient permissions to write to VS Code extensions directory.

**Solution:**

**Linux:**
```bash
# Install with sudo (not recommended for security)
sudo code --install-extension git-worktree-manager-1.0.0.vsix

# Or install to user directory (recommended)
code --install-extension git-worktree-manager-1.0.0.vsix --user
```

**Windows:**
- Run VS Code as Administrator

---

### Issue 8: TypeScript compilation errors

**Cause:** TypeScript version mismatch or missing type definitions.

**Solution:**

```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Recompile
npm run compile
```

---

## Post-Installation Verification

After installing the extension, verify it's working correctly:

### 1. Check Extension is Loaded

1. Open VS Code
2. Go to Extensions panel (`Ctrl+Shift+X`)
3. Search for "Git Worktree Manager"
4. Verify it shows as "Installed" and enabled

### 2. Verify Activity Bar Icon

Look for the "Git Worktrees" icon in the Activity Bar (left sidebar). It should display a worktree icon.

### 3. Test Basic Functionality

1. Open a git repository in VS Code
2. Click on the "Git Worktrees" icon in the Activity Bar
3. You should see a list of worktrees in the sidebar
4. Try creating a new worktree:
   - Click the "+" button in the sidebar
   - Enter a branch name
   - Click OK

### 4. Test Command Palette

1. Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
2. Type "Git Worktree"
3. You should see all extension commands:
   - Git Worktree: List Worktrees
   - Git Worktree: Add New Worktree
   - Git Worktree: Add Worktree from Existing Branch
   - Git Worktree: Remove Worktree
   - Git Worktree: Switch to Worktree
   - Git Worktree: Open Worktree in New Window
   - Git Worktree: Prune Worktrees
   - Git Worktree: Refresh Worktree List
   - Git Worktree: Open Terminal in Worktree

### 5. Check Extension Settings

1. Go to Settings (`Ctrl+,`)
2. Search for "Git Worktree Manager"
3. Verify the following settings are available:
   - Default location for new worktrees
   - Auto-refresh worktree list
   - Show branch names
   - Confirm before remove

---

## Quick Reference Commands

```bash
# Navigate to extension directory
cd /media/system04/4E36DB0524ADCE651/Project/scripts/vscode-git-worktree-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension (creates .vsix file)
npx @vscode/vsce package

# Install .vsix in VS Code
code --install-extension git-worktree-manager-1.0.0.vsix

# Uninstall extension
code --uninstall-extension tryToDEv.git-worktree-manager

# Watch mode for development
npm run watch

# Lint code
npm run lint
```

---

## Additional Resources

- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Extension README](README.md)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Extension Host logs](#issue-4-extension-doesnt-appear-after-installation) for error messages
2. Review the [Troubleshooting section](#troubleshooting) above
3. Consult the main [README.md](README.md) for additional information
4. Check Git worktree support: `git worktree list`

---

## Summary

| Method | Best For | Difficulty | Persistence |
|--------|----------|------------|-------------|
| **VSIX Package** | Production use | Easy | Permanent |
| **Load Unpacked** | Quick testing | Easy | Permanent |
| **Development Mode** | Development/Debugging | Medium | Temporary (per session) |

For most users, **Method 1 (Install from VSIX Package)** is recommended as it provides a clean, permanent installation.
