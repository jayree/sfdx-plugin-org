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
import { StreamingExtension } from 'jsforce/lib/api/streaming.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-org', 'streaming');
class Streaming extends SfCommand {
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
Streaming.summary = messages.getMessage('commandDescription');
Streaming.examples = [
    `$ sfdx jayree org stream --channel=/event/eventName__e
...
`,
];
Streaming.flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    channel: Flags.string({
        char: 'c',
        required: true,
        summary: messages.getMessage('topicFlagDescription'),
        deprecateAliases: true,
        aliases: ['topic', 'p'],
    }),
    'replay-id': Flags.integer({
        char: 'r',
        summary: messages.getMessage('replayIdFlagDescription'),
    }),
};
Streaming.deprecateAliases = true;
Streaming.aliases = ['jayree:org:streaming'];
export default Streaming;
//# sourceMappingURL=stream.js.map