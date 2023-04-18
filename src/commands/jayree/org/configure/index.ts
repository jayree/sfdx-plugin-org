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
  arrayWithDeprecation,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { traverse } from '@salesforce/core/lib/util/internal.js';
import { AnyJson } from '@salesforce/ts-types';
import { ListrLogger, Listr, PRESET_TIMER } from 'listr2';
import Debug from 'debug';
import config from '../../../../utils/config.js';
import { PuppeteerConfigureTasks, Task } from '../../../../utils/puppeteer/configuretasks.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'configure');

const logger = new ListrLogger({ useIcons: false });

const debug = Debug('jayree:org:configure');

export default class ConfigureOrg extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('commandDescription');
  public static readonly description = messages.getMessage('commandDescription');

  public static readonly examples = [
    `$ sfdx jayree:org:configure
$ sfdx jayree:org:configure -u me@my.org
$ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
$ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"`,
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    tasks: arrayWithDeprecation({
      char: 't',
      summary: messages.getMessage('tasks'),
    }),
    concurrent: Flags.boolean({
      summary: messages.getMessage('concurrent'),
      default: false,
    }),
  };

  public async run(): Promise<AnyJson> {
    const { flags } = await this.parse(ConfigureOrg);

    const configPath = await traverse.forFile(process.cwd(), '.sfdx-jayree.json');

    let allTasks: Task[] = [];
    let selectedSetupTasks: Task[] = [];
    const configSetupTasks = config(configPath).setupTasks;
    if (configSetupTasks) {
      if (flags.tasks) {
        flags.tasks.forEach((task) => {
          selectedSetupTasks = selectedSetupTasks.concat(configSetupTasks.filter((t) => task === t.title));
        });
        allTasks = selectedSetupTasks;
      } else {
        selectedSetupTasks = configSetupTasks.filter((t) => t.isactive === true);
        allTasks = configSetupTasks;
      }
    }

    const setupTaskRunner = new PuppeteerConfigureTasks(
      {
        accessToken: flags['target-org'].getConnection(flags['api-version']).accessToken as string,
        instanceUrl: flags['target-org'].getConnection(flags['api-version']).instanceUrl,
      },
      selectedSetupTasks
    );

    const setupTasks = new Listr<AnyJson>([], { concurrent: flags.concurrent, exitOnError: false });

    allTasks.forEach((el) => {
      setupTasks.add({
        title: el.title,
        skip: (): boolean => !selectedSetupTasks.includes(el),
        task: async (ctx, task): Promise<void> => {
          const sTask = setupTaskRunner.getNext();
          if (!(await sTask.execute(task))) {
            task.skip();
          }
        },
        options: { persistentOutput: false, bottomBar: 5 },
      });
    });

    const mainTasks = new Listr<AnyJson>(
      [
        {
          title: 'Open Browser',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: async (): Promise<void> => {
            await setupTaskRunner.open();
          },
        },
        {
          title: 'Execute SetupTasks',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: (): Listr => setupTasks,
        },
        {
          title: 'Close Browser',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: async (): Promise<void> => {
            await setupTaskRunner.close();
          },
        },
      ],
      {
        rendererOptions: {
          timer: {
            ...PRESET_TIMER,
            condition: (duration): boolean => duration > 250,
          },
          collapseErrors: false,
          collapseSubtasks: false,
        },
        silentRendererCondition: this.jsonEnabled(),
        fallbackRendererCondition: debug.enabled,
        exitOnError: false,
      }
    );

    try {
      const context = await mainTasks.run();
      if (debug.enabled && !this.jsonEnabled()) {
        logger.toStderr(`Context: ${JSON.stringify(context, null, 2)}`);
      }

      return context;
    } catch (e) {
      if (!this.jsonEnabled()) {
        logger.toStderr((e as Error).message);
      }
      throw e;
    }
  }
}
