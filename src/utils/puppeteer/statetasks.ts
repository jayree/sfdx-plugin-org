/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import playwright from 'playwright-chromium';
import { tabletojson } from 'tabletojson';
import Debug from 'debug';
import { configSelectors, deactivateStates } from './countrystateconfig.js';
import { readLaunchOptionsFromProject } from './utils.js';

const debug = Debug('jayree:x:y');

type Country = {
  '3166-2 code': string;
  'Subdivision name': string;
  'Local variant': string;
  'Language code': string;
  'Romanization system': string;
  'Parent subdivision': string;
};

type CountryCode = Country[];

export class PuppeteerStateTasks {
  public currentAddTask!: Country;
  public currentDeactivateTask!: string;
  private addTasks!: CountryCode;
  private deactivateTasks!: string[];
  private nextAddTaskIndex = -1;
  private nextDeactivateTaskIndex = -1;
  private browser!: playwright.Browser;
  private context!: playwright.BrowserContext;
  private auth: { instanceUrl: string; accessToken: string };
  private countrycode!: string | undefined;
  private countries!: Array<{ name: string; value: string }>;
  private language!: string | undefined;
  private category!: string | undefined;
  private ISOData!: {
    [category: string]: CountryCode;
  };

  public constructor(auth: { instanceUrl: string; accessToken: string }) {
    this.auth = auth;
  }

  private static async setHTMLInputElementValue(
    page: playwright.Page,
    element: string,
    newvalue: string,
  ): Promise<'disabled' | 'changed' | 'unchanged'> {
    element = element.replace(/:/g, '\\:');
    const elementCurrentValue = await page.evaluate((s) => {
      const result = document.querySelector<HTMLInputElement>(s);
      if (result != null) {
        return result.value;
      } else {
        return '';
      }
    }, element);
    if (!(elementCurrentValue === newvalue)) {
      const elementDisabled = await page.evaluate((s) => {
        const result = document.querySelector<HTMLInputElement>(s);
        if (result != null) {
          return result.disabled;
        } else {
          return true;
        }
      }, element);
      if (!elementDisabled) {
        await page.fill(element, newvalue);
        return 'changed';
      } else {
        return 'disabled';
      }
    } else {
      return 'unchanged';
    }
  }

  private static async setHTMLInputElementChecked(
    page: playwright.Page,
    element: string,
    newstate: boolean,
    waitForEnable: boolean,
  ): Promise<'disabled' | 'changed' | 'unchanged'> {
    element = element.replace(/:/g, '\\:');
    const elementCheckedState = await page.evaluate(
      (s) => document.querySelector<HTMLInputElement>(s)?.checked,
      element,
    );
    if (!elementCheckedState === newstate) {
      if (waitForEnable) {
        await page.waitForFunction(
          (s) => {
            const val = document.querySelector<HTMLInputElement>(s)?.disabled;
            return (val as boolean) === false;
          },
          element,
          {
            timeout: 0,
          },
        );
      }
      const elementDisabledState = await page.evaluate(
        (s) => document.querySelector<HTMLInputElement>(s)?.disabled,
        element,
      );
      if (!elementDisabledState) {
        await page.click(element);
        return 'changed';
      } else {
        return 'disabled';
      }
    } else {
      return 'unchanged';
    }
  }

  public async validateParameterCountryCode(
    countrycode: string,
  ): Promise<{ selected: string | undefined; values: Array<{ name: string; value: string }> }> {
    const page = await this.context.newPage();

    try {
      if (!this.countries) {
        await page.goto('https://www.iso.org/obp/ui/#search/code', {
          waitUntil: 'networkidle',
        });

        await page.waitForSelector('.v-grid-tablewrapper');
        await page.selectOption('.v-select-select', '8');
        await page.waitForFunction(() => document.querySelector('.paging-align-fix')?.innerHTML === '');

        let converted = [];
        do {
          // eslint-disable-next-line no-await-in-loop
          const table = await page.evaluate(() => document.querySelector('.v-grid-tablewrapper')?.outerHTML);
          converted = tabletojson.convert(table as string)[0] as Array<{
            'English short name': string;
            'French short name': string;
            'Alpha-2 code': string;
            'Alpha-3 code': string;
            Numeric: string;
          }>;
        } while (converted.length !== converted.map((x) => x['Alpha-2 code']).filter(Boolean).length);
        this.countries = converted
          .map((x) => ({ name: `${x['English short name']} (${x['Alpha-2 code']})`, value: x['Alpha-2 code'] }))
          .filter(Boolean)
          .sort((a, b) => {
            const x = a.value;
            const y = b.value;
            return x < y ? -1 : x > y ? 1 : 0;
          });
      }

      if (this.countries.map((x) => x.value).includes(countrycode)) {
        await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${countrycode}`, {
          waitUntil: 'networkidle',
        });
        await page.waitForSelector('.tablesorter', { state: 'visible' });
        this.countrycode = countrycode.toUpperCase();
        const table = await page.evaluate(() => document.querySelector('table#subdivision')?.outerHTML);

        // eslint-disable-next-line @typescript-eslint/no-shadow
        const converted = tabletojson.convert(table as string)[0] as Array<{
          'Subdivision category'?: string;
          '3166-2 code': string;
          'Subdivision name': string;
          'Local variant': string;
          'Language code': string;
          'Romanization system': string;
          'Parent subdivision': string;
        }>;
        const jsonParsed: {
          [key: string]: Array<{
            'Subdivision category'?: string | undefined;
            '3166-2 code': string;
            'Subdivision name': string;
            'Local variant': string;
            'Language code': string;
            'Romanization system': string;
            'Parent subdivision': string;
          }>;
        } = {};
        if (typeof converted !== 'undefined') {
          converted.forEach((value) => {
            const keyval = value['Subdivision category'] as string;
            delete value['Subdivision category'];
            if (jsonParsed[keyval] === undefined) {
              jsonParsed[keyval] = [];
            }
            jsonParsed[keyval].push(value);
          });
        }

        this.ISOData = jsonParsed;
      } else {
        this.countrycode = undefined;
      }
    } catch (error) {
      debug(error);
    }
    await page.close();

    return { selected: this.countrycode, values: this.countries };
  }

  public validateParameterCategory(category: string): { selected: string | undefined; values: string[] | undefined } {
    let categories;
    if (this.ISOData) {
      categories = Object.keys(this.ISOData);
    }
    if (categories?.includes(category)) {
      this.category = category;
    } else if (categories) {
      if (categories.length === 1) {
        this.category = categories[0];
      }
    } else {
      this.category = undefined;
    }
    return { selected: this.category, values: categories };
  }

  public validateParameterLanguage(language: string): { selected: string | undefined; values: string[] | undefined } {
    let languagecodes;
    if (this.category && this.ISOData) {
      languagecodes = this.ISOData[this.category]
        .map((v) => v['Language code'])
        .filter((v, i, s) => s.indexOf(v) === i);
    }
    if (languagecodes?.includes(language)) {
      this.language = language;
    } else if (languagecodes) {
      if (languagecodes.length === 1) {
        this.language = languagecodes[0];
      }
    } else {
      this.language = undefined;
    }
    return { selected: this.language, values: languagecodes };
  }

  public validateData(): { add: CountryCode; deactivate: string[] } {
    if (this.countrycode === undefined) {
      // throw Error('The country code element was not found');
      throw Error('Expected --countrycode= to be one of: ' + this.countries.map((x) => x.value).toString());
    }

    if (this.category === undefined) {
      throw Error('Expected --category= to be one of: ' + Object.keys(this.ISOData).toString());
    }

    if (this.language === undefined) {
      const languagecodes = this.ISOData[this.category]
        .map((v) => v['Language code'])
        .filter((v, i, s) => s.indexOf(v) === i);
      throw Error('Expected --language to be one of: ' + languagecodes.toString());
    }

    this.addTasks = this.ISOData[this.category].filter((v) => v['Language code'] === this.language);

    this.deactivateTasks = deactivateStates[this.countrycode]?.[this.category]
      ? deactivateStates[this.countrycode][this.category]
      : [];

    return { add: this.addTasks, deactivate: this.deactivateTasks };
  }

  public async setCountryIntegrationValue(): Promise<boolean> {
    const page = await this.context.newPage();

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureCountry.apexp?countryIso=${this.countrycode as string}&setupid=AddressCleanerOverview`,
      {
        waitUntil: 'networkidle',
      },
    );

    const setCountrySelector = configSelectors.setCountry;
    const editIntValResult = await PuppeteerStateTasks.setHTMLInputElementValue(
      page,
      setCountrySelector.editIntVal,
      this.countrycode as string,
    );
    debug({ editIntValResult });
    await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });
    return editIntValResult === 'changed' ? true : false;
  }

  public async executeAdd(): Promise<string> {
    const task = this.currentAddTask;

    const page = await this.context.newPage();

    const countrycode = task['3166-2 code'].split('-')[0];
    const stateintVal = task['3166-2 code'].split('*')[0];
    const stateIsoCode = task['3166-2 code'].split('-')[1].split('*')[0];
    const stateName =
      task['Local variant'] !== '' ? task['Local variant'] : task['Subdivision name'].split('(')[0].trim();

    // if (Object.keys(CSconfig.fix).includes(countrycode)) {
    //   if (Object.keys(CSconfig.fix[countrycode]).includes(stateIsoCode)) {
    //     // this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${CSconfig.fix[countrycode][stateIsoCode]}`);
    //     stateIsoCode = CSconfig.fix[countrycode][stateIsoCode];
    //   }
    // }

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
      {
        waitUntil: 'networkidle',
      },
    );
    let update = true;

    if (await page.$('#errorTitle')) {
      update = false;
    }

    if (update === false) {
      await page.goto(
        this.auth.instanceUrl +
          `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`,
        {
          waitUntil: 'networkidle',
        },
      );
      await page.waitForSelector('.mainTitle');
    }

    const selector = update ? configSelectors.update : configSelectors.create;

    const editNameResult = await PuppeteerStateTasks.setHTMLInputElementValue(page, selector.editName, stateName);
    const editIsoCodeResult = await PuppeteerStateTasks.setHTMLInputElementValue(
      page,
      selector.editIsoCode,
      stateIsoCode,
    );
    const editIntValResult = await PuppeteerStateTasks.setHTMLInputElementValue(page, selector.editIntVal, stateintVal);
    const editActiveResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editActive,
      true,
      false,
    );
    const editVisibleResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editVisible,
      true,
      true,
    );

    debug({ editNameResult, editIsoCodeResult, editIntValResult, editActiveResult, editVisibleResult });

    await page.click(selector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });

    await page.close();

    if (update) {
      if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
        return 'updated';
      }
    } else if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
      return 'created';
    }
    return 'skipped';
  }

  public async executeDeactivate(): Promise<boolean> {
    const task = this.currentDeactivateTask;

    const page = await this.context.newPage();

    const countrycode = task.split('-')[0];
    const stateIsoCode = task.split('-')[1].split('*')[0];

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
      {
        waitUntil: 'networkidle',
      },
    );

    const selector = configSelectors.update;

    const editVisibleResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editVisible,
      false,
      false,
    );
    const editActiveResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editActive,
      false,
      false,
    );
    debug({ editVisibleResult, editActiveResult });

    await page.click(selector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });

    await page.close();

    return editVisibleResult === 'changed' ? true : false;
  }

  public getNextAdd(): PuppeteerStateTasks {
    this.nextAddTaskIndex = this.nextAddTaskIndex + 1;
    this.currentAddTask = this.addTasks[this.nextAddTaskIndex];
    return this;
  }

  public getNextDeactivate(): PuppeteerStateTasks {
    this.nextDeactivateTaskIndex = this.nextDeactivateTaskIndex + 1;
    this.currentDeactivateTask = this.deactivateTasks[this.nextDeactivateTaskIndex];
    return this;
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  public async open(): Promise<void> {
    if (!this.browser) {
      this.browser = await playwright['chromium'].launch(await readLaunchOptionsFromProject());
      this.context = await this.browser.newContext();
      const login = await this.context.newPage();
      await login.goto(`${this.auth.instanceUrl}/secur/frontdoor.jsp?sid=${this.auth.accessToken}`, {
        waitUntil: 'networkidle',
        timeout: 300_000,
      });
    }
  }
}
