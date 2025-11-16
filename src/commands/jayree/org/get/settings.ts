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
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Flags,
  SfCommand,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages, SfProject, SfError } from '@salesforce/core';
import { AnyJson, JsonArray, JsonMap } from '@salesforce/ts-types';
import createDebug from 'debug';
import fs from 'fs-extra';
import {
  ComponentSet,
  MetadataResolver,
  NodeFSTreeContainer,
  RegistryAccess,
} from '@salesforce/source-deploy-retrieve';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'scratchorgsettings');

function camelize(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

async function resolve(fpath: string): Promise<JsonMap> {
  const resolver = new MetadataResolver(new RegistryAccess(), new NodeFSTreeContainer());
  const [c] = resolver.getComponentsFromPath(fpath);
  return c.parseXml();
}

export default class ScratchOrgSettings extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('commandDescription');

  public static readonly examples = [
    `$ sfdx jayree:org:settings
$ sfdx jayree:org:settings -u me@my.org
$ sfdx jayree:org:settings -u MyTestOrg1 -w`,
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    writetoprojectscratchdeffile: Flags.boolean({
      char: 'w',
      summary: messages.getMessage('flags.writetoprojectscratchdeffile.summary'),
    }),
    file: Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.file.summary'),
    }),
  };

  public static readonly requiresProject = true;

  public static readonly deprecateAliases = true;
  public static readonly aliases = ['jayree:org:settings'];

  // eslint-disable-next-line complexity
  public async run(): Promise<AnyJson> {
    const { flags } = await this.parse(ScratchOrgSettings);
    const debug = createDebug('jayree:scratchorg:settings');
    const removeEmpty = (obj: JsonMap): { [setting: string]: JsonMap } => {
      Object.entries(obj).forEach(([key, val]) => {
        if (val && typeof val === 'object') {
          val = removeEmpty(val as JsonMap);
        }
        if (val === null || val === '' || (typeof val === 'object' && !Object.keys(val).length)) {
          delete obj[key];
        }
      });
      return obj as { [setting: string]: JsonMap };
    };

    const sortKeys = (obj: JsonMap): { [setting: string]: JsonMap } => {
      const ordered: JsonMap = {};
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          ordered[key] = obj[key];
        });
      return ordered as { [setting: string]: JsonMap };
    };

    let settings: { [setting: string]: JsonMap } = {};

    const targetDir = process.env.SFDX_MDAPI_TEMP_DIR ?? os.tmpdir();
    const destRoot = join(targetDir, 'RetrieveSettings');

    process.once('exit', () => {
      fs.removeSync(destRoot);
    });

    const sfdxProject = await SfProject.resolve();
    const sfdxProjectJson = await sfdxProject.retrieveSfProjectJson();
    const sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;

    const apiVersion =
      flags['api-version'] ?? sfdxProjectVersion ?? (await flags['target-org'].retrieveMaxApiVersion());

    this.log(`Using ${destRoot} and apiVersion=${apiVersion}`);

    const componentSet = new ComponentSet([{ fullName: '*', type: 'Settings' }]);

    const mdapiRetrieve = await componentSet.retrieve({
      usernameOrConnection: flags['target-org'].getUsername() as string,
      output: destRoot,
      apiVersion,
    });

    const retrieveResult = await mdapiRetrieve.pollStatus(1000);

    for await (const setting of retrieveResult
      .getFileResponses()
      .filter((component) => component.type === 'Settings')) {
      const settingsXml = await resolve(setting.filePath as string);
      Object.keys(settingsXml).forEach((key) => {
        Object.entries(settingsXml[key] as JsonMap).forEach(([property, value]) => {
          if (!settings[camelize(key)]) {
            settings[camelize(key)] = {};
          }
          if (property !== '@_xmlns') {
            settings[camelize(key)][property] = value;
          }
        });
      });
    }

    if (typeof settings['addressSettings'] !== 'undefined') {
      delete settings['addressSettings'];
      debug('delete ' + 'addressSettings');
    }

    if (typeof settings['searchSettings'] !== 'undefined') {
      delete settings['searchSettings'];
      debug('delete ' + 'searchSettings');
    }

    if (typeof settings['analyticsSettings'] !== 'undefined') {
      delete settings['analyticsSettings'];
      debug('delete ' + 'analyticsSettings');
    }

    if (typeof settings['activitiesSettings'] !== 'undefined') {
      if (typeof settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'] !== 'undefined') {
        delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
        debug('delete ' + 'activitiesSettings:allowUsersToRelateMultipleContactsToTasksAndEvents');

        this.warn(
          "You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce.",
        );
      }
    }

    if (typeof settings['territory2Settings'] !== 'undefined') {
      if (typeof settings['territory2Settings']['enableTerritoryManagement2'] !== 'undefined') {
        settings['territory2Settings'] = {
          enableTerritoryManagement2: settings['territory2Settings']['enableTerritoryManagement2'],
        };
        debug('set ' + 'enableTerritoryManagement2');
      }
    }

    if (typeof settings['forecastingSettings'] !== 'undefined') {
      if (typeof settings['forecastingSettings']['forecastingCategoryMappings'] !== 'undefined') {
        delete settings['forecastingSettings']['forecastingCategoryMappings'];
        debug('delete ' + 'forecastingSettings:forecastingCategoryMappings');
      }
      if (typeof settings['forecastingSettings']['forecastingTypeSettings'] !== 'undefined') {
        delete settings['forecastingSettings']['forecastingTypeSettings'];
        debug('delete ' + 'forecastingSettings:forecastingTypeSettings');
      }
    }

    if (typeof settings['caseSettings'] !== 'undefined') {
      if (typeof settings['caseSettings']['caseFeedItemSettings'] !== 'undefined') {
        if (typeof (settings['caseSettings']['caseFeedItemSettings'] as JsonArray)[0] !== 'undefined') {
          if (
            typeof ((settings['caseSettings']['caseFeedItemSettings'] as JsonArray)[0] as JsonMap)['feedItemType'] !==
            'undefined'
          ) {
            if (
              ((settings['caseSettings']['caseFeedItemSettings'] as JsonArray)[0] as JsonMap)['feedItemType'] ===
              'EMAIL_MESSAGE_EVENT'
            ) {
              ((settings['caseSettings']['caseFeedItemSettings'] as JsonArray)[0] as JsonMap)['feedItemType'] =
                'EmailMessageEvent';
              debug('set ' + 'caseSettings:caseFeedItemSettings:feedItemType');
            }
          }
        }
      }
    }

    settings = removeEmpty(settings);
    settings = sortKeys(settings);

    if (flags.writetoprojectscratchdeffile) {
      const deffilepath =
        // eslint-disable-next-line @typescript-eslint/await-thenable
        flags.file ?? join(this.project?.getPath() as string, 'config', 'project-scratch-def.json');
      let deffile: JsonMap = {};

      await fs
        .readFile(deffilepath, 'utf8')
        .then((data) => {
          deffile = JSON.parse(data) as JsonMap;

          if (deffile['edition'] === 'Enterprise') {
            if (!(deffile['features'] as JsonArray).includes('LiveAgent')) {
              if (typeof settings['liveAgentSettings'] !== 'undefined') {
                if (typeof settings['liveAgentSettings']['enableLiveAgent'] !== 'undefined') {
                  if (settings['liveAgentSettings']['enableLiveAgent'] === 'false') {
                    delete settings['liveAgentSettings'];
                    debug('delete ' + 'liveAgentSettings');
                    this.warn('liveAgentSettings: Not available for deploy for this organization');
                  }
                }
              }
            }

            if (typeof settings['knowledgeSettings'] !== 'undefined') {
              if (typeof settings['knowledgeSettings']['enableKnowledge'] !== 'undefined') {
                if (settings['knowledgeSettings']['enableKnowledge'] === 'false') {
                  delete settings['knowledgeSettings'];
                  debug('delete ' + 'knowledgeSettings');
                  this.warn("knowledgeSettings: Once enabled, Salesforce Knowledge can't be disabled.");
                }
              }
            }

            if (typeof settings['caseSettings'] !== 'undefined') {
              if (typeof settings['caseSettings']['emailToCase'] !== 'undefined') {
                if (typeof (settings['caseSettings']['emailToCase'] as JsonMap)['enableEmailToCase'] !== 'undefined') {
                  if ((settings['caseSettings']['emailToCase'] as JsonMap)['enableEmailToCase'] === 'false') {
                    delete settings['caseSettings']['emailToCase'];
                    debug('delete ' + 'caseSettings:emailToCase');
                    this.warn('EmailToCaseSettings: Email to case cannot be disabled once it has been enabled.');
                  }
                }
              }
            }
          }

          deffile['settings'] = settings;
        })
        .catch((err) => {
          const error = err as SfError;
          if (error.code === 'ENOENT' && !flags.file) {
            throw Error("default file 'project-scratch-def.json' not found, please use --file flag");
          } else {
            throw error;
          }
        });

      await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2));
    } else {
      this.styledHeader(
        `received settings from Org: ${flags['target-org'].getUsername() as string} (${flags['target-org'].getOrgId()})`,
      );
      this.styledJSON(settings);
    }

    return {
      settings,
      orgId: flags['target-org'].getOrgId(),
      username: flags['target-org'].getUsername(),
    };
  }
}
