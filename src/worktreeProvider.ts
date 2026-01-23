import * as vscode from 'vscode';
import * as path from 'path';
import { GitWorktreeManager, Worktree } from './gitWorktreeManager';

export class WorktreeProvider implements vscode.TreeDataProvider<WorktreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorktreeItem | undefined | null | void> = 
        new vscode.EventEmitter<WorktreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorktreeItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    constructor(private gitManager: GitWorktreeManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: WorktreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: WorktreeItem): Promise<WorktreeItem[]> {
        if (!element) {
            // Root level - show all worktrees
            const isGitRepo = await this.gitManager.isGitRepository();
            if (!isGitRepo) {
                return [];
            }

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

            return worktrees.map(wt => new WorktreeItem(wt, this.gitManager));
        }

        return [];
    }
}

export class WorktreeItem extends vscode.TreeItem {
    constructor(
        public readonly worktree: Worktree,
        private gitManager: GitWorktreeManager
    ) {
        super(
            worktree.branch || 'detached',
            vscode.TreeItemCollapsibleState.None
        );

        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.contextValue = 'worktree';
        this.iconPath = this.getIcon();
        
        // Set command to switch to worktree on click
        this.command = {
            command: 'gitWorktree.switch',
            title: 'Switch to Worktree',
            arguments: [this]
        };
    }

    private getTooltip(): string {
        const parts: string[] = [];
        
        if (this.worktree.branch) {
            parts.push(`Branch: ${this.worktree.branch}`);
        }
        
        parts.push(`Path: ${this.worktree.path}`);
        parts.push(`Commit: ${this.worktree.commit.substring(0, 8)}`);
        
        // Note: Additional branch/status info would require async operations
        // For now, we keep tooltip synchronous for performance
        
        if (this.worktree.isMain) {
            parts.push('(Main worktree)');
        }
        
        return parts.join('\n');
    }

    private getDescription(): string {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const showBranchNames = config.get<boolean>('showBranchNames', true);
        
        const parts: string[] = [];
        
        if (this.worktree.isMain) {
            parts.push('(main)');
        }
        
        parts.push(path.basename(this.worktree.path));
        
        return parts.join(' ');
    }

    private getIcon(): vscode.ThemeIcon {
        if (this.worktree.isMain) {
            return new vscode.ThemeIcon('home');
        }
        return new vscode.ThemeIcon('git-branch');
    }
}
