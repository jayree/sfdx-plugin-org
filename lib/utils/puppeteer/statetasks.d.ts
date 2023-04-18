type Country = {
    '3166-2 code': string;
    'Subdivision name': string;
    'Local variant': string;
    'Language code': string;
    'Romanization system': string;
    'Parent subdivision': string;
};
type CountryCode = Country[];
export declare class PuppeteerStateTasks {
    currentAddTask: Country;
    currentDeactivateTask: string;
    private addTasks;
    private deactivateTasks;
    private nextAddTaskIndex;
    private nextDeactivateTaskIndex;
    private browser;
    private context;
    private auth;
    private countrycode;
    private countries;
    private language;
    private category;
    private ISOData;
    constructor(auth: {
        instanceUrl: string;
        accessToken: string;
    });
    private static setHTMLInputElementValue;
    private static setHTMLInputElementChecked;
    validateParameterCountryCode(countrycode: string): Promise<{
        selected: string | undefined;
        values: Array<{
            name: string;
            value: string;
        }>;
    }>;
    validateParameterCategory(category: string): {
        selected: string | undefined;
        values: string[] | undefined;
    };
    validateParameterLanguage(language: string): {
        selected: string | undefined;
        values: string[] | undefined;
    };
    validateData(): {
        add: CountryCode;
        deactivate: string[];
    };
    setCountryIntegrationValue(): Promise<boolean>;
    executeAdd(): Promise<string>;
    executeDeactivate(): Promise<boolean>;
    getNextAdd(): PuppeteerStateTasks;
    getNextDeactivate(): PuppeteerStateTasks;
    close(): Promise<void>;
    open(): Promise<void>;
}
export {};
