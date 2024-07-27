import { SfCommand } from '@salesforce/sf-plugins-core';
export default class UpdateCountry extends SfCommand<void> {
    static readonly summary: string;
    static readonly flags: {
        'target-org': import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions>;
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        silent: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
