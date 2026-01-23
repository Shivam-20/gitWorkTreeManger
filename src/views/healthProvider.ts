import * as vscode from 'vscode';
import { HealthMonitor, WorktreeHealth, HealthIssue } from '../health/healthMonitor';
import { GitWorktreeManager } from '../gitWorktreeManager';

export class HealthProvider implements vscode.TreeDataProvider<HealthItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HealthItem | undefined | null | void> =
        new vscode.EventEmitter<HealthItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HealthItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private healthMonitor: HealthMonitor;
    private healthData: WorktreeHealth[] = [];

    constructor(private gitManager: GitWorktreeManager) {
        this.healthMonitor = new HealthMonitor(gitManager);
        this.refresh();
    }

    async refresh(): Promise<void> {
        this.healthData = await this.healthMonitor.analyzeAllWorktrees();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HealthItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: HealthItem): Promise<HealthItem[]> {
        if (!element) {
            // Root level - show all worktrees with health scores
            return this.healthData.map(health => new HealthItem(health, 'worktree'));
        }

        if (element.type === 'worktree') {
            // Show issues for this worktree
            return element.health.issues.map(issue => new HealthItem(element.health, 'issue', issue));
        }

        return [];
    }
}

class HealthItem extends vscode.TreeItem {
    constructor(
        public readonly health: WorktreeHealth,
        public readonly type: 'worktree' | 'issue',
        public readonly issue?: HealthIssue
    ) {
        super(
            type === 'worktree'
                ? `${health.worktree.branch || 'detached'} (Score: ${health.score})`
                : issue!.message,
            type === 'worktree' && health.issues.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        if (type === 'worktree') {
            this.description = `${health.worktree.path}`;
            this.iconPath = new vscode.ThemeIcon(
                health.score >= 80 ? 'pass' : health.score >= 50 ? 'warning' : 'error',
                health.score >= 80
                    ? new vscode.ThemeColor('testing.iconPassed')
                    : health.score >= 50
                        ? new vscode.ThemeColor('testing.iconQueued')
                        : new vscode.ThemeColor('testing.iconFailed')
            );
            this.tooltip = `Health Score: ${health.score}/100\n${health.issues.length} issues`;
        } else if (issue) {
            this.iconPath = new vscode.ThemeIcon(
                issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'
            );
            this.contextValue = 'healthIssue';
        }
    }
}
