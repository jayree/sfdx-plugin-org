/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'node:path';
import fs from 'fs-extra';
import { SfProject, Lifecycle } from '@salesforce/core';
const resolvedConfigs = {};
// eslint-disable-next-line complexity
export default async (path = SfProject.resolveProjectPathSync()) => {
    if (path && resolvedConfigs[path]) {
        return resolvedConfigs[path];
    }
    let configFromFile;
    try {
        configFromFile = fs.readJsonSync(join(path, '.sfdx-jayree.json'));
        await Lifecycle.getInstance().emitWarning('The ".sfdx-jayree.json" config has been deprecated. Use "sfdx-project.json" instead.');
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            configFromFile = undefined;
        }
        else {
            throw error;
        }
    }
    const config = {
        ...configFromFile,
    };
    resolvedConfigs[path] = config;
    return config;
};
//# sourceMappingURL=config.js.map