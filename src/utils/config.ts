/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import fs from 'fs-extra';
import { SfProject, SfError, Lifecycle } from '@salesforce/core';
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

const resolvedConfigs: { [path: string]: Config } = {};

// eslint-disable-next-line complexity
export default async (path = SfProject.resolveProjectPathSync()): Promise<Config> => {
  if (path && resolvedConfigs[path]) {
    return resolvedConfigs[path];
  }

  let configFromFile: Config | undefined;
  try {
    configFromFile = fs.readJsonSync(join(path, '.sfdx-jayree.json')) as Config;
    await Lifecycle.getInstance().emitWarning(
      'The ".sfdx-jayree.json" config has been deprecated. Use "sfdx-project.json" instead.',
    );
  } catch (error) {
    if ((error as SfError).code === 'ENOENT') {
      configFromFile = undefined;
    } else {
      throw error;
    }
  }

  const config = {
    ...configFromFile,
  };

  resolvedConfigs[path] = config;
  return config;
};
