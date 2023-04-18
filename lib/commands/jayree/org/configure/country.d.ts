import { SfCommand } from '@salesforce/sf-plugins-core';
export default class UpdateCountry extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly flags: {
        'target-org': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'api-version': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        silent: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
