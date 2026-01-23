import * as vscode from 'vscode';
import * as path from 'path';
import { GitWorktreeManager, Worktree } from './gitWorktreeManager';

export class WorktreeProvider implements vscode.TreeDataProvider<WorktreeItem | SectionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorktreeItem | undefined | null | void> =
        new vscode.EventEmitter<WorktreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorktreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private statusCache: Map<string, { status: string, sync: { ahead: number, behind: number } | null }> = new Map();
    private notes: Record<string, string> = {};
    private recentPaths: string[] = [];

    constructor(private gitManager: GitWorktreeManager) { }

    setNotes(notes: Record<string, string>) {
        this.notes = notes;
    }

    setRecentPaths(paths: string[]) {
        this.recentPaths = paths;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: WorktreeItem | SectionItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: WorktreeItem | SectionItem): Promise<(WorktreeItem | SectionItem)[]> {
        if (!element) {
            // Root level - show sections if there are recent worktrees
            const isGitRepo = await this.gitManager.isGitRepository();
            if (!isGitRepo) return [];

            if (this.recentPaths.length > 0) {
                return [
                    new SectionItem('Recent', vscode.TreeItemCollapsibleState.Expanded),
                    new SectionItem('All Worktrees', vscode.TreeItemCollapsibleState.Expanded)
                ];
            }

            return this.getWorktreeItems();
        }

        if (element instanceof SectionItem) {
            const allItems = await this.getWorktreeItems();
            if (element.label === 'Recent') {
                return allItems.filter(item => this.recentPaths.includes(item.worktree.path));
            }
            return allItems;
        }

        return [];
    }

    private async getWorktreeItems(): Promise<WorktreeItem[]> {
        const worktrees = await this.gitManager.listWorktrees();

        // Sort worktrees based on configuration
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const sortOrder = config.get<string>('sortOrder', 'default');

        if (sortOrder !== 'default') {
            worktrees.sort((a, b) => {
                if (a.isMain && !b.isMain) return -1;
                if (!a.isMain && b.isMain) return 1;

                if (sortOrder === 'branch') {
                    const branchA = a.branch || '';
                    const branchB = b.branch || '';
                    return branchA.localeCompare(branchB);
                } else if (sortOrder === 'path') {
                    return a.path.localeCompare(b.path);
                }
                return 0;
            });
        }

        const items = worktrees.map(wt => new WorktreeItem(wt, this.gitManager, this.notes[wt.path]));

        // Trigger status updates asynchronously
        this.updateStatuses(items);

        return items;
    }

    private async updateStatuses(items: WorktreeItem[]): Promise<void> {
        for (const item of items) {
            try {
                const status = await this.gitManager.getWorktreeStatus(item.worktree.path);
                const sync = await this.gitManager.getSyncStatus(item.worktree.path);

                this.statusCache.set(item.worktree.path, { status, sync });
                item.updateStatus(status, sync);
                this._onDidChangeTreeData.fire(item);
            } catch (error) {
                console.error(`Status update failed for ${item.worktree.path}:`, error);
            }
        }
    }
}

class SectionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = 'section';
    }
}

export class WorktreeItem extends vscode.TreeItem {
    private status: string = 'clean';
    private sync: { ahead: number, behind: number } | null = null;

    constructor(
        public readonly worktree: Worktree,
        private gitManager: GitWorktreeManager,
        private note?: string
    ) {
        super(
            worktree.branch || 'detached',
            vscode.TreeItemCollapsibleState.None
        );

        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.contextValue = 'worktree';
        this.iconPath = this.getIcon();

        this.command = {
            command: 'gitWorktree.switch',
            title: 'Switch to Worktree',
            arguments: [this]
        };
    }

    public updateStatus(status: string, sync: { ahead: number, behind: number } | null) {
        this.status = status;
        this.sync = sync;
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.iconPath = this.getIcon();
    }

    private getTooltip(): string {
        const parts: string[] = [];

        if (this.worktree.branch) {
            parts.push(`Branch: ${this.worktree.branch}`);
        }

        parts.push(`Path: ${this.worktree.path}`);
        parts.push(`Commit: ${this.worktree.commit.substring(0, 8)}`);

        if (this.status === 'dirty') {
            parts.push('Status: Uncommitted changes');
        } else {
            parts.push('Status: Clean');
        }

        if (this.sync) {
            if (this.sync.ahead > 0 || this.sync.behind > 0) {
                parts.push(`Sync: ${this.sync.ahead} ahead, ${this.sync.behind} behind`);
            } else {
                parts.push('Sync: Up to date');
            }
        }

        if (this.note) {
            parts.push(`Note: ${this.note}`);
        }

        if (this.worktree.isMain) {
            parts.push('(Main worktree)');
        }

        return parts.join('\n');
    }

    private getDescription(): string {
        const parts: string[] = [];

        if (this.worktree.isMain) {
            parts.push('(main)');
        }

        parts.push(path.basename(this.worktree.path));

        const statusParts: string[] = [];
        if (this.status === 'dirty') {
            statusParts.push('*');
        }

        if (this.sync) {
            if (this.sync.ahead > 0) statusParts.push(`↑${this.sync.ahead}`);
            if (this.sync.behind > 0) statusParts.push(`↓${this.sync.behind}`);
        }

        if (statusParts.length > 0) {
            parts.push(`[${statusParts.join(' ')}]`);
        }

        if (this.note) {
            parts.push(`• ${this.note}`);
        }

        return parts.join(' ');
    }

    private getIcon(): vscode.ThemeIcon {
        const color = this.status === 'dirty' ? new vscode.ThemeColor('charts.orange') : undefined;

        if (this.worktree.isMain) {
            return new vscode.ThemeIcon('home', color);
        }

        return new vscode.ThemeIcon(this.status === 'dirty' ? 'file-submodule' : 'git-branch', color);
    }
}
