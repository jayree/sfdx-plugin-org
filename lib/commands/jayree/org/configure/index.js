/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, arrayWithDeprecation, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ListrLogger, Listr, PRESET_TIMER } from 'listr2';
import Debug from 'debug';
import config from '../../../../utils/config.js';
import { PuppeteerConfigureTasks, readTasksFromProject } from '../../../../utils/puppeteer/configuretasks.js';
const traverse = {
    /**
     * Searches a file path in an ascending manner (until reaching the filesystem root) for the first occurrence a
     * specific file name.  Resolves with the directory path containing the located file, or `null` if the file was
     * not found.
     *
     * @param dir The directory path in which to start the upward search.
     * @param file The file name to look for.
     */
    forFile: async (dir, file) => {
        let foundProjectDir;
        try {
            fs.statSync(join(dir, file));
            foundProjectDir = dir;
        }
        catch (err) {
            if (err && err.code === 'ENOENT') {
                const nextDir = resolve(dir, '..');
                if (nextDir !== dir) {
                    // stop at root
                    foundProjectDir = await traverse.forFile(nextDir, file);
                }
            }
        }
        return foundProjectDir;
    },
};
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'configure');
const logger = new ListrLogger({ useIcons: false });
const debug = Debug('jayree:org:configure');
export default class ConfigureOrg extends SfCommand {
    static summary = messages.getMessage('commandDescription');
    // public static readonly description = messages.getMessage('commandDescription');
    static examples = [
        `$ sfdx jayree:org:configure
$ sfdx jayree:org:configure -u me@my.org
$ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
$ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"`,
    ];
    static flags = {
        'target-org': requiredOrgFlagWithDeprecations,
        'api-version': orgApiVersionFlagWithDeprecations,
        tasks: arrayWithDeprecation({
            char: 't',
            summary: messages.getMessage('tasks'),
        }),
        concurrent: Flags.boolean({
            summary: messages.getMessage('flags.concurrent.summary'),
            default: false,
        }),
    };
    async run() {
        const { flags } = await this.parse(ConfigureOrg);
        const configPath = await traverse.forFile(process.cwd(), '.sfdx-jayree.json');
        let allTasks = [];
        let selectedSetupTasks = [];
        const configSetupTasks = (await config(configPath)).setupTasks ?? (await readTasksFromProject());
        if (configSetupTasks) {
            if (flags.tasks) {
                flags.tasks.forEach((task) => {
                    selectedSetupTasks = selectedSetupTasks.concat(configSetupTasks.filter((t) => task === t.title));
                });
                allTasks = selectedSetupTasks;
            }
            else {
                selectedSetupTasks = configSetupTasks.filter((t) => t.isactive === true || t.isActive === true);
                allTasks = configSetupTasks;
            }
        }
        await flags['target-org'].getConnection(flags['api-version']).refreshAuth();
        const setupTaskRunner = new PuppeteerConfigureTasks({
            accessToken: flags['target-org'].getConnection(flags['api-version']).accessToken,
            instanceUrl: flags['target-org'].getConnection(flags['api-version']).instanceUrl,
        }, selectedSetupTasks);
        const setupTasks = new Listr([], { concurrent: flags.concurrent, exitOnError: false });
        allTasks.forEach((el) => {
            setupTasks.add({
                title: el.title,
                skip: () => !selectedSetupTasks.includes(el),
                task: async (ctx, task) => {
                    const sTask = setupTaskRunner.getNext();
                    if (!(await sTask.execute(task))) {
                        task.skip();
                    }
                },
                rendererOptions: { persistentOutput: false, bottomBar: 5 },
            });
        });
        const mainTasks = new Listr([
            {
                title: 'Open Browser',
                skip: () => !(selectedSetupTasks.length > 0),
                task: async () => {
                    await setupTaskRunner.open();
                },
            },
            {
                title: 'Execute SetupTasks',
                skip: () => !(selectedSetupTasks.length > 0),
                task: () => setupTasks,
            },
            {
                title: 'Close Browser',
                skip: () => !(selectedSetupTasks.length > 0),
                task: async () => {
                    await setupTaskRunner.close();
                },
            },
        ], {
            rendererOptions: {
                timer: {
                    ...PRESET_TIMER,
                    condition: (duration) => duration > 250,
                },
                collapseErrors: false,
                collapseSubtasks: false,
            },
            silentRendererCondition: this.jsonEnabled(),
            fallbackRendererCondition: debug.enabled,
            exitOnError: false,
        });
        try {
            const context = await mainTasks.run();
            if (debug.enabled && !this.jsonEnabled()) {
                logger.toStderr(`Context: ${JSON.stringify(context, null, 2)}`);
            }
            return context;
        }
        catch (e) {
            if (!this.jsonEnabled()) {
                logger.toStderr(e.message);
            }
            throw e;
        }
    }
}
//# sourceMappingURL=index.js.map