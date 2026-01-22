import * as vscode from 'vscode';
import * as path from 'path';
import { WorktreeProvider } from './worktreeProvider';
import { GitWorktreeManager } from './gitWorktreeManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Git Worktree Manager extension is now active');

    const gitManager = new GitWorktreeManager();
    const worktreeProvider = new WorktreeProvider(gitManager);

    // Register tree view
    const treeView = vscode.window.createTreeView('gitWorktreeView', {
        treeDataProvider: worktreeProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(treeView);

    // Helper function to validate git repository
    async function validateGitRepository(): Promise<boolean> {
        const isGitRepo = await gitManager.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showWarningMessage('Not a git repository. Please open a git repository to use this extension.');
            return false;
        }
        return true;
    }

    // Helper function to validate branch name
    function validateBranchName(branchName: string): { valid: boolean; reason?: string } {
        // Check for empty branch name
        if (!branchName || branchName.trim() === '') {
            return { valid: false, reason: 'Branch name cannot be empty' };
        }
        
        // Cannot begin or end with dot
        if (branchName.startsWith('.') || branchName.endsWith('.')) {
            return { valid: false, reason: 'Branch name cannot begin or end with a dot' };
        }
        
        // Cannot have consecutive dots
        if (/\.\./.test(branchName)) {
            return { valid: false, reason: 'Branch name cannot have consecutive dots' };
        }
        
        // Cannot contain spaces or control characters
        if (/[\s~^:?*[\]\\]/.test(branchName)) {
            return { valid: false, reason: 'Branch name cannot contain spaces or special characters' };
        }
        
        // Cannot be a reserved branch name
        const reservedNames = ['master', 'main', 'HEAD', 'dev'];
        if (reservedNames.includes(branchName)) {
            return { valid: false, reason: 'Branch name is reserved' };
        }
        
        // Maximum length (commonly 255 chars)
        if (branchName.length > 255) {
            return { valid: false, reason: 'Branch name too long (max 255 characters)' };
        }
        
        return { valid: true };
    }

    // Helper function to validate worktree path
    function validateWorktreePath(location: string, workspaceRoot: string): string {
        // Check for directory traversal attempts
        if (location.includes('..') || location.includes('~')) {
            throw new Error('Invalid worktree path: Directory traversal not allowed');
        }
        
        // Check for absolute paths to system directories
        const systemDirs = ['/etc', '/usr', '/var', '/root'];
        const isSystemDir = systemDirs.some(dir => location.startsWith(dir));
        if (isSystemDir) {
            throw new Error('Cannot create worktree in system directory');
        }
        
        // Resolve relative paths
        let resolvedPath = location;
        if (!path.isAbsolute(location) && workspaceRoot) {
            resolvedPath = path.resolve(workspaceRoot, location);
        }
        
        return resolvedPath;
    }

    // Helper function to get default location from config
    function getDefaultLocation(branchName: string): string {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const defaultLocation = config.get<string>('defaultLocation', '');
        
        if (defaultLocation && defaultLocation.trim()) {
            // Use configured default location
            return path.join(defaultLocation, branchName.replace(/[\/\\]/g, '-'));
        }
        
        // Default to parent of main repository
        return `../${branchName.replace(/[\/\\]/g, '-')}`;
    }

    // Helper function to select location with file dialog option
    async function selectLocation(branchName: string): Promise<string | undefined> {
        const defaultLocation = getDefaultLocation(branchName);
        
        // Ask user for location input method
        const locationMethod = await vscode.window.showQuickPick(
            [
                { label: 'Browse for Directory...', description: 'Select folder using file dialog' },
                { label: 'Enter Path Manually', description: 'Type path directly' }
            ],
            { placeHolder: 'How do you want to specify worktree location?' }
        );

        if (!locationMethod) {
            return undefined;
        }

        let location: string | undefined;

        if (locationMethod.label === 'Browse for Directory...') {
            // Use file dialog to select directory
            const uri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Worktree Location',
                title: 'Select Directory for New Worktree'
            });

            if (uri && uri.length > 0) {
                location = uri[0].fsPath;
            }
        } else {
            // Use manual input
            location = await vscode.window.showInputBox({
                prompt: 'Enter path for new worktree',
                placeHolder: defaultLocation,
                value: defaultLocation
            });
        }

        return location;
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.list', async () => {
            if (!(await validateGitRepository())) {
                return;
            }

            const worktrees = await gitManager.listWorktrees();
            if (worktrees.length === 0) {
                vscode.window.showInformationMessage('No worktrees found');
                return;
            }
            
            const items = worktrees.map(wt => ({
                label: wt.branch || 'detached',
                description: wt.path,
                detail: wt.isMain ? '(main worktree)' : ''
            }));
            
            await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a worktree'
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.add', async () => {
            if (!(await validateGitRepository())) {
                return;
            }

            const branchName = await vscode.window.showInputBox({
                prompt: 'Enter new branch name for worktree',
                placeHolder: 'feature/my-feature'
            });

            if (!branchName) {
                return;
            }

            // Validate branch name
            const validation = validateBranchName(branchName);
            if (!validation.valid) {
                vscode.window.showErrorMessage(`Invalid branch name: ${validation.reason}`);
                return;
            }

            const location = await selectLocation(branchName);

            if (!location) {
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating worktree for ${branchName}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.addWorktree(location, branchName);
                });

                vscode.window.showInformationMessage(`Worktree created successfully: ${branchName}`);
                worktreeProvider.refresh();

                // Ask if user wants to open new worktree
                const action = await vscode.window.showInformationMessage(
                    'Worktree created. Do you want to open it?',
                    'Open in New Window',
                    'Open in Current Window',
                    'Cancel'
                );

                if (action === 'Open in New Window') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), true);
                } else if (action === 'Open in Current Window') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), false);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.addExistingBranch', async () => {
            if (!(await validateGitRepository())) {
                return;
            }

            const branches = await gitManager.listBranches();
            
            const branch = await vscode.window.showQuickPick(
                branches.map(b => ({ label: b, description: '' })),
                { placeHolder: 'Select a branch for worktree' }
            );

            if (!branch) {
                return;
            }

            const location = await selectLocation(branch.label);

            if (!location) {
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating worktree for ${branch.label}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.addWorktree(location, branch.label, false);
                });

                vscode.window.showInformationMessage(`Worktree created successfully: ${branch.label}`);
                worktreeProvider.refresh();

                const action = await vscode.window.showInformationMessage(
                    'Worktree created. Do you want to open it?',
                    'Open in New Window',
                    'Open in Current Window',
                    'Cancel'
                );

                if (action === 'Open in New Window') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), true);
                } else if (action === 'Open in Current Window') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), false);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.remove', async (item: any) => {
            if (!(await validateGitRepository())) {
                return;
            }

            const worktree = item?.worktree;
            let targetWorktree = worktree;

            if (!targetWorktree) {
                const worktrees = await gitManager.listWorktrees();
                const nonMainWorktrees = worktrees.filter(wt => !wt.isMain);
                
                if (nonMainWorktrees.length === 0) {
                    vscode.window.showInformationMessage('No removable worktrees found');
                    return;
                }

                const selected = await vscode.window.showQuickPick(
                    nonMainWorktrees.map(wt => ({
                        label: wt.branch || 'detached',
                        description: wt.path,
                        worktree: wt
                    })),
                    { placeHolder: 'Select worktree to remove' }
                );

                if (!selected) {
                    return;
                }

                targetWorktree = selected.worktree;
            }

            if (targetWorktree.isMain) {
                vscode.window.showErrorMessage('Cannot remove main worktree');
                return;
            }

            const config = vscode.workspace.getConfiguration('gitWorktree');
            const confirmBeforeRemove = config.get<boolean>('confirmBeforeRemove', true);
            let force = false;

            if (confirmBeforeRemove) {
                const confirm = await vscode.window.showWarningMessage(
                    `Remove worktree "${targetWorktree.branch}" at ${targetWorktree.path}?`,
                    { modal: true },
                    'Remove',
                    'Force Remove'
                );

                if (!confirm) {
                    return;
                }

                force = (confirm === 'Force Remove');
            }

            try {
                await gitManager.removeWorktree(targetWorktree.path, force);
                vscode.window.showInformationMessage(`Worktree removed: ${targetWorktree.branch}`);
                worktreeProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to remove worktree: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.switch', async (item: any) => {
            if (!(await validateGitRepository())) {
                return;
            }

            const worktree = item?.worktree;
            let targetWorktree = worktree;

            if (!targetWorktree) {
                const worktrees = await gitManager.listWorktrees();
                const selected = await vscode.window.showQuickPick(
                    worktrees.map(wt => ({
                        label: wt.branch || 'detached',
                        description: wt.path,
                        detail: wt.isMain ? '(main worktree)' : '',
                        worktree: wt
                    })),
                    { placeHolder: 'Select worktree to switch to' }
                );

                if (!selected) {
                    return;
                }

                targetWorktree = selected.worktree;
            }

            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetWorktree.path), false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.openInNewWindow', async (item: any) => {
            const worktree = item?.worktree;
            if (worktree) {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(worktree.path), true);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.openTerminal', async (item: any) => {
            const worktree = item?.worktree;
            if (worktree) {
                const terminal = vscode.window.createTerminal({
                    name: `Worktree: ${worktree.branch || 'detached'}`,
                    cwd: worktree.path
                });
                terminal.show();
            }
        })
    );

    // NEW: Switch branch in worktree
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.switchBranch', async (item: any) => {
            if (!(await validateGitRepository())) {
                return;
            }

            const worktree = item?.worktree;
            let targetWorktree = worktree;

            if (!targetWorktree) {
                const worktrees = await gitManager.listWorktrees();
                const selected = await vscode.window.showQuickPick(
                    worktrees.map(wt => ({
                        label: wt.branch || 'detached',
                        description: wt.path,
                        detail: wt.isMain ? '(main worktree)' : '',
                        worktree: wt
                    })),
                    { placeHolder: 'Select worktree to change branch' }
                );

                if (!selected) {
                    return;
                }

                targetWorktree = selected.worktree;
            }

            // Get current branch
            const currentBranch = targetWorktree.branch || 'detached';

            // List all branches
            const branches = await gitManager.listBranches();
            const branchItems = branches.map(b => ({ label: b, description: b === currentBranch ? '(current)' : '' }));

            const selectedBranch = await vscode.window.showQuickPick(
                branchItems,
                { placeHolder: `Select branch to switch to (current: ${currentBranch})` }
            );

            if (!selectedBranch) {
                return;
            }

            if (selectedBranch.label === currentBranch) {
                vscode.window.showInformationMessage('Already on this branch');
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Switching ${targetWorktree.branch} to ${selectedBranch.label}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.switchBranchInWorktree(targetWorktree.path, selectedBranch.label);
                });

                vscode.window.showInformationMessage(`Branch switched to ${selectedBranch.label}`);
                worktreeProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to switch branch: ${error}`);
            }
        })
    );

    // NEW: Create new branch in worktree
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.createBranch', async (item: any) => {
            if (!(await validateGitRepository())) {
                return;
            }

            const worktree = item?.worktree;
            let targetWorktree = worktree;

            if (!targetWorktree) {
                const worktrees = await gitManager.listWorktrees();
                const selected = await vscode.window.showQuickPick(
                    worktrees.map(wt => ({
                        label: wt.branch || 'detached',
                        description: wt.path,
                        detail: wt.isMain ? '(main worktree)' : '',
                        worktree: wt
                    })),
                    { placeHolder: 'Select worktree to create branch in' }
                );

                if (!selected) {
                    return;
                }

                targetWorktree = selected.worktree;
            }

            const branchName = await vscode.window.showInputBox({
                prompt: `Enter new branch name for worktree ${targetWorktree.branch}`,
                placeHolder: 'feature/my-new-feature'
            });

            if (!branchName) {
                return;
            }

            // Validate branch name
            const validation = validateBranchName(branchName);
            if (!validation.valid) {
                vscode.window.showErrorMessage(`Invalid branch name: ${validation.reason}`);
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating branch ${branchName} in ${targetWorktree.branch}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.createBranchInWorktree(targetWorktree.path, branchName);
                });

                vscode.window.showInformationMessage(`Branch created: ${branchName}`);
                worktreeProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
            }
        })
    );

    // NEW: Pull changes in worktree
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.pull', async (item: any) => {
            const worktree = item?.worktree;
            if (!worktree) {
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.progressLocation.Notification,
                    title: `Pulling changes in ${worktree.branch || 'detached'}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.pullInWorktree(worktree.path);
                });

                vscode.window.showInformationMessage(`Pulled changes in ${worktree.branch || 'detached'}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to pull changes: ${error}`);
            }
        })
    );

    // NEW: Push changes from worktree
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.push', async (item: any) => {
            const worktree = item?.worktree;
            if (!worktree) {
                return;
            }

            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Pushing changes from ${worktree.branch || 'detached'}...`,
                    cancellable: false
                }, async () => {
                    await gitManager.pushInWorktree(worktree.path);
                });

                vscode.window.showInformationMessage(`Pushed changes from ${worktree.branch || 'detached'}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to push changes: ${error}`);
            }
        })
    );

    // NEW: Copy worktree path to clipboard
    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.copyPath', async (item: any) => {
            const worktree = item?.worktree;
            if (worktree) {
                await vscode.env.clipboard.writeText(worktree.path);
                vscode.window.showInformationMessage(`Path copied: ${worktree.path}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.prune', async () => {
            if (!(await validateGitRepository())) {
                return;
            }
            try {
                await gitManager.pruneWorktrees();
                vscode.window.showInformationMessage('Pruned stale worktree entries');
                worktreeProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune worktrees: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitWorktree.refresh', () => {
            worktreeProvider.refresh();
        })
    );

    // Watch for file system changes to auto-refresh
    const config = vscode.workspace.getConfiguration('gitWorktree');
    if (config.get<boolean>('autoRefresh', true)) {
        const watcher = vscode.workspace.createFileSystemWatcher('**/.git/worktrees/**');
        watcher.onDidChange(() => worktreeProvider.refresh());
        watcher.onDidCreate(() => worktreeProvider.refresh());
        watcher.onDidDelete(() => worktreeProvider.refresh());
        context.subscriptions.push(watcher);
    }
}

export function deactivate() {
    console.log('Git Worktree Manager extension is now deactivated');
}
