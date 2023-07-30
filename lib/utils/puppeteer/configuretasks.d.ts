type TaskEvaluate = Array<{
    action: string;
    value: string;
    waitFor: string | {
        querySelector: string;
        property: string;
        value: string;
    };
    querySelector: string;
    querySelectorAll: string;
    type: {
        checkbox: {
            checked: boolean;
        };
        list: {
            selection: string;
        };
    };
}>;
export type Task = {
    title?: string;
    isactive?: boolean;
    isActive?: boolean;
    url?: string;
    iframe?: number;
    evaluate: TaskEvaluate;
    tasks?: Array<{
        title?: string;
        evaluate: TaskEvaluate;
    }>;
};
export declare function readTasksFromProject(): Promise<Task[]>;
export declare class PuppeteerConfigureTasks {
    currenTask: Task;
    private tasks;
    private nextTaskIndex;
    private browser;
    private context;
    private auth;
    constructor(auth: {
        instanceUrl: string;
        accessToken: string;
    }, tasks: Task[]);
    private static subExec;
    getNext(): this;
    close(): Promise<void>;
    open(): Promise<void>;
    execute(listrTask: {
        output: string;
    }): Promise<boolean>;
}
export {};
