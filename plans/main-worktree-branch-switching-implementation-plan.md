# Main Worktree Branch Switching Feature - Implementation Plan

## Overview

This document outlines the implementation of a new feature for the Git Worktree Manager extension that provides the capability to switch the active branch on the main (master) worktree repository with safety checks to prevent disruption of linked worktrees.

---

## 1. Feature Requirements

### 1.1 Core Functionality
- Switch the active branch on the main worktree repository
- Prevent switching to a branch that is currently checked out in another worktree
- Provide clear error messages when branch switching is blocked
- Maintain branch visibility consistency across all worktrees

### 1.2 Safety Mechanisms
- Check if target branch is locked (checked out in another worktree)
- Warn user before switching if main worktree has uncommitted changes
- Prevent switching if it would cause conflicts
- Maintain worktree integrity during the operation

### 1.3 User Experience
- Dedicated command for main worktree branch switching
- Visual feedback during the operation
- Clear success/error messages
- Auto-refresh of worktree list after successful switch

---

## 2. Architecture Analysis

### 2.1 Existing Architecture

The extension follows a clean separation of concerns:

```
┌─────────────────────────────────────────┐
│         extension.ts                    │
│  (Command Registration & UI Logic)      │
└──────────────┬──────────────────────────┘
               │
               ├──────────────────────────────────────┐
               │                                      │
┌──────────────▼──────────────────┐  ┌───────────────▼────────────────┐
│  gitWorktreeManager.ts           │  │  worktreeProvider.ts           │
│  (Git Operations & State)        │  │  (Tree View Data Provider)     │
└──────────────────────────────────┘  └────────────────────────────────┘
```

### 2.2 Relevant Existing Methods

#### In [`gitWorktreeManager.ts`](src/gitWorktreeManager.ts):

1. **`listWorktrees()`** (lines 53-61): Lists all worktrees with their current branches
2. **`listBranches()`** (lines 95-106): Lists all local and remote branches
3. **`switchBranchInWorktree()`** (lines 159-184): Switches branch in a specific worktree
4. **`getCurrentBranch()`** (lines 214-221): Gets current branch in a worktree
5. **`getWorktreeStatus()`** (lines 236-243): Gets worktree status (clean/dirty)

#### In [`extension.ts`](src/extension.ts):

1. **`validateGitRepository()`** (lines 21-28): Validates git repository
2. **`gitWorktree.switchBranch`** command (lines 408-471): Generic branch switching for any worktree

### 2.3 Key Insight

The existing `switchBranchInWorktree()` method already works for any worktree, including the main one. However, it lacks:
- Specific safety checks for main worktree operations
- Branch locking detection before attempting checkout
- Enhanced error handling for main worktree scenarios

---

## 3. Implementation Design

### 3.1 New Method: `switchMainWorktreeBranch()`

Add a new method to [`gitWorktreeManager.ts`](src/gitWorktreeManager.ts) that:

1. Identifies the main worktree
2. Checks if target branch is locked in another worktree
3. Validates the main worktree has no uncommitted changes
4. Performs the branch switch
5. Returns detailed status information

### 3.2 Helper Methods to Add

#### `getMainWorktreePath()`
- Returns the path of the main worktree
- Uses `git worktree list` to identify which worktree is marked as main

#### `isBranchLocked()`
- Checks if a branch is currently checked out in any worktree
- Returns the worktree path where it's locked, or null if available

#### `getBranchLockingWorktree()`
- Returns the worktree that has the target branch checked out
- Returns null if branch is not locked

### 3.3 New Command: `gitWorktree.switchMainBranch`

Add a new command in [`extension.ts`](src/extension.ts) that:

1. Validates git repository
2. Gets current branch of main worktree
3. Lists available branches (excluding locked ones)
4. Presents branch selection to user
5. Performs safety checks
6. Executes branch switch
7. Refreshes worktree view

### 3.4 Package.json Updates

Add the new command to the `contributes.commands` and `contributes.menus` sections in [`package.json`](package.json).

---

## 4. Technical Git Commands

### 4.1 Identifying the Main Worktree

```bash
# List all worktrees in porcelain format
git worktree list --porcelain

# Output format:
# worktree /path/to/main-repo
# HEAD 1a2b3c4d
# branch refs/heads/main
# 
# worktree /path/to/feature-worktree
# HEAD 5e6f7g8h
# branch refs/heads/feature-branch
```

The main worktree is typically the first one listed or can be identified by checking if it contains the `.git` directory (not a `.git` file).

### 4.2 Checking Branch Lock Status

```bash
# Check which branches are checked out in which worktrees
git worktree list

# Check if a specific branch is checked out
git branch --show-current  # Run in each worktree

# Alternative: Check worktree metadata
cat .git/worktrees/<worktree-name>/HEAD
```

### 4.3 Switching Branch on Main Worktree

```bash
# Standard checkout (will fail if branch is locked elsewhere)
git checkout <branch-name>

# Force checkout (not recommended, may cause conflicts)
git checkout -f <branch-name>

# Checkout with merge strategy
git checkout -m <branch-name>
```

### 4.4 Checking Worktree Status

```bash
# Check if worktree has uncommitted changes
git status --porcelain

# Check if working directory is clean
[ -z "$(git status --porcelain)" ]
```

### 4.5 Branch Visibility Management

```bash
# List all branches (shared across all worktrees)
git branch -a

# Show which branch is currently checked out in this worktree
git rev-parse --abbrev-ref HEAD

# Show all worktrees and their branches
git worktree list
```

---

## 5. Safety Mechanisms

### 5.1 Branch Locking Detection

Before switching, the extension must:

1. Query all worktrees using `git worktree list`
2. Extract the branch currently checked out in each worktree
3. Check if the target branch appears in any worktree's current branch
4. If locked, provide clear error message with the locking worktree's path

### 5.2 Uncommitted Changes Check

Before switching, the extension must:

1. Run `git status --porcelain` in the main worktree
2. If output is non-empty, warn the user
3. Offer options:
   - Stash changes before switching
   - Commit changes before switching
   - Cancel the operation

### 5.3 Worktree Integrity

The extension must ensure:

1. The main worktree is correctly identified
2. The `.git` directory structure remains intact
3. All linked worktrees remain functional
4. No detached HEAD states are accidentally created

---

## 6. Implementation Steps

### Step 1: Add Helper Methods to `gitWorktreeManager.ts`

```typescript
// Get the main worktree path
async getMainWorktreePath(): Promise<string | null>

// Check if a branch is locked in another worktree
async isBranchLocked(branchName: string): Promise<boolean>

// Get the worktree that has a branch locked
async getBranchLockingWorktree(branchName: string): Promise<Worktree | null>

// Switch branch on main worktree with safety checks
async switchMainWorktreeBranch(branchName: string): Promise<{
    success: boolean;
    message: string;
    previousBranch?: string;
    newBranch?: string;
}>
```

### Step 2: Add New Command to `extension.ts`

```typescript
// Register new command for main worktree branch switching
vscode.commands.registerCommand('gitWorktree.switchMainBranch', async () => {
    // Implementation
})
```

### Step 3: Update `package.json`

Add new command definition and menu items.

### Step 4: Add Context Menu Item

Add the new command to the context menu for the main worktree item.

### Step 5: Testing

Test various scenarios:
- Switching to an available branch
- Attempting to switch to a locked branch
- Switching with uncommitted changes
- Switching from detached HEAD state

---

## 7. Code Modifications Required

### 7.1 Modifications to `src/gitWorktreeManager.ts`

Add the following methods after line 244:

1. `getMainWorktreePath()` - ~20 lines
2. `isBranchLocked()` - ~15 lines
3. `getBranchLockingWorktree()` - ~20 lines
4. `switchMainWorktreeBranch()` - ~50 lines

Total: ~105 new lines

### 7.2 Modifications to `src/extension.ts`

Add new command registration after line 592:

1. New command handler for `gitWorktree.switchMainBranch` - ~80 lines

Total: ~80 new lines

### 7.3 Modifications to `package.json`

Add to `contributes.commands` section:

```json
{
  "command": "gitWorktree.switchMainBranch",
  "title": "Switch Main Worktree Branch",
  "category": "Git Worktree"
}
```

Add to `contributes.menus.view/item/context` section:

```json
{
  "command": "gitWorktree.switchMainBranch",
  "when": "view == gitWorktreeView && viewItem == worktree && worktree.isMain",
  "group": "2_branch@0"
}
```

---

## 8. Error Handling

### 8.1 Error Scenarios

| Scenario | Error Message | Resolution |
|----------|---------------|------------|
| Branch locked in another worktree | "Branch 'feature-x' is already checked out at /path/to/worktree" | User must switch that worktree to a different branch first |
| Uncommitted changes | "Main worktree has uncommitted changes. Please commit or stash before switching." | Offer to stash or cancel |
| Branch not found | "Branch 'nonexistent' not found" | Verify branch name or create new branch |
| Not a git repository | "Not a git repository" | Open a git repository |
| Git command failed | "Git command failed: [error details]" | Show detailed error to user |

### 8.2 Success Scenarios

| Scenario | Success Message |
|----------|-----------------|
| Successful branch switch | "Switched main worktree from 'old-branch' to 'new-branch'" |
| Branch already checked out | "Already on branch 'main'" |

---

## 9. User Interface Design

### 9.1 Command Palette Access

Users can access the feature via:
- Command Palette: `Git Worktree: Switch Main Worktree Branch`
- Context menu on main worktree item in sidebar

### 9.2 Branch Selection UI

```
┌─────────────────────────────────────────┐
│ Select branch to switch to              │
│ (current: main)                         │
├─────────────────────────────────────────┤
│ develop                                 │
│ feature/auth                            │
│ feature/ui                              │
│ release/v1.0.0                          │
└─────────────────────────────────────────┘
```

### 9.3 Confirmation Dialog (if changes detected)

```
┌─────────────────────────────────────────┐
│ Main worktree has uncommitted changes.  │
│                                         │
│ What would you like to do?              │
│                                         │
│ [Stash Changes] [Commit Changes]       │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Future Enhancement)

- Test `getMainWorktreePath()` with various repository structures
- Test `isBranchLocked()` with different branch states
- Test `switchMainWorktreeBranch()` with various scenarios

### 10.2 Integration Tests

1. **Happy Path**: Switch main worktree to an available branch
2. **Branch Locked**: Attempt to switch to a locked branch
3. **Uncommitted Changes**: Switch with dirty working directory
4. **Detached HEAD**: Switch from detached HEAD state
5. **Non-existent Branch**: Attempt to switch to invalid branch

### 10.3 Manual Testing Checklist

- [ ] Switch main worktree to different branch
- [ ] Attempt to switch to branch locked in another worktree
- [ ] Switch with uncommitted changes (test stash option)
- [ ] Switch from detached HEAD state
- [ ] Verify worktree list refreshes after switch
- [ ] Verify all worktrees remain functional after switch
- [ ] Test with multiple worktrees

---

## 11. Documentation Updates

### 11.1 README.md Updates

Add new command to the "Available Commands" table:

| Command | Description | Access Method |
|---------|-------------|----------------|
| `Git Worktree: Switch Main Worktree Branch` | Switch branch on main worktree with safety checks | Command Palette, Context Menu (main worktree only) |

### 11.2 Feature Documentation

Create a new section explaining:
- How to use the main worktree branch switching feature
- Safety mechanisms in place
- Common scenarios and how to handle them

---

## 12. Future Enhancements

### 12.1 Potential Improvements

1. **Batch Operations**: Switch multiple worktrees at once
2. **Branch Preview**: Show diff before switching
3. **Auto-Stash**: Option to automatically stash changes
4. **Branch Locking UI**: Visual indicator of locked branches
5. **Worktree Health Check**: Verify all worktrees are in valid state

### 12.2 Advanced Features

1. **Branch Switching with Merge**: Option to merge changes during switch
2. **Conflict Resolution**: Built-in conflict resolution UI
3. **Branch Switch History**: Track branch switching history
4. **Worktree Dependency Graph**: Visualize worktree relationships

---

## 13. Summary

This implementation plan provides a comprehensive approach to adding a safe main worktree branch switching feature to the Git Worktree Manager extension. The design leverages existing architecture while adding necessary safety checks and user-friendly interfaces.

### Key Deliverables:

1. New methods in [`gitWorktreeManager.ts`](src/gitWorktreeManager.ts)
2. New command in [`extension.ts`](src/extension.ts)
3. Updates to [`package.json`](package.json)
4. Comprehensive documentation
5. Testing strategy

### Estimated Code Changes:

- **gitWorktreeManager.ts**: ~105 new lines
- **extension.ts**: ~80 new lines
- **package.json**: ~15 new lines
- **Total**: ~200 new lines of code

### Next Steps:

1. Review and approve this implementation plan
2. Switch to Code mode to implement the changes
3. Test the implementation
4. Update documentation
