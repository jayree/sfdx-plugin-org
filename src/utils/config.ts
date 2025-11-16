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
/* istanbul ignore file */
import { join } from 'node:path';
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
