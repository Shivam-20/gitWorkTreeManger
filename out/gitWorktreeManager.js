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
exports.GitWorktreeManager = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitWorktreeManager {
    constructor() {
        this.workspaceRoot = this.getWorkspaceRoot();
    }
    getWorkspaceRoot() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }
        return undefined;
    }
    async executeGitCommand(command, cwd) {
        const workingDirectory = cwd || this.workspaceRoot;
        if (!workingDirectory) {
            throw new Error('No workspace folder open');
        }
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDirectory,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            if (stderr && !stderr.includes('warning')) {
                console.warn('Git stderr:', stderr);
            }
            return stdout.trim();
        }
        catch (error) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }
    async listWorktrees() {
        try {
            const output = await this.executeGitCommand('git worktree list --porcelain');
            return this.parseWorktreeList(output);
        }
        catch (error) {
            console.error('Failed to list worktrees:', error);
            return [];
        }
    }
    parseWorktreeList(output) {
        const worktrees = [];
        const lines = output.split('\n');
        let currentWorktree = {};
        for (const line of lines) {
            if (line.startsWith('worktree ')) {
                currentWorktree.path = line.substring(9);
            }
            else if (line.startsWith('HEAD ')) {
                currentWorktree.commit = line.substring(5);
            }
            else if (line.startsWith('branch ')) {
                const branchRef = line.substring(7);
                currentWorktree.branch = branchRef.replace('refs/heads/', '');
            }
            else if (line.startsWith('bare')) {
                // Bare repository - skip
                currentWorktree = {};
            }
            else if (line === '') {
                if (currentWorktree.path && currentWorktree.commit) {
                    worktrees.push({
                        path: currentWorktree.path,
                        commit: currentWorktree.commit,
                        branch: currentWorktree.branch || null,
                        isMain: worktrees.length === 0
                    });
                }
                currentWorktree = {};
            }
        }
        // Add the last worktree if it wasn't followed by an empty line
        if (currentWorktree.path && currentWorktree.commit) {
            worktrees.push({
                path: currentWorktree.path,
                commit: currentWorktree.commit,
                branch: currentWorktree.branch || null,
                isMain: worktrees.length === 0
            });
        }
        return worktrees;
    }
    async listBranches() {
        try {
            const output = await this.executeGitCommand('git branch -a --format="%(refname:short)"');
            return output
                .split('\n')
                .map(b => b.trim().replace(/^"/, '').replace(/"$/, ''))
                .filter(b => b && !b.includes('HEAD'));
        }
        catch (error) {
            console.error('Failed to list branches:', error);
            return [];
        }
    }
    async addWorktree(location, branch, createNew = true) {
        let resolvedPath = location;
        // Resolve relative paths
        if (!path.isAbsolute(location) && this.workspaceRoot) {
            resolvedPath = path.resolve(this.workspaceRoot, location);
        }
        try {
            if (createNew) {
                await this.executeGitCommand(`git worktree add -b "${branch}" "${resolvedPath}"`);
            }
            else {
                await this.executeGitCommand(`git worktree add "${resolvedPath}" "${branch}"`);
            }
        }
        catch (error) {
            throw new Error(`Failed to add worktree: ${error.message}`);
        }
    }
    async removeWorktree(worktreePath, force = false) {
        try {
            const forceFlag = force ? '--force' : '';
            await this.executeGitCommand(`git worktree remove ${forceFlag} "${worktreePath}"`);
        }
        catch (error) {
            throw new Error(`Failed to remove worktree: ${error.message}`);
        }
    }
    async pruneWorktrees() {
        try {
            await this.executeGitCommand('git worktree prune');
        }
        catch (error) {
            throw new Error(`Failed to prune worktrees: ${error.message}`);
        }
    }
    async getWorktreeInfo(worktreePath) {
        const worktrees = await this.listWorktrees();
        return worktrees.find(wt => wt.path === worktreePath) || null;
    }
    async isGitRepository() {
        try {
            await this.executeGitCommand('git rev-parse --git-dir');
            return true;
        }
        catch {
            return false;
        }
    }
    // NEW: Switch branch in a specific worktree
    async switchBranchInWorktree(worktreePath, branchName) {
        try {
            // First, check if the branch exists locally
            const branches = await this.executeGitCommand('git branch --format="%(refname:short)"', worktreePath);
            const branchExists = branches.split('\n').some(b => b.trim() === branchName);
            if (branchExists) {
                // Switch to existing local branch
                await this.executeGitCommand(`git checkout "${branchName}"`, worktreePath);
            }
            else {
                // Check if branch exists in remote with detected remote name
                const remote = await this.getRemoteName(worktreePath);
                const remoteBranches = await this.executeGitCommand('git branch -r --format="%(refname:short)"', worktreePath);
                const remoteBranchExists = remoteBranches.split('\n').some(b => b.trim() === `${remote}/${branchName}`);
                if (remoteBranchExists) {
                    // Create and checkout tracking branch
                    await this.executeGitCommand(`git checkout -b "${branchName}" "${remote}/${branchName}"`, worktreePath);
                }
                else {
                    throw new Error(`Branch '${branchName}' not found locally or in remote`);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to switch branch in worktree: ${error.message}`);
        }
    }
    // NEW: Create new branch in a specific worktree
    async createBranchInWorktree(worktreePath, branchName) {
        try {
            await this.executeGitCommand(`git checkout -b "${branchName}"`, worktreePath);
        }
        catch (error) {
            throw new Error(`Failed to create branch in worktree: ${error.message}`);
        }
    }
    // NEW: Pull changes in a specific worktree
    async pullInWorktree(worktreePath) {
        try {
            await this.executeGitCommand('git pull', worktreePath);
        }
        catch (error) {
            throw new Error(`Failed to pull changes in worktree: ${error.message}`);
        }
    }
    // NEW: Push changes from a specific worktree
    async pushInWorktree(worktreePath) {
        try {
            await this.executeGitCommand('git push', worktreePath);
        }
        catch (error) {
            throw new Error(`Failed to push changes from worktree: ${error.message}`);
        }
    }
    // NEW: Get current branch in a specific worktree
    async getCurrentBranch(worktreePath) {
        try {
            const output = await this.executeGitCommand('git rev-parse --abbrev-ref HEAD', worktreePath);
            return output === 'HEAD' ? null : output;
        }
        catch (error) {
            throw new Error(`Failed to get current branch: ${error.message}`);
        }
    }
    // NEW: Get remote name from git config
    async getRemoteName(worktreePath) {
        try {
            const output = await this.executeGitCommand('git remote', worktreePath);
            const lines = output.split('\n').filter(l => l.trim());
            return lines.length > 0 ? lines[0] : 'origin';
        }
        catch (error) {
            // If git config is not available, default to origin
            return 'origin';
        }
    }
    // NEW: Get worktree status (clean/dirty)
    async getWorktreeStatus(worktreePath) {
        try {
            const output = await this.executeGitCommand('git status --porcelain', worktreePath);
            return output.trim() === '' ? 'clean' : 'dirty';
        }
        catch (error) {
            throw new Error(`Failed to get worktree status: ${error.message}`);
        }
    }
    // NEW: Get the main worktree path
    async getMainWorktreePath() {
        try {
            const worktrees = await this.listWorktrees();
            const mainWorktree = worktrees.find(wt => wt.isMain);
            return mainWorktree ? mainWorktree.path : null;
        }
        catch (error) {
            throw new Error(`Failed to get main worktree path: ${error.message}`);
        }
    }
    // NEW: Check if a branch is locked in another worktree
    async isBranchLocked(branchName) {
        try {
            const lockingWorktree = await this.getBranchLockingWorktree(branchName);
            return lockingWorktree !== null;
        }
        catch (error) {
            throw new Error(`Failed to check branch lock status: ${error.message}`);
        }
    }
    // NEW: Get the worktree that has a branch locked
    async getBranchLockingWorktree(branchName) {
        try {
            const worktrees = await this.listWorktrees();
            for (const worktree of worktrees) {
                if (worktree.branch === branchName) {
                    return worktree;
                }
            }
            return null;
        }
        catch (error) {
            throw new Error(`Failed to get branch locking worktree: ${error.message}`);
        }
    }
    // NEW: Switch branch on main worktree with safety checks
    async switchMainWorktreeBranch(branchName) {
        try {
            // Get main worktree path
            const mainWorktreePath = await this.getMainWorktreePath();
            if (!mainWorktreePath) {
                return {
                    success: false,
                    message: 'Main worktree not found',
                    previousBranch: null
                };
            }
            // Get current branch
            const previousBranch = await this.getCurrentBranch(mainWorktreePath);
            if (previousBranch === branchName) {
                return {
                    success: true,
                    message: `Already on branch '${branchName}'`,
                    previousBranch,
                    newBranch: branchName
                };
            }
            // Check if branch is locked in another worktree
            const isLocked = await this.isBranchLocked(branchName);
            if (isLocked) {
                const lockingWorktree = await this.getBranchLockingWorktree(branchName);
                return {
                    success: false,
                    message: `Branch '${branchName}' is already checked out at ${lockingWorktree?.path}`,
                    previousBranch
                };
            }
            // Check for uncommitted changes
            const status = await this.getWorktreeStatus(mainWorktreePath);
            if (status === 'dirty') {
                return {
                    success: false,
                    message: 'Main worktree has uncommitted changes. Please commit or stash before switching.',
                    previousBranch: null
                };
            }
            // Check if branch exists locally
            const branches = await this.executeGitCommand('git branch --format="%(refname:short)"', mainWorktreePath);
            const branchExists = branches.split('\n').some(b => b.trim() === branchName);
            if (!branchExists) {
                // Check if branch exists in remote
                const remote = await this.getRemoteName(mainWorktreePath);
                const remoteBranches = await this.executeGitCommand('git branch -r --format="%(refname:short)"', mainWorktreePath);
                const remoteBranchExists = remoteBranches.split('\n').some(b => b.trim() === `${remote}/${branchName}`);
                if (remoteBranchExists) {
                    // Create and checkout tracking branch
                    await this.executeGitCommand(`git checkout -b "${branchName}" "${remote}/${branchName}"`, mainWorktreePath);
                }
                else {
                    return {
                        success: false,
                        message: `Branch '${branchName}' not found locally or in remote`,
                        previousBranch: null
                    };
                }
            }
            else {
                // Switch to existing local branch
                await this.executeGitCommand(`git checkout "${branchName}"`, mainWorktreePath);
            }
            return {
                success: true,
                message: `Switched main worktree from '${previousBranch}' to '${branchName}'`,
                previousBranch,
                newBranch: branchName
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to switch main worktree branch: ${error.message}`,
                previousBranch: null
            };
        }
    }
    // NEW: Stash changes in a worktree
    async stashChanges(worktreePath, message = 'Auto-stash') {
        try {
            await this.executeGitCommand(`git stash push -m "${message}"`, worktreePath);
        }
        catch (error) {
            throw new Error(`Failed to stash changes: ${error.message}`);
        }
    }
}
exports.GitWorktreeManager = GitWorktreeManager;
//# sourceMappingURL=gitWorktreeManager.js.map