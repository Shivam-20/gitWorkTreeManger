import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitWorktreeManager, Worktree } from '../gitWorktreeManager';

interface DependencyInfo {
    name: string;
    version: string;
}

interface WorktreeDependencies {
    worktree: Worktree;
    dependencies: DependencyInfo[];
    devDependencies: DependencyInfo[];
}

export class GraphProvider implements vscode.TreeDataProvider<GraphItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GraphItem | undefined | null | void> =
        new vscode.EventEmitter<GraphItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GraphItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private dependencyData: WorktreeDependencies[] = [];

    constructor(private gitManager: GitWorktreeManager) {
        this.refresh();
    }

    async refresh(): Promise<void> {
        const worktrees = await this.gitManager.listWorktrees();
        this.dependencyData = [];

        for (const worktree of worktrees) {
            const deps = await this.parseDependencies(worktree.path);
            if (deps) {
                this.dependencyData.push({
                    worktree,
                    dependencies: deps.dependencies,
                    devDependencies: deps.devDependencies
                });
            }
        }

        this._onDidChangeTreeData.fire();
    }

    private async parseDependencies(
        worktreePath: string
    ): Promise<{ dependencies: DependencyInfo[]; devDependencies: DependencyInfo[] } | null> {
        const packageJsonPath = path.join(worktreePath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(content);

            const dependencies: DependencyInfo[] = packageJson.dependencies
                ? Object.entries(packageJson.dependencies).map(([name, version]) => ({
                    name,
                    version: version as string
                }))
                : [];

            const devDependencies: DependencyInfo[] = packageJson.devDependencies
                ? Object.entries(packageJson.devDependencies).map(([name, version]) => ({
                    name,
                    version: version as string
                }))
                : [];

            return { dependencies, devDependencies };
        } catch (error) {
            console.error(`Failed to parse package.json in ${worktreePath}:`, error);
            return null;
        }
    }

    getTreeItem(element: GraphItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GraphItem): Promise<GraphItem[]> {
        if (!element) {
            // Root level - show all worktrees
            return this.dependencyData.map(data => new GraphItem(data.worktree, 'worktree', data));
        }

        if (element.type === 'worktree' && element.data) {
            const items: GraphItem[] = [];

            if (element.data.dependencies.length > 0) {
                items.push(
                    new GraphItem(
                        null as any,
                        'section',
                        element.data,
                        `Dependencies (${element.data.dependencies.length})`
                    )
                );
            }

            if (element.data.devDependencies.length > 0) {
                items.push(
                    new GraphItem(
                        null as any,
                        'section',
                        element.data,
                        `Dev Dependencies (${element.data.devDependencies.length})`
                    )
                );
            }

            // Show shared dependencies
            const sharedDeps = this.findSharedDependencies(element.data);
            if (sharedDeps.length > 0) {
                items.push(
                    new GraphItem(null as any, 'shared', element.data, `Shared with ${sharedDeps.length} worktrees`)
                );
            }

            return items;
        }

        if (element.type === 'section' && element.data) {
            const isDevDeps = typeof element.label === 'string' && element.label.includes('Dev');
            const deps = isDevDeps ? element.data.devDependencies : element.data.dependencies;
            return deps.slice(0, 10).map(dep => new GraphItem(null as any, 'dependency', element.data, dep.name));
        }

        return [];
    }

    private findSharedDependencies(data: WorktreeDependencies): WorktreeDependencies[] {
        const shared: WorktreeDependencies[] = [];

        for (const other of this.dependencyData) {
            if (other.worktree.path === data.worktree.path) continue;

            const hasShared = data.dependencies.some(dep =>
                other.dependencies.some(otherDep => otherDep.name === dep.name)
            );

            if (hasShared) {
                shared.push(other);
            }
        }

        return shared;
    }
}

class GraphItem extends vscode.TreeItem {
    constructor(
        public readonly worktree: Worktree,
        public readonly type: 'worktree' | 'section' | 'dependency' | 'shared',
        public readonly data?: WorktreeDependencies,
        label?: string
    ) {
        super(
            label || (worktree ? worktree.branch || 'detached' : ''),
            type === 'worktree' || type === 'section'
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        if (type === 'worktree') {
            this.description = `${data?.dependencies.length || 0} deps`;
            this.iconPath = new vscode.ThemeIcon('file-directory');
        } else if (type === 'dependency') {
            this.iconPath = new vscode.ThemeIcon('package');
        } else if (type === 'shared') {
            this.iconPath = new vscode.ThemeIcon('link');
        }

        this.contextValue = type;
    }
}
