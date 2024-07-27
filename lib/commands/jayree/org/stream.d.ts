import { SfCommand } from '@salesforce/sf-plugins-core';
export default class Streaming extends SfCommand<void> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions>;
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        channel: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'replay-id': import("@oclif/core/interfaces").OptionFlag<number | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    run(): Promise<void>;
}
