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
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { StreamingExtension } from '@jsforce/jsforce-node/lib/api/streaming.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'streaming');
export default class Streaming extends SfCommand {
    static summary = messages.getMessage('commandDescription');
    static examples = [
        `$ sfdx jayree org stream --channel=/event/eventName__e
...
`,
    ];
    static flags = {
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
    static deprecateAliases = true;
    static aliases = ['jayree:org:streaming'];
    async run() {
        const { flags } = await this.parse(Streaming);
        const conn = flags['target-org'].getConnection(flags['api-version']);
        const channel = flags.channel;
        const replayId = flags['replay-id'] ?? -1;
        const replayExt = new StreamingExtension.Replay(channel, replayId);
        const fayeClient = conn.streaming.createClient([replayExt]);
        const subscription = fayeClient.subscribe(channel, (data) => {
            this.styledJSON(data);
        });
        subscription.cancel();
    }
}
//# sourceMappingURL=stream.js.map