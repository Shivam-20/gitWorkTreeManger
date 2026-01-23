import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LifecycleHooks {
    onCreate?: string;
    onDelete?: string;
    onSwitch?: string;
}

export class HooksManager {
    constructor() { }

    /**
     * Execute a hook command with variable substitution
     */
    async executeHook(
        hookCommand: string,
        variables: {
            path: string;
            branch: string;
            worktree: string;
        }
    ): Promise<{ success: boolean; output: string; error?: string }> {
        // Substitute variables
        let command = hookCommand
            .replace(/\{path\}/g, variables.path)
            .replace(/\{branch\}/g, variables.branch)
            .replace(/\{worktree\}/g, variables.worktree);

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: variables.path,
                maxBuffer: 10 * 1024 * 1024
            });

            return {
                success: true,
                output: stdout,
                error: stderr || undefined
            };
        } catch (error: any) {
            return {
                success: false,
                output: '',
                error: error.message
            };
        }
    }

    /**
     * Get hooks configuration from workspace settings
     */
    getHooksConfig(): LifecycleHooks {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        return config.get<LifecycleHooks>('hooks', {});
    }

    /**
     * Execute onCreate hook
     */
    async onWorktreeCreate(path: string, branch: string): Promise<void> {
        const hooks = this.getHooksConfig();
        if (!hooks.onCreate) return;

        try {
            const result = await this.executeHook(hooks.onCreate, {
                path,
                branch,
                worktree: path
            });

            if (result.success) {
                vscode.window.showInformationMessage(`onCreate hook executed successfully`);
            } else {
                vscode.window.showWarningMessage(`onCreate hook failed: ${result.error}`);
            }
        } catch (error) {
            console.error('onCreate hook error:', error);
        }
    }

    /**
     * Execute onDelete hook
     */
    async onWorktreeDelete(path: string, branch: string): Promise<void> {
        const hooks = this.getHooksConfig();
        if (!hooks.onDelete) return;

        try {
            const result = await this.executeHook(hooks.onDelete, {
                path,
                branch,
                worktree: path
            });

            if (result.success) {
                vscode.window.showInformationMessage(`onDelete hook executed successfully`);
            } else {
                vscode.window.showWarningMessage(`onDelete hook failed: ${result.error}`);
            }
        } catch (error) {
            console.error('onDelete hook error:', error);
        }
    }

    /**
     * Execute onSwitch hook
     */
    async onWorktreeSwitch(path: string, branch: string): Promise<void> {
        const hooks = this.getHooksConfig();
        if (!hooks.onSwitch) return;

        try {
            const result = await this.executeHook(hooks.onSwitch, {
                path,
                branch,
                worktree: path
            });

            if (result.success) {
                vscode.window.showInformationMessage(`onSwitch hook executed successfully`);
            } else {
                vscode.window.showWarningMessage(`onSwitch hook failed: ${result.error}`);
            }
        } catch (error) {
            console.error('onSwitch hook error:', error);
        }
    }
}
