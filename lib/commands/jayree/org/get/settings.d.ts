import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';
export default class ScratchOrgSettings extends SfCommand<AnyJson> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions>;
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        writetoprojectscratchdeffile: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        file: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    static readonly requiresProject = true;
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    run(): Promise<AnyJson>;
}
