import { SfCommand } from '@salesforce/sf-plugins-core';
export default class Streaming extends SfCommand<void> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'api-version': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        channel: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'replay-id': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<number | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
    };
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    run(): Promise<void>;
}
