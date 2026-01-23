import * as vscode from 'vscode';
import { GitWorktreeManager, Worktree } from '../gitWorktreeManager';

export interface HealthIssue {
    type: 'warning' | 'error' | 'info';
    message: string;
    worktree: Worktree;
    actionLabel?: string;
    action?: () => Promise<void>;
}

export interface WorktreeHealth {
    worktree: Worktree;
    score: number; // 0-100
    issues: HealthIssue[];
    lastActivity?: Date;
    daysSinceActivity?: number;
    uncommittedChanges?: boolean;
    commitsBehind?: number;
}

export class HealthMonitor {
    private static readonly OLD_CHANGES_THRESHOLD_DAYS = 7;
    private static readonly INACTIVE_THRESHOLD_DAYS = 14;
    private static readonly BEHIND_THRESHOLD = 50;

    constructor(private gitManager: GitWorktreeManager) { }

    async analyzeWorktreeHealth(worktree: Worktree): Promise<WorktreeHealth> {
        const issues: HealthIssue[] = [];
        let score = 100;

        // Check for uncommitted changes
        const status = await this.gitManager.getWorktreeStatus(worktree.path);
        const hasUncommittedChanges = status === 'dirty';

        if (hasUncommittedChanges) {
            issues.push({
                type: 'warning',
                message: 'Has uncommitted changes',
                worktree
            });
            score -= 10;
        }

        // Check sync status
        const sync = await this.gitManager.getSyncStatus(worktree.path);
        if (sync && (sync.ahead > 0 || sync.behind > 0)) {
            if (sync.behind > HealthMonitor.BEHIND_THRESHOLD) {
                issues.push({
                    type: 'error',
                    message: `${sync.behind} commits behind remote`,
                    worktree
                });
                score -= 30;
            } else if (sync.behind > 10) {
                issues.push({
                    type: 'warning',
                    message: `${sync.behind} commits behind remote`,
                    worktree
                });
                score -= 15;
            }

            if (sync.ahead > 20) {
                issues.push({
                    type: 'info',
                    message: `${sync.ahead} commits ahead (consider pushing)`,
                    worktree
                });
            }
        }

        // Check if branch is merged
        if (!worktree.isMain) {
            const isMerged = await this.gitManager.isMerged(worktree.path);
            if (isMerged) {
                issues.push({
                    type: 'info',
                    message: 'Branch has been merged (can be cleaned up)',
                    worktree
                });
                score -= 5;
            }
        }

        return {
            worktree,
            score: Math.max(0, score),
            issues,
            uncommittedChanges: hasUncommittedChanges,
            commitsBehind: sync?.behind
        };
    }

    async analyzeAllWorktrees(): Promise<WorktreeHealth[]> {
        const worktrees = await this.gitManager.listWorktrees();
        const healthResults: WorktreeHealth[] = [];

        for (const worktree of worktrees) {
            try {
                const health = await this.analyzeWorktreeHealth(worktree);
                healthResults.push(health);
            } catch (error) {
                console.error(`Health check failed for ${worktree.path}:`, error);
            }
        }

        return healthResults.sort((a, b) => a.score - b.score); // Worst first
    }

    getHealthColor(score: number): vscode.ThemeColor {
        if (score >= 80) {
            return new vscode.ThemeColor('testing.iconPassed');
        } else if (score >= 50) {
            return new vscode.ThemeColor('testing.iconQueued');
        } else {
            return new vscode.ThemeColor('testing.iconFailed');
        }
    }

    getHealthIcon(score: number): string {
        if (score >= 80) return 'pass';
        if (score >= 50) return 'warning';
        return 'error';
    }
}
