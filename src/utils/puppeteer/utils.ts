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
