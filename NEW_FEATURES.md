# Git Worktree Extension - New Features

This document describes the new features added to the Git Worktree Manager extension.

---

## New Features Overview

### 1. Directory Selection with File Dialog

**Description:** When creating a new worktree, users can now choose the location using a visual file dialog instead of typing the path manually.

**How to Use:**
1. Run `Git Worktree: Add New Worktree` or `Git Worktree: Add Worktree from Existing Branch`
2. Enter a branch name
3. Choose location method:
   - **Browse for Directory...** - Opens a file dialog to select a folder
   - **Enter Path Manually** - Type the path directly

**Benefits:**
- Visual folder selection
- No need to remember exact paths
- Browse through file system
- Supports both methods for flexibility

---

### 2. Enhanced Context Menu for Worktrees

**Description:** Expanded right-click context menu for worktrees in the sidebar with additional actions organized into logical groups.

**New Menu Groups:**

#### Group 1: Open Actions
- **Switch to Worktree** - Open worktree in current window
- **Open in New Window** - Open worktree in new VS Code window
- **Open Terminal** - Open terminal in worktree directory
- **Copy Path** - Copy worktree path to clipboard

#### Group 2: Branch Operations
- **Switch Branch** - Change to a different branch within the worktree
- **Create Branch** - Create a new branch in the worktree

#### Group 3: Sync Operations
- **Pull Changes** - Pull latest changes from remote
- **Push Changes** - Push local changes to remote

#### Group 4: Management
- **Remove Worktree** - Delete the worktree (with confirmation)

---

### 3. Branch Switching in Worktrees

**Description:** Switch to a different branch within a specific worktree without opening it in a new window.

**How to Use:**
1. Right-click on a worktree in the sidebar
2. Select "Switch Branch in Worktree"
3. Choose a branch from the list
4. The branch is switched within that worktree

**Features:**
- Lists all available branches
- Shows current branch
- Supports local and remote branches
- Automatically creates tracking branch for remote branches

---

### 4. Create Branch in Worktree

**Description:** Create a new branch directly within a worktree without switching windows.

**How to Use:**
1. Right-click on a worktree in the sidebar
2. Select "Create Branch in Worktree"
3. Enter new branch name
4. Branch is created in the selected worktree

**Benefits:**
- Quick branch creation
- No need to open worktree first
- Works with any worktree

---

### 5. Pull Changes in Worktree

**Description:** Pull the latest changes from the remote repository directly from the sidebar.

**How to Use:**
1. Right-click on a worktree in the sidebar
2. Select "Pull Changes in Worktree"
3. Changes are pulled with progress indicator

**Features:**
- Progress notification
- Error handling
- Works with any branch

---

### 6. Push Changes from Worktree

**Description:** Push local changes to the remote repository directly from the sidebar.

**How to Use:**
1. Right-click on a worktree in the sidebar
2. Select "Push Changes from Worktree"
3. Changes are pushed with progress indicator

**Features:**
- Progress notification
- Error handling
- Works with any branch

---

### 7. Copy Worktree Path

**Description:** Copy the full path of a worktree to the clipboard.

**How to Use:**
1. Right-click on a worktree in the sidebar
2. Select "Copy Worktree Path"
3. Path is copied to clipboard
4. Confirmation message shown

**Benefits:**
- Quick access to worktree paths
- Useful for sharing paths
- Works in terminal or other applications

---

## Complete Command List

| Command | Description | Access Method |
|----------|-------------|----------------|
| List Worktrees | Show all worktrees | Command Palette |
| Add New Worktree | Create worktree for new branch | Command Palette, Sidebar Title |
| Add Worktree from Existing Branch | Create worktree from existing branch | Command Palette, Sidebar Title |
| Remove Worktree | Remove a worktree | Command Palette, Context Menu |
| Switch to Worktree | Switch to a different worktree | Command Palette, Context Menu, Click |
| Open Worktree in New Window | Open worktree in new VS Code window | Command Palette, Context Menu |
| Open Terminal in Worktree | Open terminal in worktree directory | Command Palette, Context Menu |
| Prune Worktrees | Clean up stale worktree entries | Command Palette, Sidebar Title |
| Refresh Worktree List | Refresh the view | Command Palette, Sidebar Title |
| **Switch Branch in Worktree** | Change branch within worktree | Command Palette, Context Menu |
| **Create Branch in Worktree** | Create new branch in worktree | Command Palette, Context Menu |
| **Pull Changes in Worktree** | Pull from remote | Context Menu |
| **Push Changes from Worktree** | Push to remote | Context Menu |
| **Copy Worktree Path** | Copy path to clipboard | Context Menu |

---

## Context Menu Structure

When right-clicking on a worktree in the sidebar, the context menu is organized as follows:

```
┌─────────────────────────────────────┐
│ Switch to Worktree             │  (inline)
├─────────────────────────────────────┤
│ Open in New Window             │  (1_open)
│ Open Terminal                  │  (1_open)
│ Copy Path                     │  (1_open)
├─────────────────────────────────────┤
│ Switch Branch                  │  (2_branch)
│ Create Branch                  │  (2_branch)
├─────────────────────────────────────┤
│ Pull Changes                  │  (3_sync)
│ Push Changes                  │  (3_sync)
├─────────────────────────────────────┤
│ Remove Worktree               │  (4_manage)
└─────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Create Worktree with File Dialog

```
1. Press Ctrl+Shift+P
2. Type "Git Worktree: Add New Worktree"
3. Enter branch name: "feature/new-ui"
4. Select "Browse for Directory..."
5. Navigate to desired location
6. Click "Select Worktree Location"
7. Choose to open in new window
```

### Example 2: Switch Branch in Worktree

```
1. Right-click on worktree in sidebar
2. Select "Switch Branch in Worktree"
3. Choose branch "develop"
4. Branch switched with notification
```

### Example 3: Pull and Push Changes

```
1. Right-click on worktree in sidebar
2. Select "Pull Changes in Worktree"
3. Wait for progress notification
4. Make changes in worktree
5. Right-click again
6. Select "Push Changes from Worktree"
7. Changes pushed successfully
```

### Example 4: Copy Worktree Path

```
1. Right-click on worktree in sidebar
2. Select "Copy Worktree Path"
3. Path copied to clipboard
4. Paste in terminal: cd <Ctrl+V>
```

---

## Technical Details

### New Methods in GitWorktreeManager

- `switchBranchInWorktree(worktreePath, branchName)` - Switch branch in specific worktree
- `createBranchInWorktree(worktreePath, branchName)` - Create new branch in worktree
- `pullInWorktree(worktreePath)` - Pull changes in worktree
- `pushInWorktree(worktreePath)` - Push changes from worktree
- `getCurrentBranch(worktreePath)` - Get current branch in worktree
- `getWorktreeStatus(worktreePath)` - Get worktree status (clean/dirty)

### New Commands

- `gitWorktree.switchBranch` - Switch branch in worktree
- `gitWorktree.createBranch` - Create branch in worktree
- `gitWorktree.pull` - Pull changes in worktree
- `gitWorktree.push` - Push changes from worktree
- `gitWorktree.copyPath` - Copy worktree path

### Enhanced Helper Function

- `selectLocation(branchName)` - Provides file dialog or manual input options

---

## Configuration

All existing configuration options remain the same:

- `gitWorktree.defaultLocation` - Default location for new worktrees
- `gitWorktree.autoRefresh` - Automatically refresh worktree list
- `gitWorktree.showBranchNames` - Show branch names in worktree list
- `gitWorktree.confirmBeforeRemove` - Ask for confirmation before removing worktree

---

## Benefits Summary

1. **Improved User Experience**
   - Visual directory selection
   - Organized context menus
   - More actions available directly from sidebar

2. **Increased Productivity**
   - No need to open worktrees for simple operations
   - Quick branch switching
   - Fast sync operations

3. **Better Workflow**
   - All common operations available in one place
   - Logical grouping of related actions
   - Consistent with VS Code patterns

4. **Flexibility**
   - Choose between file dialog or manual input
   - Work with any worktree
   - Access all git operations from sidebar

---

## Future Enhancements

Potential future improvements:
- Worktree status indicators (clean/dirty badges)
- Branch comparison view
- Merge conflict resolution
- Worktree search/filter
- Custom context menu actions
- Keyboard shortcuts for common actions

---

## Feedback

If you have suggestions or issues with these new features, please report them via:
- GitHub Issues: https://github.com/your-username/git-worktree-manager/issues
- VS Code Marketplace: Rate and review the extension
