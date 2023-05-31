import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';
export default class FlowTestCoverage extends SfCommand<AnyJson> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/lib/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        'api-version': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    run(): Promise<AnyJson>;
}