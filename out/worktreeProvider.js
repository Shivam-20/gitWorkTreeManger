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
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root level - show all worktrees
            const isGitRepo = await this.gitManager.isGitRepository();
            if (!isGitRepo) {
                return [];
            }
            const worktrees = await this.gitManager.listWorktrees();
            return worktrees.map(wt => new WorktreeItem(wt, this.gitManager));
        }
        return [];
    }
}
exports.WorktreeProvider = WorktreeProvider;
class WorktreeItem extends vscode.TreeItem {
    constructor(worktree, gitManager) {
        super(worktree.branch || 'detached', vscode.TreeItemCollapsibleState.None);
        this.worktree = worktree;
        this.gitManager = gitManager;
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
    getTooltip() {
        const parts = [];
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
    getDescription() {
        const config = vscode.workspace.getConfiguration('gitWorktree');
        const showBranchNames = config.get('showBranchNames', true);
        const parts = [];
        if (this.worktree.isMain) {
            parts.push('(main)');
        }
        parts.push(path.basename(this.worktree.path));
        return parts.join(' ');
    }
    getIcon() {
        if (this.worktree.isMain) {
            return new vscode.ThemeIcon('home');
        }
        return new vscode.ThemeIcon('git-branch');
    }
}
exports.WorktreeItem = WorktreeItem;
//# sourceMappingURL=worktreeProvider.js.map