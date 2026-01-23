import * as vscode from 'vscode';
import { GitWorktreeManager, Worktree } from '../gitWorktreeManager';

export interface TimelineEvent {
    type: 'created' | 'deleted' | 'switched';
    worktree: {
        path: string;
        branch: string;
    };
    timestamp: number;
}

export class TimelineProvider implements vscode.TreeDataProvider<TimelineItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TimelineItem | undefined | null | void> =
        new vscode.EventEmitter<TimelineItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TimelineItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private static readonly STORAGE_KEY = 'worktreeTimeline';
    private events: TimelineEvent[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private gitManager: GitWorktreeManager
    ) {
        this.loadEvents();
    }

    private loadEvents(): void {
        this.events = this.context.workspaceState.get<TimelineEvent[]>(TimelineProvider.STORAGE_KEY, []);
    }

    private async saveEvents(): Promise<void> {
        await this.context.workspaceState.update(TimelineProvider.STORAGE_KEY, this.events);
    }

    async recordEvent(event: TimelineEvent): Promise<void> {
        this.events.unshift(event); // Add to beginning
        // Keep only last 100 events
        if (this.events.length > 100) {
            this.events = this.events.slice(0, 100);
        }
        await this.saveEvents();
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TimelineItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TimelineItem): Promise<TimelineItem[]> {
        if (!element) {
            // Group by time periods
            const now = Date.now();
            const today: TimelineEvent[] = [];
            const thisWeek: TimelineEvent[] = [];
            const thisMonth: TimelineEvent[] = [];
            const older: TimelineEvent[] = [];

            for (const event of this.events) {
                const age = now - event.timestamp;
                const dayInMs = 24 * 60 * 60 * 1000;

                if (age < dayInMs) {
                    today.push(event);
                } else if (age < 7 * dayInMs) {
                    thisWeek.push(event);
                } else if (age < 30 * dayInMs) {
                    thisMonth.push(event);
                } else {
                    older.push(event);
                }
            }

            const sections: TimelineItem[] = [];
            if (today.length > 0) {
                sections.push(new TimelineItem('Today', today, 'section'));
            }
            if (thisWeek.length > 0) {
                sections.push(new TimelineItem('This Week', thisWeek, 'section'));
            }
            if (thisMonth.length > 0) {
                sections.push(new TimelineItem('This Month', thisMonth, 'section'));
            }
            if (older.length > 0) {
                sections.push(new TimelineItem('Older', older, 'section'));
            }

            return sections;
        }

        if (element.type === 'section') {
            return element.events.map(event => new TimelineItem('', [event], 'event'));
        }

        return [];
    }
}

class TimelineItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly events: TimelineEvent[],
        public readonly type: 'section' | 'event'
    ) {
        super(
            type === 'section' ? `${label} (${events.length})` : '',
            type === 'section' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
        );

        if (type === 'event' && events[0]) {
            const event = events[0];
            const date = new Date(event.timestamp);
            const icon = event.type === 'created' ? 'add' : event.type === 'deleted' ? 'trash' : 'arrow-right';

            this.label = `${event.type === 'created' ? 'Created' : event.type === 'deleted' ? 'Deleted' : 'Switched to'} ${event.worktree.branch}`;
            this.description = date.toLocaleString();
            this.iconPath = new vscode.ThemeIcon(icon);
            this.tooltip = `${event.worktree.path}\n${date.toLocaleString()}`;
        }

        this.contextValue = type;
    }
}
