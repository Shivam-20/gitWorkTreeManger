# Testing Guide - Advanced Features

This document provides a step-by-step testing plan for all 8 new features.

## Prerequisites
1. Have a git repository with at least 2-3 worktrees
2. Install and reload the extension (`F5` in Extension Development Host)

## Feature 1: Quick Actions Panel

### Test 1.1: Access Quick Actions
1. Open the Git Worktrees view in the sidebar
2. Click the rocket icon (🚀) in the toolbar
3. **Expected**: Quick actions menu appears with options:
   - Hotfix Branch
   - Feature Branch
   - PR Review
   - Prototype/Experiment
   - Manage Templates

### Test 1.2: Create from Built-in Template
1. Click Quick Actions → "$(add) Feature Branch"
2. Enter a branch name: `test-feature`
3. **Expected**:
   - Worktree created at `../features/test-feature`
   - Branch named `feature/test-feature`
   - Timeline shows creation event
   - Health monitor updates

### Test 1.3: Create Custom Template
1. Click Quick Actions → "$(gear) Manage Templates"
2. Select "Create New Template"
3. Enter:
   - Name: "My Custom"
   - Location: `../custom/{branchName}`
   - Prefix: `custom/`
4. **Expected**: Template saved and appears in Quick Actions

## Feature 2: Templates

### Test 2.1: Edit Template
1. Quick Actions → Manage Templates → Edit Template
2. Select your custom template
3. Change location pattern
4. **Expected**: Template updated successfully

### Test 2.2: Delete Template
1. Quick Actions → Manage Templates → Delete Template
2. Confirm deletion
3.  **Expected**: Template removed from list

## Feature 3: Batch Operations

### Test 3.1: Pull All Worktrees
1. Command Palette: "Git Worktree: Pull All Worktrees"
2. **Expected**:
   - Progress notification shows each worktree being pulled
   - Summary message: "Pulled X/Y worktrees"
   - Sidebar refreshes

### Test 3.2: Push All Dirty Worktrees
1. Make changes in 2 worktrees without committing
2. Command Palette: "Git Worktree: Push All Dirty Worktrees"
3. **Expected**:
   - Only dirty worktrees are pushed
   - Progress shown
   - Summary: "Pushed X/Y dirty worktrees"

### Test 3.3: Install Dependencies Everywhere
1. Command Palette: "Git Worktree: Install Dependencies in All Worktrees"
2. **Expected**:
   - `npm install` runs in each worktree
   - Progress notification
   - Summary message

## Feature 4: Health Monitor

### Test 4.1: View Health Scores
1. Open "Health Monitor" view in sidebar 
2. **Expected**:
   - All worktrees listed with health scores (0-100)
   - Green checkmark (✓) for healthy (80+)
   - Yellow warning (⚠) for needs attention (50-79)
   - Red error (✗) for critical (<50)

### Test 4.2: Health Issues
1. Leave changes uncommitted in a worktree for > 7  days (or modify threshold)
2. Refresh Health Monitor 
3. **Expected**:
   - Worktree shows warning
   - Expandable to see issue details

### Test 4.3: Auto-Refresh
1. Wait 15 minutes (default interval)
2. **Expected**: Health view automatically refreshes

## Feature 5: Lifecycle Hooks

### Test 5.1: Configure onCreate Hook
1. Open Settings → "Git Worktree: Hooks"
2. Add onCreate: `echo "Created worktree at {path}" > {path}/CREATED.txt`
3. Create a new worktree
4. **Expected**:
   - Hook executes after creation
   -File `CREATED.txt` exists in worktree
   - Success notification

### Test 5.2: Variables in Hooks
1. Set hook: `echo "Branch: {branch}, Path: {path}"`
2. Create worktree
3. **Expected**: Variables correctly substituted

### Test 5.3: Hook Failure Handling
1. Set invalid hook command
2. Create worktree
3. **Expected**:
   - Worktree still created
   - Warning notification about hook failure

## Feature 6: Settings Sync

### Test 6.1: Sync Settings
1. Modify `.vscode/settings.json` in current worktree
2. Command: "Git Worktree: Sync Settings to All Worktrees"
3. **Expected**:
   - Settings copied to all other worktrees
   - Summary: "Settings synced to X files"

### Test 6.2: Sync launch.json and tasks.json
1. Create complex launch/tasks configs
2. Run sync command
3. **Expected**: All configs copied to other worktrees

### Test 6.3: Sync to Non-existent .vscode
1. Ensure one worktree has no `.vscode` folder
2. Run sync
3. **Expected**: `.vscode` folder created with files

## Feature 7: Timeline View

### Test 7.1: View Timeline
1. Open "Timeline" view in sidebar
2. **Expected**:
   - Events grouped: Today, This Week, This Month
   - Icons: add (created), trash (deleted), arrow (switched)
   - Timestamps shown

### Test 7.2: Record Events
1. Create a new worktree
2. **Expected**: "Created X" appears in "Today" section

### Test 7.3: Timeline Persistence
1. Reload VS Code
2. **Expected**: Timeline events still visible

## Feature 8: Dependency Graph

### Test 8.1: View Dependencies
1. Open "Dependencies" view in sidebar
2. Expand a worktree
3. **Expected**:
   - "Dependencies (N)" section
   - "Dev Dependencies (N)" section
   - "Shared with X worktrees"

### Test 8.2: No package.json
1. Use a non-JS project or worktree without package.json
2. **Expected**: Worktree doesn't appear in graph

### Test 8.3: Shared Dependencies
1. Multiple worktrees with overlapping dependencies
2. **Expected**: "Shared" section shows count

## Integration Tests

### INT-1: End-to-End Workflow
1. Quick Actions → Feature Branch → "my-feature"
2. Verify onCreate hook executed
3. Check Timeline has "Created" event
4. View Health Monitor (should be 100 score initially)
5. Make uncommitted changes
6. Health should drop, show warning
7. Sync settings from main worktree
8. Batch: Pull All

**Expected**: All features work together seamlessly

### INT-2: Multiple Worktree Scenario
1. Create 5 worktrees using templates
2. Make changes in 3 of them
3. Run "Push All Dirty"
4. Check Health Monitor for all
5. View Timeline
6. View Dependencies

**Expected**: All data accurate across all worktrees

## Performance Tests

### PERF-1: Large Repository
- Test with 10+ worktrees
- Health scan should  complete < 30 seconds
- Timeline should load instantly
- Batch operations show progress

### PERF-2: Health Auto-Refresh
- Verify 15min timer doesn't cause lag
- Health calculations in background

## Known Limitations

1. Hooks execute serially, not in parallel
2. Dependency graph only supports package.json
3. Health score calculation is heuristic-based
4. Timeline limited to last 100 events

## Reporting Issues

For each failed test, note:
- Test ID
- Steps to reproduce
- Expected vs actual behavior
- Console errors (F12)
- Extension logs ("Developer: Show Logs" → Extension Host)
