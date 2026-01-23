# File Transfer Feature Test

## Test 1: Transfer Modified File
1. Create/modify a file in current worktree
2. Run `Git Worktree: Move Files to Another Worktree`
3. Select the modified file
4. Select target worktree
5. **Expected**: File appears in target, removed from source

## Test 2: Transfer Staged File
1. Modify a file and stage it with `git add`
2. Run move command
3. Select the staged file
4. **Expected**: File appears in target AND is staged there

## Test 3: Transfer Multiple Files
1. Modify 3-5 files
2. Run move command with multi-select
3. Select all files
4. **Expected**: All files transferred successfully

## Test 4: Overwrite Confirmation
1. Create file that exists in both worktrees
2. Run move command
3. **Expected**: Prompt appears asking to overwrite
4. Test "Yes", "No", "Yes to All" options

## Test 5: Configuration
1. Open Settings → Extensions → Git Worktree
2. Find `fileTransfer.confirmOverwrite`
3. Find `fileTransfer.autoStage`
4. Test toggling these settings

## Visual Indicators
- ✏️ = Staged Modified
- ➕ = Staged Added
- 📝 = Unstaged Modified
- ❓ = Untracked
