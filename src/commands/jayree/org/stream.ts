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
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { StreamingExtension, StreamingMessage } from '@jsforce/jsforce-node/lib/api/streaming.js';
import { Record } from '@jsforce/jsforce-node';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'streaming');

export default class Streaming extends SfCommand<void> {
  public static readonly summary = messages.getMessage('commandDescription');

  public static readonly examples = [
    `$ sfdx jayree org stream --channel=/event/eventName__e
...
`,
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    channel: Flags.string({
      char: 'c',
      required: true,
      summary: messages.getMessage('flags.channel.summary'),
      deprecateAliases: true,
      aliases: ['topic', 'p'],
    }),
    'replay-id': Flags.integer({
      char: 'r',
      summary: messages.getMessage('flags.replay-id.summary'),
    }),
  };

  public static readonly deprecateAliases = true;
  public static readonly aliases = ['jayree:org:streaming'];

  public async run(): Promise<void> {
    const { flags } = await this.parse(Streaming);

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const channel = flags.channel;
    const replayId = flags['replay-id'] ?? -1;
    const replayExt = new StreamingExtension.Replay(channel, replayId);

    const fayeClient = conn.streaming.createClient([replayExt]);

    const subscription = fayeClient.subscribe(channel, (data: StreamingMessage<Record>) => {
      this.styledJSON(data);
    });
    subscription.cancel();
  }
}
