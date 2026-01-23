import * as vscode from 'vscode';
import { TemplateManager, WorktreeTemplate } from './templates/templateManager';
import { GitWorktreeManager } from './gitWorktreeManager';

export class QuickActions {
    constructor(
        private templateManager: TemplateManager,
        private gitManager: GitWorktreeManager
    ) { }

    /**
     * Show quick actions panel
     */
    async showQuickActionsPanel(): Promise<void> {
        const builtInTemplates = this.templateManager.getBuiltInTemplates();
        const customTemplates = await this.templateManager.getTemplates();

        const allTemplates = [...builtInTemplates, ...customTemplates];

        const items = allTemplates.map(template => ({
            label: `$(add) ${template.name}`,
            description: template.description,
            template
        }));

        items.push({
            label: '$(gear) Manage Templates',
            description: 'Create, edit, or delete templates',
            template: null as any
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a quick action'
        });

        if (!selected) return;

        if (!selected.template) {
            // Manage templates
            await this.manageTemplates();
        } else {
            // Apply template
            await this.applyTemplate(selected.template);
        }
    }

    /**
     * Apply a template to create a worktree
     */
    async applyTemplate(template: WorktreeTemplate): Promise<void> {
        const branchName = await vscode.window.showInputBox({
            prompt: `Enter branch name for ${template.name}`,
            placeHolder: 'my-feature'
        });

        if (!branchName) return;

        const { location, branch } = this.templateManager.applyTemplate(template, branchName);

        try {
            // Create worktree
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating ${template.name} worktree...`,
                    cancellable: false
                },
                async progress => {
                    progress.report({ message: 'Creating worktree...' });
                    await this.gitManager.addWorktree(location, branch, true);

                    if (template.autoInstallDeps) {
                        progress.report({ message: 'Installing dependencies...' });
                        // Hook will handle this
                    }
                }
            );

            vscode.window.showInformationMessage(`Worktree created: ${branch}`);

            if (template.openInNewWindow) {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), true);
            } else {
                const action = await vscode.window.showInformationMessage(
                    'Worktree created. Open it?',
                    'Open',
                    'Cancel'
                );
                if (action === 'Open') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(location), false);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
        }
    }

    /**
     * Manage templates (CRUD)
     */
    async manageTemplates(): Promise<void> {
        const actions = [
            { label: '$(add) Create New Template', action: 'create' },
            { label: '$(edit) Edit Template', action: 'edit' },
            { label: '$(trash) Delete Template', action: 'delete' }
        ];

        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: 'Select an action'
        });

        if (!selected) return;

        switch (selected.action) {
            case 'create':
                await this.createTemplate();
                break;
            case 'edit':
                await this.editTemplate();
                break;
            case 'delete':
                await this.deleteTemplate();
                break;
        }
    }

    private async createTemplate(): Promise<void> {
        const name = await vscode.window.showInputBox({
            prompt: 'Template name',
            placeHolder: 'My Custom Template'
        });
        if (!name) return;

        const locationPattern = await vscode.window.showInputBox({
            prompt: 'Location pattern (use {branchName} as placeholder)',
            value: '../{branchName}'
        });
        if (!locationPattern) return;

        const branchPrefix = await vscode.window.showInputBox({
            prompt: 'Branch prefix (optional)',
            placeHolder: 'feature/'
        });

        const template: WorktreeTemplate = {
            id: Date.now().toString(),
            name,
            locationPattern,
            branchPrefix: branchPrefix || undefined,
            autoInstallDeps: false,
            openInNewWindow: true
        };

        await this.templateManager.saveTemplate(template);
        vscode.window.showInformationMessage(`Template "${name}" created`);
    }

    private async editTemplate(): Promise<void> {
        const templates = await this.templateManager.getTemplates();
        if (templates.length === 0) {
            vscode.window.showInformationMessage('No custom templates found');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            templates.map(t => ({ label: t.name, template: t })),
            { placeHolder: 'Select template to edit' }
        );

        if (!selected) return;

        // Simple edit: just the location pattern for now
        const newLocation = await vscode.window.showInputBox({
            prompt: 'Update location pattern',
            value: selected.template.locationPattern
        });

        if (newLocation) {
            selected.template.locationPattern = newLocation;
            await this.templateManager.saveTemplate(selected.template);
            vscode.window.showInformationMessage('Template updated');
        }
    }

    private async deleteTemplate(): Promise<void> {
        const templates = await this.templateManager.getTemplates();
        if (templates.length === 0) {
            vscode.window.showInformationMessage('No custom templates found');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            templates.map(t => ({ label: t.name, template: t })),
            { placeHolder: 'Select template to delete' }
        );

        if (!selected) return;

        const confirm = await vscode.window.showWarningMessage(
            `Delete template "${selected.template.name}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm === 'Delete') {
            await this.templateManager.deleteTemplate(selected.template.id);
            vscode.window.showInformationMessage('Template deleted');
        }
    }
}
