/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ux } from '@oclif/core';
import playwright from 'playwright-chromium';
import { tabletojson } from 'tabletojson';
import { configSelectors } from '../../../../utils/puppeteer/countrystateconfig.js';
import { readLaunchOptionsFromProject } from '../../../../utils/puppeteer/utils.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'createstatecountry');
// eslint-disable-next-line sf-plugin/command-example
class UpdateCountry extends SfCommand {
    async run() {
        const { flags } = await this.parse(UpdateCountry);
        let spinnermessage = '';
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
        const bar = ux.progress({
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            format: 'State and Country/Territory Picklist | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {text}',
            stream: process.stdout,
        });
        try {
            // eslint-disable-next-line no-unused-expressions
            !flags.silent
                ? this.spinner.start('State and Country/Territory Picklist')
                : process.stdout.write('State and Country/Territory Picklist');
            await flags['target-org'].getConnection(flags['api-version']).refreshAuth();
            const conn = flags['target-org'].getConnection(flags['api-version']);
            spinnermessage = `login to ${conn.instanceUrl}`;
            // eslint-disable-next-line no-unused-expressions
            !flags.silent ? this.spinner.start(spinnermessage) : process.stdout.write('.');
            await page.goto(`${conn.instanceUrl}/secur/frontdoor.jsp?sid=${conn.accessToken}`, {
                waitUntil: 'networkidle',
            });
            spinnermessage = 'retrieve list of countries';
            // eslint-disable-next-line no-unused-expressions
            !flags.silent ? this.spinner.start(spinnermessage) : process.stdout.write('.');
            try {
                await page.goto(conn.instanceUrl + '/i18n/ConfigStateCountry.apexp?setupid=AddressCleanerOverview', {
                    waitUntil: 'networkidle',
                });
                await page.waitForSelector('.list', { state: 'visible' });
            }
            catch (error) {
                throw Error("list of countries couldn't be loaded");
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
            for await (const value of list) {
                const countryCode = value['Country/Territory Code'];
                const countryName = value.Country;
                curr = curr + 1;
                // eslint-disable-next-line no-unused-expressions
                !flags.silent
                    ? bar.update(curr, {
                        text: 'update ' + countryName + '/' + countryCode,
                    })
                    : process.stdout.write('.');
                await page.goto(conn.instanceUrl + `/i18n/ConfigureCountry.apexp?countryIso=${countryCode}&setupid=AddressCleanerOverview`, {
                    waitUntil: 'networkidle',
                });
                const setCountrySelector = configSelectors.setCountry;
                await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);
                await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
                await page.waitForSelector('.message.confirmM3', { state: 'visible' });
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
        finally {
            // eslint-disable-next-line no-unused-expressions
            !flags.silent ? bar.update(bar.getTotal(), { text: '' }) : process.stdout.write('.');
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
UpdateCountry.summary = messages.getMessage('commandCountryDescription');
// public static readonly description = messages.getMessage('commandCountryDescription');
UpdateCountry.flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    silent: Flags.boolean({
        summary: messages.getMessage('flags.silent.summary'),
        required: false,
        default: false,
        hidden: true,
    }),
};
export default UpdateCountry;
//# sourceMappingURL=country.js.map