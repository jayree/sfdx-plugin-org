import { Task } from './puppeteer/configuretasks.js';
type Config = {
    puppeteerDocker?: {
        headless: boolean;
        args: string[];
    };
    puppeteerWSL?: {
        headless: boolean;
        executablePath: string;
    };
    puppeteer?: {
        headless: boolean;
    };
    setupTasks?: Task[];
};
export default _default;
declare function _default(path?: string): Promise<Config>;
