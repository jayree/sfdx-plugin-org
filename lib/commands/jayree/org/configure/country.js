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
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import playwright from 'playwright-chromium';
import { tabletojson } from 'tabletojson';
import progress from 'cli-progress';
import { configSelectors } from '../../../../utils/puppeteer/countrystateconfig.js';
import { readLaunchOptionsFromProject } from '../../../../utils/puppeteer/utils.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'createstatecountry');
export default class UpdateCountry extends SfCommand {
    static summary = messages.getMessage('commandCountryDescription');
    // public static readonly description = messages.getMessage('commandCountryDescription');
    static flags = {
        'target-org': requiredOrgFlagWithDeprecations,
        'api-version': orgApiVersionFlagWithDeprecations,
        silent: Flags.boolean({
            summary: messages.getMessage('flags.silent.summary'),
            required: false,
            default: false,
            hidden: true,
        }),
    };
    async run() {
        const { flags } = await this.parse(UpdateCountry);
        const browser = await playwright['chromium'].launch(await readLaunchOptionsFromProject());
        const context = await browser.newContext();
        const page = await context.newPage();
        const setHTMLInputElementValue = async (newvalue, element) => {
            element = element.replace(/:/g, '\\:');
            const elementDisabled = await page.evaluate((s) => {
                const result = document.querySelector(s);
                if (result != null) {
                    return result.disabled;
                }
                else {
                    return true;
                }
            }, element);
            if (!elementDisabled) {
                return page.fill(element, newvalue);
            }
        };
        const bar = new progress.SingleBar({
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            format: 'State and Country/Territory Picklist | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {text}',
            stream: process.stdout,
        });
        try {
            if (!flags.silent) {
                this.spinner.start('State and Country/Territory Picklist');
            }
            else {
                process.stdout.write('State and Country/Territory Picklist');
            }
            await flags['target-org'].getConnection(flags['api-version']).refreshAuth();
            const conn = flags['target-org'].getConnection(flags['api-version']);
            if (!flags.silent) {
                this.spinner.start(`login to ${conn.instanceUrl}`);
            }
            else {
                process.stdout.write('.');
            }
            await page.goto(`${conn.instanceUrl}/secur/frontdoor.jsp?sid=${conn.accessToken}`, {
                waitUntil: 'networkidle',
            });
            if (!flags.silent) {
                this.spinner.start('retrieve list of countries');
            }
            else {
                process.stdout.write('.');
            }
            try {
                await page.goto(conn.instanceUrl + '/i18n/ConfigStateCountry.apexp?setupid=AddressCleanerOverview', {
                    waitUntil: 'networkidle',
                });
                await page.waitForSelector('.list', { state: 'visible' });
            }
            catch (error) {
                throw new Error("list of countries couldn't be loaded", { cause: error });
            }
            this.spinner.stop();
            const table = await page.evaluate(() => {
                const list = document.querySelector('.list');
                if (list) {
                    return list.outerHTML;
                }
            });
            const list = tabletojson.convert(table)[0];
            let curr = 0;
            if (!flags.silent) {
                bar.start(list.length, 0, {
                    text: '',
                });
            }
            // The country updates must remain sequential to avoid concurrent browser navigation.
            // eslint-disable-next-line @typescript-eslint/await-thenable
            for await (const value of list) {
                const countryCode = value['Country/Territory Code'];
                const countryName = value.Country;
                curr = curr + 1;
                if (!flags.silent) {
                    bar.update(curr, {
                        text: 'update ' + countryName + '/' + countryCode,
                    });
                }
                else {
                    process.stdout.write('.');
                }
                await page.goto(conn.instanceUrl + `/i18n/ConfigureCountry.apexp?countryIso=${countryCode}&setupid=AddressCleanerOverview`, {
                    waitUntil: 'networkidle',
                });
                const setCountrySelector = configSelectors.setCountry;
                await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);
                await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
                await page.waitForSelector('.message.confirmM3', { state: 'visible' });
            }
        }
        finally {
            if (!flags.silent) {
                bar.update(bar.getTotal(), { text: '' });
            }
            else {
                process.stdout.write('.');
            }
            this.spinner.stop();
            bar.stop();
            if (page) {
                await page.close();
                if (browser) {
                    await browser.close();
                }
            }
        }
    }
}
//# sourceMappingURL=country.js.map