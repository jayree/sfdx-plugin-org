/*
 * Copyright 2025, jayree
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
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ListrLogger, Listr, PRESET_TIMER } from 'listr2';
import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer';
import Debug from 'debug';
import { MyDefaultRenderer } from '../../../../utils/renderer.js';
import { PuppeteerStateTasks } from '../../../../utils/puppeteer/statetasks.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'createstatecountry');
const logger = new ListrLogger({ useIcons: false });
const debug = Debug('jayree:x:y');
// eslint-disable-next-line sf-plugin/command-example
export default class ImportState extends SfCommand {
    static summary = messages.getMessage('commandStateDescription');
    // public static readonly description = messages.getMessage('commandStateDescription');
    static flags = {
        'target-org': requiredOrgFlagWithDeprecations,
        'api-version': orgApiVersionFlagWithDeprecations,
        'country-code': Flags.string({
            summary: messages.getMessage('flags.country-code.summary'),
            deprecateAliases: true,
            aliases: ['countrycode'],
        }),
        category: Flags.string({
            summary: messages.getMessage('flags.category.summary'),
        }),
        language: Flags.string({
            summary: messages.getMessage('flags.language.summary'),
        }),
        concurrent: Flags.integer({
            summary: messages.getMessage('flags.concurrent.summary'),
            default: 1,
        }),
    };
    async run() {
        const { flags } = await this.parse(ImportState);
        await flags['target-org'].getConnection(flags['api-version']).refreshAuth();
        const taskRunner = new PuppeteerStateTasks({
            accessToken: flags['target-org'].getConnection(flags['api-version']).accessToken,
            instanceUrl: flags['target-org'].getConnection(flags['api-version']).instanceUrl,
        });
        const mainTasks = new Listr([
            {
                title: 'Get ISO 3166 Data',
                task: async (ctx, task) => {
                    ctx.countryCode = await taskRunner.validateParameterCountryCode(flags['country-code']);
                    ctx.category = taskRunner.validateParameterCategory(flags.category);
                    ctx.language = taskRunner.validateParameterLanguage(flags.language);
                    debug(ctx);
                    return task.newListr([
                        {
                            title: 'Country Code: ',
                            enabled: () => !this.jsonEnabled() && process.stdout.isTTY,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.countryCode.selected === undefined) {
                                    ctx.countryCode.selected = await task.prompt(ListrEnquirerPromptAdapter).run({
                                        type: 'AutoComplete',
                                        message: 'Select Country',
                                        choices: ctx.countryCode.values.map((v) => {
                                            return { name: v.value, message: v.name };
                                        }),
                                    });
                                    ctx.countryCode = await taskRunner.validateParameterCountryCode(ctx.countryCode.selected);
                                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected);
                                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                                }
                                debug(ctx);
                                task.title = task.title + ctx.countryCode.selected;
                            },
                        },
                        {
                            title: 'Category: ',
                            enabled: () => !this.jsonEnabled() && process.stdout.isTTY,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.category.selected === undefined) {
                                    ctx.category.selected = await task.prompt(ListrEnquirerPromptAdapter).run({
                                        type: 'AutoComplete',
                                        message: 'Select Category',
                                        choices: ctx.category.values,
                                    });
                                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected);
                                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                                }
                                debug(ctx);
                                task.title = task.title + ctx.category.selected;
                            },
                        },
                        {
                            title: 'Language: ',
                            enabled: () => !this.jsonEnabled() && process.stdout.isTTY,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.language.selected === undefined) {
                                    ctx.language.selected = await task.prompt(ListrEnquirerPromptAdapter).run({
                                        type: 'AutoComplete',
                                        message: 'Select Language',
                                        choices: ctx.language.values,
                                    });
                                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                                }
                                debug(ctx);
                                task.title = task.title + ctx.language.selected;
                            },
                        },
                    ]);
                },
            },
            {
                task: (ctx) => {
                    try {
                        ctx.data = taskRunner.validateData();
                        ctx.result = [];
                    }
                    catch (error) {
                        ctx.error = error.message;
                        throw error;
                    }
                },
            },
            {
                title: 'Set Country Integration Value: ',
                enabled: (ctx) => (ctx.data ? true : false),
                task: async (ctx, task) => {
                    task.title = task.title + ctx.countryCode.selected;
                    if (!(await taskRunner.setCountryIntegrationValue())) {
                        task.skip();
                    }
                },
            },
            {
                title: 'Deactivate/Hide States',
                enabled: (ctx) => (ctx.data?.deactivate ? ctx.data.deactivate.length > 0 : false),
                task: (ctx, task) => 
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                task.newListr(() => {
                    const deactivateTasks = [];
                    ctx.data.deactivate.forEach((el) => {
                        deactivateTasks.push({
                            title: el.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            skip: (ctx) => !ctx.data.deactivate.includes(el),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                const sTask = taskRunner.getNextDeactivate();
                                if (!(await sTask.executeDeactivate())) {
                                    task.skip();
                                    ctx.result.push({ '3166-2 code': el, status: 'skipped (deactivated)' });
                                }
                                else {
                                    ctx.result.push({ '3166-2 code': el, status: 'updated (deactivated)' });
                                }
                            },
                            rendererOptions: { persistentOutput: true },
                        });
                    });
                    return deactivateTasks;
                }, { concurrent: flags.concurrent, exitOnError: false }),
            },
            {
                title: 'Add States',
                enabled: (ctx) => (ctx.data?.add ? ctx.data.add.length > 0 : false),
                task: (ctx, task) => 
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                task.newListr(() => {
                    const addTasks = [];
                    ctx.data.add.forEach((el) => {
                        addTasks.push({
                            title: `${el['Subdivision name']} (${el['3166-2 code']})`,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            skip: (ctx) => !ctx.data.add.includes(el),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                const sTask = taskRunner.getNextAdd();
                                const result = await sTask.executeAdd();
                                ctx.result.push({ ...el, status: result });
                                if (result === 'skipped') {
                                    task.skip();
                                }
                            },
                            rendererOptions: { persistentOutput: true },
                        });
                    });
                    return addTasks;
                }, { concurrent: flags.concurrent, exitOnError: false }),
            },
        ], {
            renderer: MyDefaultRenderer,
            rendererOptions: {
                timer: {
                    ...PRESET_TIMER,
                    condition: (duration) => duration > 250,
                },
                collapseErrors: false,
                collapseSubtasks: false,
                maxSubTasks: flags.concurrent >= 10 ? flags.concurrent : 10,
            },
            silentRendererCondition: this.jsonEnabled(),
            fallbackRendererCondition: debug.enabled,
            exitOnError: true,
        });
        try {
            await taskRunner.open();
            const context = await mainTasks.run();
            if (context.error) {
                throw new Error(context.error);
            }
            context.result = context.result?.sort((a, b) => a['3166-2 code'] < b['3166-2 code'] ? -1 : a['3166-2 code'] > b['3166-2 code'] ? 1 : 0);
            if (debug.enabled) {
                if (!this.jsonEnabled()) {
                    logger.toStderr(`Context: ${JSON.stringify(context, null, 2)}`);
                }
                return context;
            }
            return context.result;
        }
        catch (e) {
            if (debug.enabled) {
                if (!this.jsonEnabled()) {
                    logger.toStderr(e.message);
                }
            }
            throw e;
        }
        finally {
            await taskRunner.close();
        }
    }
}
//# sourceMappingURL=state.js.map