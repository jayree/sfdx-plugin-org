import { Task } from './puppeteer/configuretasks.js';
type Config = {
    puppeteerDocker: {
        headless: boolean;
        args: string[];
    };
    puppeteerWSL: {
        headless: boolean;
        executablePath: string;
    };
    puppeteer: {
        headless: boolean;
    };
    setupTasks?: Task[];
};
declare const _default: (path?: string) => Config;
export default _default;
