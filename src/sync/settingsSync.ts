import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SettingsSync {
    private static readonly SETTINGS_FILES = [
        '.vscode/settings.json',
        '.vscode/launch.json',
        '.vscode/tasks.json'
    ];

    constructor() { }

    /**
     * Sync settings from source worktree to all other worktrees
     */
    async syncSettings(
        sourceWorktreePath: string,
        targetWorktreePaths: string[],
        progress?: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<{ synced: number; failed: number }> {
        let synced = 0;
        let failed = 0;

        for (const settingsFile of SettingsSync.SETTINGS_FILES) {
            const sourcePath = path.join(sourceWorktreePath, settingsFile);

            if (!fs.existsSync(sourcePath)) {
                continue; // Skip if source file doesn't exist
            }

            const content = fs.readFileSync(sourcePath, 'utf8');

            for (const targetPath of targetWorktreePaths) {
                try {
                    const targetFilePath = path.join(targetPath, settingsFile);
                    const targetDir = path.dirname(targetFilePath);

                    // Create .vscode directory if it doesn't exist
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }

                    fs.writeFileSync(targetFilePath, content);
                    synced++;

                    if (progress) {
                        progress.report({
                            message: `Synced ${path.basename(settingsFile)} to ${path.basename(targetPath)}`
                        });
                    }
                } catch (error) {
                    console.error(`Failed to sync ${settingsFile} to ${targetPath}:`, error);
                    failed++;
                }
            }
        }

        return { synced, failed };
    }

    /**
     * Watch for settings changes and auto-sync
     */
    watchSettings(
        workspacePath: string,
        onSettingsChanged: (filePath: string) => void
    ): vscode.FileSystemWatcher[] {
        const watchers: vscode.FileSystemWatcher[] = [];

        for (const settingsFile of SettingsSync.SETTINGS_FILES) {
            const pattern = new vscode.RelativePattern(workspacePath, settingsFile);
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);

            watcher.onDidChange(uri => onSettingsChanged(uri.fsPath));
            watcher.onDidCreate(uri => onSettingsChanged(uri.fsPath));

            watchers.push(watcher);
        }

        return watchers;
    }

    /**
     * Compare settings between worktrees
     */
    async compareSettings(worktreePath1: string, worktreePath2: string): Promise<{
        file: string;
        different: boolean;
    }[]> {
        const results: { file: string; different: boolean }[] = [];

        for (const settingsFile of SettingsSync.SETTINGS_FILES) {
            const path1 = path.join(worktreePath1, settingsFile);
            const path2 = path.join(worktreePath2, settingsFile);

            const exists1 = fs.existsSync(path1);
            const exists2 = fs.existsSync(path2);

            if (!exists1 && !exists2) {
                continue;
            }

            if (exists1 !== exists2) {
                results.push({ file: settingsFile, different: true });
                continue;
            }

            const content1 = fs.readFileSync(path1, 'utf8');
            const content2 = fs.readFileSync(path2, 'utf8');

            results.push({
                file: settingsFile,
                different: content1 !== content2
            });
        }

        return results;
    }
}
