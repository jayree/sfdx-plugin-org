/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { ListrLogger, Listr, PRESET_TIMER, ListrTask, ListrRendererValue } from 'listr2';
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

type Context = {
  error: string;
  result: Array<{
    '3166-2 code': string;
    'Subdivision name'?: string;
    'Local variant'?: string;
    'Language code'?: string;
    'Romanization system'?: string;
    'Parent subdivision'?: string;
    status?: string;
  }>;
  data: {
    add: Array<{
      '3166-2 code': string;
      'Subdivision name': string;
      'Local variant': string;
      'Language code': string;
      'Romanization system': string;
      'Parent subdivision': string;
    }>;
    deactivate: string[];
  };
  language: { selected: string | undefined; values: string[] | undefined };
  countryCode: {
    selected: string | undefined;
    values: Array<{
      name: string;
      value: string;
    }>;
  };
  category: {
    selected: string | undefined;
    values: string[] | undefined;
  };
};

// eslint-disable-next-line sf-plugin/command-example
export default class ImportState extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('commandStateDescription');
  // public static readonly description = messages.getMessage('commandStateDescription');

  public static readonly flags = {
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

  public async run(): Promise<AnyJson> {
    const { flags } = await this.parse(ImportState);

    await flags['target-org'].getConnection(flags['api-version']).refreshAuth();

    const taskRunner = new PuppeteerStateTasks({
      accessToken: flags['target-org'].getConnection(flags['api-version']).accessToken as string,
      instanceUrl: flags['target-org'].getConnection(flags['api-version']).instanceUrl,
    });

    const mainTasks = new Listr<Context, ListrRendererValue>(
      [
        {
          title: 'Get ISO 3166 Data',
          task: async (ctx, task): Promise<Listr> => {
            ctx.countryCode = await taskRunner.validateParameterCountryCode(flags['country-code'] as string);
            ctx.category = taskRunner.validateParameterCategory(flags.category as string);
            ctx.language = taskRunner.validateParameterLanguage(flags.language as string);
            debug(ctx);
            return task.newListr([
              {
                title: 'Country Code: ',
                enabled: (): boolean => !this.jsonEnabled() && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx: Context, task): Promise<void> => {
                  if (ctx.countryCode.selected === undefined) {
                    ctx.countryCode.selected = await task.prompt(ListrEnquirerPromptAdapter).run<string>({
                      type: 'AutoComplete',
                      message: 'Select Country',
                      choices: ctx.countryCode.values.map((v) => {
                        return { name: v.value, message: v.name };
                      }),
                    });
                    ctx.countryCode = await taskRunner.validateParameterCountryCode(ctx.countryCode.selected);
                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected as string);
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected as string);
                  }
                  debug(ctx);
                  task.title = task.title + (ctx.countryCode.selected as string);
                },
              },
              {
                title: 'Category: ',
                enabled: (): boolean => !this.jsonEnabled() && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx, task): Promise<void> => {
                  if (ctx.category.selected === undefined) {
                    ctx.category.selected = await task.prompt(ListrEnquirerPromptAdapter).run<string>({
                      type: 'AutoComplete',
                      message: 'Select Category',
                      choices: ctx.category.values as string[],
                    });
                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected);
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected as string);
                  }
                  debug(ctx);
                  task.title = task.title + (ctx.category.selected as string);
                },
              },
              {
                title: 'Language: ',
                enabled: (): boolean => !this.jsonEnabled() && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx, task): Promise<void> => {
                  if (ctx.language.selected === undefined) {
                    ctx.language.selected = await task.prompt(ListrEnquirerPromptAdapter).run<string>({
                      type: 'AutoComplete',
                      message: 'Select Language',
                      choices: ctx.language.values as string[],
                    });
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                  }
                  debug(ctx);
                  task.title = task.title + (ctx.language.selected as string);
                },
              },
            ]);
          },
        },
        {
          task: (ctx): void => {
            try {
              ctx.data = taskRunner.validateData();
              ctx.result = [];
            } catch (error) {
              ctx.error = (error as Error).message;
              throw error;
            }
          },
        },
        {
          title: 'Set Country Integration Value: ',
          enabled: (ctx): boolean => (ctx.data ? true : false),
          task: async (ctx, task): Promise<void> => {
            task.title = task.title + (ctx.countryCode.selected as string);
            if (!(await taskRunner.setCountryIntegrationValue())) {
              task.skip();
            }
          },
        },
        {
          title: 'Deactivate/Hide States',
          enabled: (ctx): boolean => (ctx.data?.deactivate ? ctx.data.deactivate.length > 0 : false),
          task: (ctx, task): Listr =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            task.newListr(
              () => {
                const deactivateTasks: ListrTask[] = [];
                ctx.data.deactivate.forEach((el) => {
                  deactivateTasks.push({
                    title: el.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    skip: (ctx: Context): boolean => !ctx.data.deactivate.includes(el),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    task: async (ctx: Context, task): Promise<void> => {
                      const sTask = taskRunner.getNextDeactivate();
                      if (!(await sTask.executeDeactivate())) {
                        task.skip();
                        ctx.result.push({ '3166-2 code': el, status: 'skipped (deactivated)' });
                      } else {
                        ctx.result.push({ '3166-2 code': el, status: 'updated (deactivated)' });
                      }
                    },
                    rendererOptions: { persistentOutput: true },
                  });
                });
                return deactivateTasks;
              },
              { concurrent: flags.concurrent, exitOnError: false },
            ),
        },
        {
          title: 'Add States',
          enabled: (ctx): boolean => (ctx.data?.add ? ctx.data.add.length > 0 : false),
          task: (ctx, task): Listr =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            task.newListr(
              () => {
                const addTasks: ListrTask[] = [];
                ctx.data.add.forEach((el) => {
                  addTasks.push({
                    title: `${el['Subdivision name']} (${el['3166-2 code']})`,
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    skip: (ctx: Context): boolean => !ctx.data.add.includes(el),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    task: async (ctx: Context, task): Promise<void> => {
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
              },
              { concurrent: flags.concurrent, exitOnError: false },
            ),
        },
      ],
      {
        renderer: MyDefaultRenderer,
        rendererOptions: {
          timer: {
            ...PRESET_TIMER,
            condition: (duration: number): boolean => duration > 250,
          },
          collapseErrors: false,
          collapseSubtasks: false,
          maxSubTasks: flags.concurrent >= 10 ? flags.concurrent : 10,
        },
        silentRendererCondition: this.jsonEnabled(),
        fallbackRendererCondition: debug.enabled,
        exitOnError: true,
      },
    );

    try {
      await taskRunner.open();
      const context = await mainTasks.run();
      if (context.error) {
        throw new Error(context.error);
      }

      context.result = context.result?.sort((a, b) =>
        a['3166-2 code'] < b['3166-2 code'] ? -1 : a['3166-2 code'] > b['3166-2 code'] ? 1 : 0,
      );

      if (debug.enabled) {
        if (!this.jsonEnabled()) {
          logger.toStderr(`Context: ${JSON.stringify(context, null, 2)}`);
        }
        return context;
      }
      return context.result;
    } catch (e) {
      if (debug.enabled) {
        if (!this.jsonEnabled()) {
          logger.toStderr((e as Error).message);
        }
      }
      throw e;
    } finally {
      await taskRunner.close();
    }
  }
}
