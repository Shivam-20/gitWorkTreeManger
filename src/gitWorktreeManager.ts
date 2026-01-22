import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface Worktree {
    path: string;
    commit: string;
    branch: string | null;
    isMain: boolean;
}

export class GitWorktreeManager {
    private workspaceRoot: string | undefined;

    constructor() {
        this.workspaceRoot = this.getWorkspaceRoot();
    }

    private getWorkspaceRoot(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }
        return undefined;
    }

    private async executeGitCommand(command: string, cwd?: string): Promise<string> {
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
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }

    async listWorktrees(): Promise<Worktree[]> {
        try {
            const output = await this.executeGitCommand('git worktree list --porcelain');
            return this.parseWorktreeList(output);
        } catch (error) {
            console.error('Failed to list worktrees:', error);
            return [];
        }
    }

    private parseWorktreeList(output: string): Worktree[] {
        const worktrees: Worktree[] = [];
        const lines = output.split('\n');
        let currentWorktree: Partial<Worktree> = {};

        for (const line of lines) {
            if (line.startsWith('worktree ')) {
                currentWorktree.path = line.substring(9);
            } else if (line.startsWith('HEAD ')) {
                currentWorktree.commit = line.substring(5);
            } else if (line.startsWith('branch ')) {
                const branchRef = line.substring(7);
                currentWorktree.branch = branchRef.replace('refs/heads/', '');
            } else if (line.startsWith('bare')) {
                // Bare repository - skip
                currentWorktree = {};
            } else if (line === '') {
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

        return worktrees;
    }

    async listBranches(): Promise<string[]> {
        try {
            const output = await this.executeGitCommand('git branch -a --format="%(refname:short)"');
            return output
                .split('\n')
                .map(b => b.trim().replace(/^"/, '').replace(/"$/, ''))
                .filter(b => b && !b.includes('HEAD'));
        } catch (error) {
            console.error('Failed to list branches:', error);
            return [];
        }
    }

    async addWorktree(location: string, branch: string, createNew: boolean = true): Promise<void> {
        let resolvedPath = location;
        
        // Resolve relative paths
        if (!path.isAbsolute(location) && this.workspaceRoot) {
            resolvedPath = path.resolve(this.workspaceRoot, location);
        }

        try {
            if (createNew) {
                await this.executeGitCommand(`git worktree add -b "${branch}" "${resolvedPath}"`);
            } else {
                await this.executeGitCommand(`git worktree add "${resolvedPath}" "${branch}"`);
            }
        } catch (error: any) {
            throw new Error(`Failed to add worktree: ${error.message}`);
        }
    }

    async removeWorktree(worktreePath: string, force: boolean = false): Promise<void> {
        try {
            const forceFlag = force ? '--force' : '';
            await this.executeGitCommand(`git worktree remove ${forceFlag} "${worktreePath}"`);
        } catch (error: any) {
            throw new Error(`Failed to remove worktree: ${error.message}`);
        }
    }

    async pruneWorktrees(): Promise<void> {
        try {
            await this.executeGitCommand('git worktree prune');
        } catch (error: any) {
            throw new Error(`Failed to prune worktrees: ${error.message}`);
        }
    }

    async getWorktreeInfo(worktreePath: string): Promise<Worktree | null> {
        const worktrees = await this.listWorktrees();
        return worktrees.find(wt => wt.path === worktreePath) || null;
    }

    async isGitRepository(): Promise<boolean> {
        try {
            await this.executeGitCommand('git rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    // NEW: Switch branch in a specific worktree
    async switchBranchInWorktree(worktreePath: string, branchName: string): Promise<void> {
        try {
            // First, check if the branch exists locally
            const branches = await this.executeGitCommand('git branch --format="%(refname:short)"', worktreePath);
            const branchExists = branches.split('\n').some(b => b.trim() === branchName);

            if (branchExists) {
                // Switch to existing local branch
                await this.executeGitCommand(`git checkout "${branchName}"`, worktreePath);
            } else {
                // Check if branch exists in remote with detected remote name
                const remote = await this.getRemoteName(worktreePath);
                const remoteBranches = await this.executeGitCommand('git branch -r --format="%(refname:short)"', worktreePath);
                const remoteBranchExists = remoteBranches.split('\n').some(b => b.trim() === `${remote}/${branchName}`);

                if (remoteBranchExists) {
                    // Create and checkout tracking branch
                    await this.executeGitCommand(`git checkout -b "${branchName}" "${remote}/${branchName}"`, worktreePath);
                } else {
                    throw new Error(`Branch '${branchName}' not found locally or in remote`);
                }
            }
        } catch (error: any) {
            throw new Error(`Failed to switch branch in worktree: ${error.message}`);
        }
    }

    // NEW: Create new branch in a specific worktree
    async createBranchInWorktree(worktreePath: string, branchName: string): Promise<void> {
        try {
            await this.executeGitCommand(`git checkout -b "${branchName}"`, worktreePath);
        } catch (error: any) {
            throw new Error(`Failed to create branch in worktree: ${error.message}`);
        }
    }

    // NEW: Pull changes in a specific worktree
    async pullInWorktree(worktreePath: string): Promise<void> {
        try {
            await this.executeGitCommand('git pull', worktreePath);
        } catch (error: any) {
            throw new Error(`Failed to pull changes in worktree: ${error.message}`);
        }
    }

    // NEW: Push changes from a specific worktree
    async pushInWorktree(worktreePath: string): Promise<void> {
        try {
            await this.executeGitCommand('git push', worktreePath);
        } catch (error: any) {
            throw new Error(`Failed to push changes from worktree: ${error.message}`);
        }
    }

    // NEW: Get current branch in a specific worktree
    async getCurrentBranch(worktreePath: string): Promise<string | null> {
        try {
            const output = await this.executeGitCommand('git rev-parse --abbrev-ref HEAD', worktreePath);
            return output === 'HEAD' ? null : output;
        } catch (error: any) {
            throw new Error(`Failed to get current branch: ${error.message}`);
        }
    }

    // NEW: Get remote name from git config
    private async getRemoteName(worktreePath: string): Promise<string> {
        try {
            const output = await this.executeGitCommand('git remote', worktreePath);
            const lines = output.split('\n').filter(l => l.trim());
            return lines.length > 0 ? lines[0] : 'origin';
        } catch (error: any) {
            // If git config is not available, default to origin
            return 'origin';
        }
    }

    // NEW: Get worktree status (clean/dirty)
    async getWorktreeStatus(worktreePath: string): Promise<string> {
        try {
            const output = await this.executeGitCommand('git status --porcelain', worktreePath);
            return output.trim() === '' ? 'clean' : 'dirty';
        } catch (error: any) {
            throw new Error(`Failed to get worktree status: ${error.message}`);
        }
    }
}
