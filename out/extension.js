"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const worktreeProvider_1 = require("./worktreeProvider");
const gitWorktreeManager_1 = require("./gitWorktreeManager");
const templateManager_1 = require("./templates/templateManager");
const hooksManager_1 = require("./lifecycle/hooksManager");
const healthProvider_1 = require("./views/healthProvider");
const timelineProvider_1 = require("./views/timelineProvider");
const graphProvider_1 = require("./views/graphProvider");
const quickActions_1 = require("./quickActions");
const settingsSync_1 = require("./sync/settingsSync");
const fileTransfer_1 = require("./fileTransfer");
function activate(context) {
    console.log('Git Worktree Manager extension is now active');
    const gitManager = new gitWorktreeManager_1.GitWorktreeManager();
    const worktreeProvider = new worktreeProvider_1.WorktreeProvider(gitManager);
    // Initialize new modules
    const templateManager = new templateManager_1.TemplateManager(context);
    const hooksManager = new hooksManager_1.HooksManager();
    const healthProvider = new healthProvider_1.HealthProvider(gitManager);
    const timelineProvider = new timelineProvider_1.TimelineProvider(context, gitManager);
    const graphProvider = new graphProvider_1.GraphProvider(gitManager);
    const quickActions = new quickActions_1.QuickActions(templateManager, gitManager);
    const settingsSync = new settingsSync_1.SettingsSync();
    const fileTransferManager = new fileTransfer_1.FileTransferManager(gitManager);
    // Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'gitWorktree.list';
    context.subscriptions.push(statusBarItem);
    // Register all tree views
    const treeView = vscode.window.createTreeView('gitWorktreeView', {
        treeDataProvider: worktreeProvider,
        showCollapseAll: true
    });
    const healthView = vscode.window.createTreeView('gitHealthView', {
        treeDataProvider: healthProvider,
        showCollapseAll: true
    });
    const timelineView = vscode.window.createTreeView('gitTimelineView', {
        treeDataProvider: timelineProvider,
        showCollapseAll: true
    });
    const graphView = vscode.window.createTreeView('gitGraphView', {
        treeDataProvider: graphProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView, healthView, timelineView, graphView);
    // Helper function to validate git repository
    async function validateGitRepository() {
        const isGitRepo = await gitManager.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showWarningMessage('Not a git repository. Please open a git repository to use this extension.');
            return false;
        }
        return true;
    }
    // Helper function to validate branch name
    function validateBranchName(branchName) {
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
        const reservedNames = ['HEAD'];
        if (reservedNames.includes(branchName)) {
            return { valid: false, reason: 'Branch name "HEAD" is reserved' };
        }
        // Maximum length (commonly 255 chars)
        if (branchName.length > 255) {
            return { valid: false, reason: 'Branch name too long (max 255 characters)' };
        }
        return { valid: true };
    }
    // Helper function to validate worktree path
    function validateWorktreePath(location, workspaceRoot) {
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
    function getDefaultLocation(branchName) {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const defaultLocation = config.get('defaultLocation', '');
        if (defaultLocation && defaultLocation.trim()) {
            // Use configured default location
            return path.join(defaultLocation, branchName.replace(/[\/\\]/g, '-'));
        }
        // Default to parent of main repository
        return `../${branchName.replace(/[\/\\]/g, '-')}`;
    }
    // Helper function to select location with file dialog option
    async function selectLocation(branchName) {
        const defaultLocation = getDefaultLocation(branchName);
        // Ask user for location input method
        const locationMethod = await vscode.window.showQuickPick([
            { label: 'Browse for Directory...', description: 'Select folder using file dialog' },
            { label: 'Enter Path Manually', description: 'Type path directly' }
        ], { placeHolder: 'How do you want to specify worktree location?' });
        if (!locationMethod) {
            return undefined;
        }
        let location;
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
        }
        else {
            // Use manual input
            location = await vscode.window.showInputBox({
                prompt: 'Enter path for new worktree',
                placeHolder: defaultLocation,
                value: defaultLocation
            });
        }
        return location;
    }
    // NEW: Helper to check if a path is suitable for a new worktree
    async function checkWorktreePath(location, branchName) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const resolvedPath = validateWorktreePath(location, workspaceRoot);
        if (fs.existsSync(resolvedPath)) {
            const files = fs.readdirSync(resolvedPath);
            if (files.length > 0) {
                const worktrees = await gitManager.listWorktrees();
                const isAlreadyWorktree = worktrees.some(wt => path.resolve(wt.path) === path.resolve(resolvedPath));
                if (isAlreadyWorktree) {
                    const wt = worktrees.find(wt => path.resolve(wt.path) === path.resolve(resolvedPath));
                    const action = await vscode.window.showInformationMessage(`A worktree already exists at this location (Branch: ${wt?.branch || 'unknown'}). Do you want to open it?`, 'Open', 'Cancel');
                    if (action === 'Open') {
                        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(resolvedPath), false);
                    }
                    return false;
                }
                await vscode.window.showWarningMessage(`The directory '${resolvedPath}' already exists and is not empty. Git requires an empty directory for a new worktree.`, { modal: true });
                return false;
            }
        }
        return true;
    }
    // NEW: Update Status Bar
    async function updateStatusBar() {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        if (!config.get('showStatusBar', true)) {
            statusBarItem.hide();
            return;
        }
        const isGitRepo = await gitManager.isGitRepository();
        if (!isGitRepo) {
            statusBarItem.hide();
            return;
        }
        const worktrees = await gitManager.listWorktrees();
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            const currentWorktree = worktrees.find(wt => path.resolve(wt.path) === path.resolve(workspaceRoot));
            if (currentWorktree) {
                const branch = currentWorktree.branch || 'detached';
                const status = await gitManager.getWorktreeStatus(currentWorktree.path);
                const icon = status === 'dirty' ? '$(file-submodule)' : '$(git-branch)';
                statusBarItem.text = `${icon} ${branch}`;
                statusBarItem.tooltip = `Current Worktree: ${currentWorktree.path}`;
                statusBarItem.show();
                return;
            }
        }
        statusBarItem.hide();
    }
    updateStatusBar();
    // Track recent worktrees
    async function trackRecentWorktree() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot)
            return;
        let recentPaths = context.workspaceState.get('recentWorktrees', []);
        recentPaths = recentPaths.filter(p => p !== workspaceRoot);
        recentPaths.unshift(workspaceRoot);
        recentPaths = recentPaths.slice(0, 5); // Keep last 5
        await context.workspaceState.update('recentWorktrees', recentPaths);
        worktreeProvider.setRecentPaths(recentPaths);
    }
    trackRecentWorktree();
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.list', async () => {
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
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.add', async () => {
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
            // Check if branch already exists or is in use
            const branches = await gitManager.listBranches();
            const worktrees = await gitManager.listWorktrees();
            const isBranchInUse = worktrees.some(wt => wt.branch === branchName);
            const doesBranchExist = branches.includes(branchName);
            if (isBranchInUse) {
                const inUseWorktree = worktrees.find(wt => wt.branch === branchName);
                vscode.window.showErrorMessage(`Branch '${branchName}' is already checked out at: ${inUseWorktree?.path}`);
                return;
            }
            let createNew = true;
            if (doesBranchExist) {
                const choice = await vscode.window.showInformationMessage(`Branch '${branchName}' already exists. Use it for the new worktree?`, { modal: true }, 'Yes', 'No');
                if (choice !== 'Yes') {
                    return;
                }
                createNew = false;
            }
            // Validate path
            if (!(await checkWorktreePath(location, branchName))) {
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: createNew ? `Creating worktree for new branch ${branchName}...` : `Creating worktree for existing branch ${branchName}...`,
                cancellable: false
            }, async () => {
                await gitManager.addWorktree(location, branchName, createNew);
            });
            // Execute onCreate hook
            await hooksManager.onWorktreeCreate(location, branchName);
            // Record timeline event
            await timelineProvider.recordEvent({
                type: 'created',
                worktree: { path: location, branch: branchName },
                timestamp: Date.now()
            });
            vscode.window.showInformationMessage(`Worktree created successfully: ${branchName}`);
            worktreeProvider.refresh();
            healthProvider.refresh();
            // Ask if user wants to open new worktree
            const action = await vscode.window.showInformationMessage('Worktree created. Do you want to open it?', 'Open in New Window', 'Open in Current Window', 'Cancel');
            if (action === 'Open in New Window') {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), true);
            }
            else if (action === 'Open in Current Window') {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), false);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.addExistingBranch', async () => {
        if (!(await validateGitRepository())) {
            return;
        }
        const branches = await gitManager.listBranches();
        const worktrees = await gitManager.listWorktrees();
        const usedBranches = worktrees.map((wt) => wt.branch).filter((b) => b !== null);
        const availableBranches = branches.filter((b) => !usedBranches.includes(b));
        if (availableBranches.length === 0) {
            vscode.window.showInformationMessage('All branches are already checked out in worktrees.');
            return;
        }
        const branch = await vscode.window.showQuickPick(availableBranches.map(b => ({ label: b, description: '' })), { placeHolder: 'Select a branch for worktree' });
        if (!branch) {
            return;
        }
        const location = await selectLocation(branch.label);
        if (!location) {
            return;
        }
        // Validate path
        if (!(await checkWorktreePath(location, branch.label))) {
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
            const action = await vscode.window.showInformationMessage('Worktree created. Do you want to open it?', 'Open in New Window', 'Open in Current Window', 'Cancel');
            if (action === 'Open in New Window') {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), true);
            }
            else if (action === 'Open in Current Window') {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), false);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.remove', async (item) => {
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
            const selected = await vscode.window.showQuickPick(nonMainWorktrees.map(wt => ({
                label: wt.branch || 'detached',
                description: wt.path,
                worktree: wt
            })), { placeHolder: 'Select worktree to remove' });
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
        const confirmBeforeRemove = config.get('confirmBeforeRemove', true);
        let force = false;
        if (confirmBeforeRemove) {
            const confirm = await vscode.window.showWarningMessage(`Remove worktree "${targetWorktree.branch}" at ${targetWorktree.path}?`, { modal: true }, 'Remove', 'Force Remove');
            if (!confirm) {
                return;
            }
            force = (confirm === 'Force Remove');
        }
        try {
            await gitManager.removeWorktree(targetWorktree.path, force);
            vscode.window.showInformationMessage(`Worktree removed: ${targetWorktree.branch}`);
            worktreeProvider.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to remove worktree: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.switch', async (item) => {
        if (!(await validateGitRepository())) {
            return;
        }
        const worktree = item?.worktree;
        let targetWorktree = worktree;
        if (!targetWorktree) {
            const worktrees = await gitManager.listWorktrees();
            const selected = await vscode.window.showQuickPick(worktrees.map(wt => ({
                label: wt.branch || 'detached',
                description: wt.path,
                detail: wt.isMain ? '(main worktree)' : '',
                worktree: wt
            })), { placeHolder: 'Select worktree to switch to' });
            if (!selected) {
                return;
            }
            targetWorktree = selected.worktree;
        }
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetWorktree.path), false);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.openInNewWindow', async (item) => {
        const worktree = item?.worktree;
        if (worktree) {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(worktree.path), true);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.openTerminal', async (item) => {
        const worktree = item?.worktree;
        if (worktree) {
            const terminal = vscode.window.createTerminal({
                name: `Worktree: ${worktree.branch || 'detached'}`,
                cwd: worktree.path
            });
            terminal.show();
        }
    }));
    // NEW: Switch branch in worktree
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.switchBranch', async (item) => {
        if (!(await validateGitRepository())) {
            return;
        }
        const worktree = item?.worktree;
        let targetWorktree = worktree;
        if (!targetWorktree) {
            const worktrees = await gitManager.listWorktrees();
            const selected = await vscode.window.showQuickPick(worktrees.map(wt => ({
                label: wt.branch || 'detached',
                description: wt.path,
                detail: wt.isMain ? '(main worktree)' : '',
                worktree: wt
            })), { placeHolder: 'Select worktree to change branch' });
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
        const selectedBranch = await vscode.window.showQuickPick(branchItems, { placeHolder: `Select branch to switch to (current: ${currentBranch})` });
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to switch branch: ${error}`);
        }
    }));
    // NEW: Create new branch in worktree
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.createBranch', async (item) => {
        if (!(await validateGitRepository())) {
            return;
        }
        const worktree = item?.worktree;
        let targetWorktree = worktree;
        if (!targetWorktree) {
            const worktrees = await gitManager.listWorktrees();
            const selected = await vscode.window.showQuickPick(worktrees.map(wt => ({
                label: wt.branch || 'detached',
                description: wt.path,
                detail: wt.isMain ? '(main worktree)' : '',
                worktree: wt
            })), { placeHolder: 'Select worktree to create branch in' });
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
        }
    }));
    // NEW: Pull changes in worktree
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.pull', async (item) => {
        const worktree = item?.worktree;
        if (!worktree) {
            return;
        }
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling changes in ${worktree.branch || 'detached'}...`,
                cancellable: false
            }, async () => {
                await gitManager.pullInWorktree(worktree.path);
            });
            vscode.window.showInformationMessage(`Pulled changes in ${worktree.branch || 'detached'}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to pull changes: ${error}`);
        }
    }));
    // NEW: Push changes from worktree
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.push', async (item) => {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to push changes: ${error}`);
        }
    }));
    // NEW: Copy worktree path to clipboard
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.copyPath', async (item) => {
        const worktree = item?.worktree;
        if (worktree) {
            await vscode.env.clipboard.writeText(worktree.path);
            vscode.window.showInformationMessage(`Path copied: ${worktree.path}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.addNote', async (item) => {
        const worktree = item?.worktree;
        if (!worktree)
            return;
        const existingNotesHeader = context.workspaceState.get('worktreeNotes', {});
        const currentNote = existingNotesHeader[worktree.path] || '';
        const note = await vscode.window.showInputBox({
            prompt: `Add note for worktree at ${worktree.path}`,
            value: currentNote,
            placeHolder: 'e.g., Working on PR #123'
        });
        if (note !== undefined) {
            existingNotesHeader[worktree.path] = note;
            await context.workspaceState.update('worktreeNotes', existingNotesHeader);
            worktreeProvider.setNotes(existingNotesHeader);
            worktreeProvider.refresh();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.compare', async (item) => {
        const worktree = item?.worktree;
        if (!worktree)
            return;
        vscode.window.showInformationMessage(`Comparing current worktree with ${worktree.branch || 'detached'}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.multiSearch', async () => {
        const query = await vscode.window.showInputBox({ prompt: 'Search across all worktrees' });
        if (!query)
            return;
        const worktrees = await gitManager.listWorktrees();
        const terminal = vscode.window.createTerminal('Multi-Worktree Search');
        terminal.show();
        for (const wt of worktrees) {
            terminal.sendText(`echo "--- Search in ${wt.branch || wt.path} ---"`);
            terminal.sendText(`grep -rn "${query}" "${wt.path}" --exclude-dir=.git || true`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.cleanupMerged', async () => {
        if (!(await validateGitRepository()))
            return;
        const worktrees = await gitManager.listWorktrees();
        const mergedWorktrees = [];
        for (const wt of worktrees.filter(w => !w.isMain)) {
            if (await gitManager.isMerged(wt.path)) {
                mergedWorktrees.push(wt);
            }
        }
        if (mergedWorktrees.length === 0) {
            vscode.window.showInformationMessage('No merged worktrees found.');
            return;
        }
        const selection = await vscode.window.showQuickPick(mergedWorktrees.map(wt => ({ label: wt.branch || 'detached', description: wt.path, worktree: wt })), { canPickMany: true, placeHolder: 'Select merged worktrees to remove' });
        if (selection && selection.length > 0) {
            for (const item of selection) {
                await gitManager.removeWorktree(item.worktree.path);
            }
            vscode.window.showInformationMessage(`Removed ${selection.length} worktrees.`);
            worktreeProvider.refresh();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.switchMainBranch', async () => {
        if (!(await validateGitRepository()))
            return;
        const branches = await gitManager.listBranches();
        const selectedBranch = await vscode.window.showQuickPick(branches, { placeHolder: 'Select branch for main worktree' });
        if (selectedBranch) {
            const result = await gitManager.switchMainWorktreeBranch(selectedBranch);
            if (result.success) {
                vscode.window.showInformationMessage(result.message);
                worktreeProvider.refresh();
                updateStatusBar();
            }
            else {
                vscode.window.showErrorMessage(result.message);
            }
        }
    }));
    // Quick Actions
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.quickActions', async () => {
        await quickActions.showQuickActionsPanel();
    }));
    // Batch Operations
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.pullAll', async () => {
        if (!(await validateGitRepository()))
            return;
        const worktrees = await gitManager.listWorktrees();
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Pulling all worktrees...',
            cancellable: false
        }, async (progress) => {
            let completed = 0;
            for (const wt of worktrees) {
                progress.report({ message: `Pulling ${wt.branch || wt.path}...`, increment: (100 / worktrees.length) });
                try {
                    await gitManager.pullInWorktree(wt.path);
                    completed++;
                }
                catch (error) {
                    console.error(`Pull failed for ${wt.path}:`, error);
                }
            }
            vscode.window.showInformationMessage(`Pulled ${completed}/${worktrees.length} worktrees`);
        });
        worktreeProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.pushAllDirty', async () => {
        if (!(await validateGitRepository()))
            return;
        const worktrees = await gitManager.listWorktrees();
        const dirtyWorktrees = [];
        for (const wt of worktrees) {
            const status = await gitManager.getWorktreeStatus(wt.path);
            if (status === 'dirty') {
                dirtyWorktrees.push(wt);
            }
        }
        if (dirtyWorktrees.length === 0) {
            vscode.window.showInformationMessage('No dirty worktrees found');
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Pushing dirty worktrees...',
            cancellable: false
        }, async (progress) => {
            let completed = 0;
            for (const wt of dirtyWorktrees) {
                progress.report({ message: `Pushing ${wt.branch || wt.path}...` });
                try {
                    await gitManager.pushInWorktree(wt.path);
                    completed++;
                }
                catch (error) {
                    console.error(`Push failed for ${wt.path}:`, error);
                }
            }
            vscode.window.showInformationMessage(`Pushed ${completed}/${dirtyWorktrees.length} dirty worktrees`);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.installDepsAll', async () => {
        if (!(await validateGitRepository()))
            return;
        const worktrees = await gitManager.listWorktrees();
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Installing dependencies in all worktrees...',
            cancellable: false
        }, async (progress) => {
            let completed = 0;
            for (const wt of worktrees) {
                progress.report({ message: `Installing in ${wt.branch || wt.path}...` });
                try {
                    await hooksManager.executeHook('npm install', { path: wt.path, branch: wt.branch || '', worktree: wt.path });
                    completed++;
                }
                catch (error) {
                    console.error(`Install failed for ${wt.path}:`, error);
                }
            }
            vscode.window.showInformationMessage(`Installed dependencies in ${completed}/${worktrees.length} worktrees`);
        });
    }));
    // Settings Sync
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.syncSettings', async () => {
        if (!(await validateGitRepository()))
            return;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot)
            return;
        const worktrees = await gitManager.listWorktrees();
        const targetPaths = worktrees.filter(wt => wt.path !== workspaceRoot).map(wt => wt.path);
        if (targetPaths.length === 0) {
            vscode.window.showInformationMessage('No other worktrees to sync to');
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Syncing settings...',
            cancellable: false
        }, async (progress) => {
            const result = await settingsSync.syncSettings(workspaceRoot, targetPaths, progress);
            vscode.window.showInformationMessage(`Settings synced to ${result.synced} files (${result.failed} failed)`);
        });
    }));
    // Health Monitor
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.refreshHealth', () => {
        healthProvider.refresh();
    }));
    // Timeline
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.refreshTimeline', () => {
        timelineProvider.refresh();
    }));
    // Dependency Graph
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.refreshGraph', () => {
        graphProvider.refresh();
    }));
    // File Transfer
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.moveFiles', async () => {
        if (!(await validateGitRepository()))
            return;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        // Get modified files in current worktree
        const modifiedFiles = await fileTransferManager.getModifiedFiles(workspaceRoot);
        if (modifiedFiles.length === 0) {
            vscode.window.showInformationMessage('No modified files in current worktree');
            return;
        }
        // Let user select which files to move
        const selectedFiles = await vscode.window.showQuickPick(modifiedFiles.map(file => ({
            label: file.displayLabel,
            description: file.isStaged ? 'Staged' : 'Unstaged',
            picked: false,
            file
        })), {
            canPickMany: true,
            placeHolder: 'Select files to move to another worktree'
        });
        if (!selectedFiles || selectedFiles.length === 0) {
            return;
        }
        // Get all worktrees except current
        const allWorktrees = await gitManager.listWorktrees();
        const otherWorktrees = allWorktrees.filter(wt => path.resolve(wt.path) !== path.resolve(workspaceRoot));
        if (otherWorktrees.length === 0) {
            vscode.window.showWarningMessage('No other worktrees available');
            return;
        }
        // Let user select target worktree
        const targetWorktree = await vscode.window.showQuickPick(otherWorktrees.map(wt => ({
            label: wt.branch || 'detached',
            description: wt.path,
            detail: wt.isMain ? '(Main worktree)' : '',
            worktree: wt
        })), {
            placeHolder: 'Select target worktree'
        });
        if (!targetWorktree) {
            return;
        }
        // Get configuration
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const confirmOverwrite = config.get('fileTransfer.confirmOverwrite', true);
        const autoStage = config.get('fileTransfer.autoStage', true);
        // Transfer files
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Moving files to another worktree...',
            cancellable: false
        }, async (progress) => {
            const filesToTransfer = selectedFiles.map(sf => sf.file);
            const result = await fileTransferManager.transferFiles(workspaceRoot, targetWorktree.worktree.path, filesToTransfer, { confirmOverwrite, autoStage });
            let message = `Transferred ${result.success} file(s)`;
            if (result.failed > 0) {
                message += `, ${result.failed} failed`;
            }
            if (result.skipped > 0) {
                message += `, ${result.skipped} skipped`;
            }
            if (result.success > 0) {
                vscode.window.showInformationMessage(message);
                worktreeProvider.refresh();
                healthProvider.refresh();
            }
            else {
                vscode.window.showWarningMessage(message);
            }
        });
    }));
    // Set up health monitoring interval
    const healthConfig = vscode.workspace.getConfiguration('gitWorktree');
    const healthCheckInterval = healthConfig.get('health.checkInterval', 900000);
    const healthTimer = setInterval(() => {
        healthProvider.refresh();
    }, healthCheckInterval);
    context.subscriptions.push({ dispose: () => clearInterval(healthTimer) });
    // Pass initial data to provider
    worktreeProvider.setNotes(context.workspaceState.get('worktreeNotes', {}));
    worktreeProvider.setRecentPaths(context.workspaceState.get('recentWorktrees', []));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.prune', async () => {
        if (!(await validateGitRepository())) {
            return;
        }
        try {
            await gitManager.pruneWorktrees();
            vscode.window.showInformationMessage('Pruned stale worktree entries');
            worktreeProvider.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to prune worktrees: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitWorktree.refresh', () => {
        worktreeProvider.refresh();
    }));
    // Watch for file system changes to auto-refresh
    const config = vscode.workspace.getConfiguration('gitWorktree');
    if (config.get('autoRefresh', true)) {
        const watcher = vscode.workspace.createFileSystemWatcher('**/.git/worktrees/**');
        watcher.onDidChange(() => {
            worktreeProvider.refresh();
            updateStatusBar();
        });
        watcher.onDidCreate(() => {
            worktreeProvider.refresh();
            updateStatusBar();
        });
        watcher.onDidDelete(() => {
            worktreeProvider.refresh();
            updateStatusBar();
        });
        context.subscriptions.push(watcher);
    }
    // Also watch for local HEAD changes
    const headWatcher = vscode.workspace.createFileSystemWatcher('**/.git/HEAD');
    headWatcher.onDidChange(() => updateStatusBar());
    context.subscriptions.push(headWatcher);
    const indexWatcher = vscode.workspace.createFileSystemWatcher('**/.git/index');
    indexWatcher.onDidChange(() => updateStatusBar());
    context.subscriptions.push(indexWatcher);
}
function deactivate() {
    console.log('Git Worktree Manager extension is now deactivated');
}
//# sourceMappingURL=extension.js.map