/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import fs from 'fs-extra';
import isDocker from 'is-docker';
import isWsl from 'is-wsl';
import { SfProject, SfError } from '@salesforce/core';
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

const CONFIG_DEFAULTS = {
  puppeteerDocker: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process'],
  },
  puppeteerWSL: {
    headless: true,
    executablePath: '/bin/google-chrome',
  },
  puppeteer: {
    headless: true,
  },
};

const resolvedConfigs: { [path: string]: Config } = {};

// eslint-disable-next-line complexity
export default (path = SfProject.resolveProjectPathSync()): Config => {
  if (path && resolvedConfigs[path]) {
    return resolvedConfigs[path];
  }

  const defaults = CONFIG_DEFAULTS;
  let configFromFile: Config | undefined;
  try {
    configFromFile = fs.readJsonSync(join(path, '.sfdx-jayree.json')) as Config;
  } catch (error) {
    if ((error as SfError).code === 'ENOENT') {
      configFromFile = undefined;
    } else {
      throw error;
    }
  }

  if (configFromFile?.puppeteer && isDocker()) {
    configFromFile.puppeteer = { ...defaults.puppeteerDocker, ...configFromFile.puppeteer };
  }

  if (configFromFile?.puppeteer && isWsl) {
    configFromFile.puppeteer = { ...defaults.puppeteerWSL, ...configFromFile.puppeteer };
  }

  const config = {
    ...configFromFile,
    puppeteerDocker: configFromFile?.puppeteerDocker ?? defaults.puppeteerDocker,
    puppeteerWSL: configFromFile?.puppeteerWSL ?? defaults.puppeteerWSL,
    puppeteer:
      configFromFile?.puppeteer ??
      ((isWsl && defaults.puppeteerWSL) || (isDocker() && defaults.puppeteerDocker) || defaults.puppeteer),
  };

  resolvedConfigs[path] = config;
  return config;
};
