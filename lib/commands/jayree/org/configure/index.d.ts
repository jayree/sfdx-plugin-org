import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';
export default class ConfigureOrg extends SfCommand<AnyJson> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions>;
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        tasks: import("@oclif/core/interfaces").OptionFlag<string[], import("@oclif/core/interfaces").CustomOptions>;
        concurrent: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<AnyJson>;
}
