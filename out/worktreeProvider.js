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
exports.WorktreeItem = exports.WorktreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class WorktreeProvider {
    constructor(gitManager) {
        this.gitManager = gitManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.statusCache = new Map();
        this.notes = {};
        this.recentPaths = [];
    }
    setNotes(notes) {
        this.notes = notes;
    }
    setRecentPaths(paths) {
        this.recentPaths = paths;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root level - show sections if there are recent worktrees
            const isGitRepo = await this.gitManager.isGitRepository();
            if (!isGitRepo)
                return [];
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
    async getWorktreeItems() {
        const worktrees = await this.gitManager.listWorktrees();
        // Sort worktrees based on configuration
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const sortOrder = config.get('sortOrder', 'default');
        if (sortOrder !== 'default') {
            worktrees.sort((a, b) => {
                if (a.isMain && !b.isMain)
                    return -1;
                if (!a.isMain && b.isMain)
                    return 1;
                if (sortOrder === 'branch') {
                    const branchA = a.branch || '';
                    const branchB = b.branch || '';
                    return branchA.localeCompare(branchB);
                }
                else if (sortOrder === 'path') {
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
    async updateStatuses(items) {
        for (const item of items) {
            try {
                const status = await this.gitManager.getWorktreeStatus(item.worktree.path);
                const sync = await this.gitManager.getSyncStatus(item.worktree.path);
                this.statusCache.set(item.worktree.path, { status, sync });
                item.updateStatus(status, sync);
                this._onDidChangeTreeData.fire(item);
            }
            catch (error) {
                console.error(`Status update failed for ${item.worktree.path}:`, error);
            }
        }
    }
}
exports.WorktreeProvider = WorktreeProvider;
class SectionItem extends vscode.TreeItem {
    constructor(label, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = 'section';
    }
}
class WorktreeItem extends vscode.TreeItem {
    constructor(worktree, gitManager, note) {
        super(worktree.branch || 'detached', vscode.TreeItemCollapsibleState.None);
        this.worktree = worktree;
        this.gitManager = gitManager;
        this.note = note;
        this.status = 'clean';
        this.sync = null;
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
    updateStatus(status, sync) {
        this.status = status;
        this.sync = sync;
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.iconPath = this.getIcon();
    }
    getTooltip() {
        const parts = [];
        if (this.worktree.branch) {
            parts.push(`Branch: ${this.worktree.branch}`);
        }
        parts.push(`Path: ${this.worktree.path}`);
        parts.push(`Commit: ${this.worktree.commit.substring(0, 8)}`);
        if (this.status === 'dirty') {
            parts.push('Status: Uncommitted changes');
        }
        else {
            parts.push('Status: Clean');
        }
        if (this.sync) {
            if (this.sync.ahead > 0 || this.sync.behind > 0) {
                parts.push(`Sync: ${this.sync.ahead} ahead, ${this.sync.behind} behind`);
            }
            else {
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
    getDescription() {
        const parts = [];
        if (this.worktree.isMain) {
            parts.push('(main)');
        }
        parts.push(path.basename(this.worktree.path));
        const statusParts = [];
        if (this.status === 'dirty') {
            statusParts.push('*');
        }
        if (this.sync) {
            if (this.sync.ahead > 0)
                statusParts.push(`↑${this.sync.ahead}`);
            if (this.sync.behind > 0)
                statusParts.push(`↓${this.sync.behind}`);
        }
        if (statusParts.length > 0) {
            parts.push(`[${statusParts.join(' ')}]`);
        }
        if (this.note) {
            parts.push(`• ${this.note}`);
        }
        return parts.join(' ');
    }
    getIcon() {
        const color = this.status === 'dirty' ? new vscode.ThemeColor('charts.orange') : undefined;
        if (this.worktree.isMain) {
            return new vscode.ThemeIcon('home', color);
        }
        return new vscode.ThemeIcon(this.status === 'dirty' ? 'file-submodule' : 'git-branch', color);
    }
}
exports.WorktreeItem = WorktreeItem;
//# sourceMappingURL=worktreeProvider.js.map