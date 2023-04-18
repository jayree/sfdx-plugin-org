import type { ListrDefaultRendererOptions, ListrDefaultRendererTask, ListrDefaultRendererTaskOptions } from 'listr2';
import type { ListrRenderer } from 'listr2';
import type { ListrEventManager } from 'listr2';
interface MyListrDefaultRendererOptions extends ListrDefaultRendererOptions {
    maxSubTasks?: number;
    hideAfterSeconds?: number;
}
export declare class MyDefaultRenderer implements ListrRenderer {
    private readonly tasks;
    private readonly options;
    private readonly events;
    static nonTTY: boolean;
    static rendererOptions: MyListrDefaultRendererOptions;
    static rendererTaskOptions: ListrDefaultRendererTaskOptions;
    private bottom;
    private prompt;
    private activePrompt;
    private readonly spinner;
    private readonly logger;
    private updater;
    private truncate;
    private wrap;
    private readonly cache;
    private taskTime;
    private currentTasks;
    private hiddenTasks;
    constructor(tasks: ListrDefaultRendererTask[], options: MyListrDefaultRendererOptions, events: ListrEventManager);
    isBottomBar(task: ListrDefaultRendererTask): boolean;
    render(): Promise<void>;
    update(): void;
    end(): void;
    create(options?: {
        tasks?: boolean;
        bottomBar?: boolean;
        prompt?: boolean;
    }): string;
    protected style(task: ListrDefaultRendererTask, output?: boolean): string;
    protected format(message: string, icon: string, level: number): string[];
    private renderer;
    private renderBottomBar;
    private renderPrompt;
    private calculate;
    private reset;
    private dump;
    private indent;
}
export {};
