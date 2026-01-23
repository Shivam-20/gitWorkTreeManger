import * as vscode from 'vscode';

export interface WorktreeTemplate {
    id: string;
    name: string;
    description?: string;
    locationPattern: string; // e.g., "../features/{branchName}"
    branchPrefix?: string; // e.g., "feature/"
    autoInstallDeps?: boolean;
    openInNewWindow?: boolean;
    runHooks?: string[]; // Hook commands to run after creation
}

export class TemplateManager {
    private static readonly STORAGE_KEY = 'worktreeTemplates';

    constructor(private context: vscode.ExtensionContext) { }

    async getTemplates(): Promise<WorktreeTemplate[]> {
        return this.context.workspaceState.get<WorktreeTemplate[]>(TemplateManager.STORAGE_KEY, []);
    }

    async saveTemplate(template: WorktreeTemplate): Promise<void> {
        const templates = await this.getTemplates();
        const existingIndex = templates.findIndex(t => t.id === template.id);

        if (existingIndex >= 0) {
            templates[existingIndex] = template;
        } else {
            templates.push(template);
        }

        await this.context.workspaceState.update(TemplateManager.STORAGE_KEY, templates);
    }

    async deleteTemplate(id: string): Promise<void> {
        const templates = await this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        await this.context.workspaceState.update(TemplateManager.STORAGE_KEY, filtered);
    }

    async getTemplate(id: string): Promise<WorktreeTemplate | undefined> {
        const templates = await this.getTemplates();
        return templates.find(t => t.id === id);
    }

    /**
     * Apply a template to generate worktree creation parameters
     */
    applyTemplate(template: WorktreeTemplate, branchName: string): {
        location: string;
        branch: string;
    } {
        const sanitizedBranchName = branchName.replace(/[\/\\]/g, '-');
        const location = template.locationPattern.replace('{branchName}', sanitizedBranchName);
        const branch = template.branchPrefix ? `${template.branchPrefix}${branchName}` : branchName;

        return { location, branch };
    }

    /**
     * Get predefined templates (built-in)
     */
    getBuiltInTemplates(): WorktreeTemplate[] {
        return [
            {
                id: 'hotfix',
                name: 'Hotfix Branch',
                description: 'Create a hotfix worktree from main',
                locationPattern: '../hotfix/{branchName}',
                branchPrefix: 'hotfix/',
                autoInstallDeps: true,
                openInNewWindow: false
            },
            {
                id: 'feature',
                name: 'Feature Branch',
                description: 'Create a feature worktree',
                locationPattern: '../features/{branchName}',
                branchPrefix: 'feature/',
                autoInstallDeps: true,
                openInNewWindow: true
            },
            {
                id: 'review',
                name: 'PR Review',
                description: 'Temporary worktree for code review',
                locationPattern: '../review/{branchName}',
                branchPrefix: '',
                autoInstallDeps: false,
                openInNewWindow: true
            },
            {
                id: 'prototype',
                name: 'Prototype/Experiment',
                description: 'Experimental worktree',
                locationPattern: '../prototype/{branchName}',
                branchPrefix: 'prototype/',
                autoInstallDeps: false,
                openInNewWindow: true
            }
        ];
    }
}
