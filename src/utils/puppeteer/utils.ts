/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import isDocker from 'is-docker';
import isWsl from 'is-wsl';
import { SfProject } from '@salesforce/core';
import type playwright from 'playwright-chromium';
import config from '../config.js';

const LaunchOptionsDefaults: {
  playwright: playwright.LaunchOptions;
  docker: playwright.LaunchOptions;
  wsl: playwright.LaunchOptions;
} = {
  playwright: {
    headless: true,
  },
  docker: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process'],
  },
  wsl: {
    executablePath: '/bin/google-chrome',
  },
};

export async function readLaunchOptionsFromProject(): Promise<playwright.LaunchOptions> {
  const proj = await SfProject.resolve();
  const projJson = (await proj.resolveProjectConfig()) as {
    plugins?: {
      'jayree/sfdx-plugin-org'?: {
        setup?: {
          playwright?: playwright.LaunchOptions & {
            docker?: playwright.LaunchOptions;
            wsl?: playwright.LaunchOptions;
          };
        };
      };
    };
  };

  const cfg = await config();

  let LaunchOptions;

  if (isDocker()) {
    LaunchOptions = {
      ...LaunchOptionsDefaults.playwright,
      ...LaunchOptionsDefaults.docker,
      ...cfg.puppeteerDocker,
      ...projJson.plugins?.['jayree/sfdx-plugin-org']?.setup?.playwright?.docker,
    };
  } else if (isWsl) {
    LaunchOptions = {
      ...LaunchOptionsDefaults.playwright,
      ...LaunchOptionsDefaults.wsl,
      ...cfg.puppeteerWSL,
      ...projJson.plugins?.['jayree/sfdx-plugin-org']?.setup?.playwright?.wsl,
    };
  } else {
    LaunchOptions = {
      ...LaunchOptionsDefaults.playwright,
      ...cfg.puppeteer,
      ...projJson.plugins?.['jayree/sfdx-plugin-org']?.setup?.playwright,
    };
  }
  return LaunchOptions;
}
