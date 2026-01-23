import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitWorktreeManager } from './gitWorktreeManager';

export interface ModifiedFile {
    path: string;
    status: string; // M, A, D, ??, etc.
    isStaged: boolean;
    displayLabel: string;
}

export class FileTransferManager {
    constructor(private gitManager: GitWorktreeManager) { }

    /**
     * Get list of modified files in a worktree
     */
    async getModifiedFiles(worktreePath: string): Promise<ModifiedFile[]> {
        try {
            const output = await this.executeGitCommand('git status --porcelain', worktreePath);
            return this.parseGitStatus(output);
        } catch (error) {
            console.error('Failed to get modified files:', error);
            return [];
        }
    }

    private parseGitStatus(output: string): ModifiedFile[] {
        const files: ModifiedFile[] = [];
        const lines = output.split('\n').filter(line => line.trim());

        for (const line of lines) {
            if (line.length < 3) continue;

            const statusCode = line.substring(0, 2);
            const filePath = line.substring(3);

            let status = '';
            let isStaged = false;
            let displayLabel = '';

            // Parse git status codes
            if (statusCode === '??') {
                status = 'untracked';
                displayLabel = `❓ ${filePath} (Untracked)`;
            } else if (statusCode[0] !== ' ') {
                // Staged change
                isStaged = true;
                if (statusCode[0] === 'M') {
                    status = 'modified';
                    displayLabel = `✏️ ${filePath} (Staged - Modified)`;
                } else if (statusCode[0] === 'A') {
                    status = 'added';
                    displayLabel = `➕ ${filePath} (Staged - Added)`;
                } else if (statusCode[0] === 'D') {
                    status = 'deleted';
                    displayLabel = `➖ ${filePath} (Staged - Deleted)`;
                }
            } else if (statusCode[1] !== ' ') {
                // Unstaged change
                if (statusCode[1] === 'M') {
                    status = 'modified';
                    displayLabel = `📝 ${filePath} (Modified)`;
                } else if (statusCode[1] === 'D') {
                    status = 'deleted';
                    displayLabel = `🗑️ ${filePath} (Deleted)`;
                }
            }

            if (status && status !== 'deleted') { // Skip deleted files
                files.push({
                    path: filePath,
                    status,
                    isStaged,
                    displayLabel
                });
            }
        }

        return files;
    }

    /**
     * Transfer files from source to target worktree
     */
    async transferFiles(
        sourceWorktreePath: string,
        targetWorktreePath: string,
        files: ModifiedFile[],
        options?: {
            confirmOverwrite?: boolean;
            autoStage?: boolean;
        }
    ): Promise<{ success: number; failed: number; skipped: number }> {
        let success = 0;
        let failed = 0;
        let skipped = 0;

        const confirmOverwrite = options?.confirmOverwrite ?? true;
        const autoStage = options?.autoStage ?? true;

        for (const file of files) {
            try {
                const sourcePath = path.join(sourceWorktreePath, file.path);
                const targetPath = path.join(targetWorktreePath, file.path);

                // Check if file exists in target
                if (fs.existsSync(targetPath)) {
                    if (confirmOverwrite) {
                        const answer = await vscode.window.showWarningMessage(
                            `File ${file.path} already exists in target worktree. Overwrite?`,
                            'Yes',
                            'No',
                            'Yes to All'
                        );

                        if (answer === 'No') {
                            skipped++;
                            continue;
                        } else if (answer === 'Yes to All') {
                            options!.confirmOverwrite = false; // Disable future prompts
                        }
                    }
                }

                // Create target directory if needed
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                // Copy file
                fs.copyFileSync(sourcePath, targetPath);

                // Stage in target if original was staged (and autoStage enabled)
                if (file.isStaged && autoStage) {
                    await this.executeGitCommand(`git add "${file.path}"`, targetWorktreePath);
                }

                // Reset file in source (remove from staging and working dir)
                if (file.isStaged) {
                    await this.executeGitCommand(`git reset HEAD "${file.path}"`, sourceWorktreePath);
                }

                if (file.status === 'untracked') {
                    // Just delete untracked file
                    fs.unlinkSync(sourcePath);
                } else {
                    // Checkout to discard changes
                    await this.executeGitCommand(`git checkout -- "${file.path}"`, sourceWorktreePath);
                }

                success++;
            } catch (error) {
                console.error(`Failed to transfer ${file.path}:`, error);
                failed++;
            }
        }

        return { success, failed, skipped };
    }

    private async executeGitCommand(command: string, cwd: string): Promise<string> {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            const { stdout } = await execAsync(command, { cwd, maxBuffer: 10 * 1024 * 1024 });
            return stdout.trim();
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }
}
