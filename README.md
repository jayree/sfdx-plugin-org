# @jayree/sfdx-plugin-org

A Salesforce CLI plugin containing commands to configure State and Country/Territory Picklists and other org settings.

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
[![NPM](https://img.shields.io/npm/v/@jayree/sfdx-plugin-org.svg?label=@jayree/sfdx-plugin-org)](https://npmjs.org/package/@jayree/sfdx-plugin-org)
[![test-and-release](https://github.com/jayree/sfdx-plugin-org/actions/workflows/release.yml/badge.svg)](https://github.com/jayree/sfdx-plugin-org/actions/workflows/release.yml)
[![Downloads/week](https://img.shields.io/npm/dw/@jayree/sfdx-plugin-org.svg)](https://npmjs.org/package/@jayree/sfdx-plugin-org)
[![License](https://img.shields.io/npm/l/@jayree/sfdx-plugin-org.svg)](https://github.com/jayree-plugins/sfdx-plugin-org/blob/main/package.json)

## Install

```bash
sfdx plugins:install @jayree/sfdx-plugin-org
```

## Commands

<!-- commands -->
* [`sfdx jayree:org:configure`](#sfdx-jayreeorgconfigure)
* [`sfdx jayree:org:configure:country`](#sfdx-jayreeorgconfigurecountry)
* [`sfdx jayree:org:configure:state`](#sfdx-jayreeorgconfigurestate)

### `sfdx jayree:org:configure`

make configuration changes that are not covered by the metadata API

```
USAGE
  $ sfdx jayree:org:configure -o <value> [--json] [--api-version <value>] [-t <value>] [--concurrent]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  -t, --tasks=<value>...    list of task titles, if no tasks are specified, all tasks marked as active will be executed
  --api-version=<value>     Override the api version used for api requests made by this command
  --concurrent              execute tasks in parallel

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  make configuration changes that are not covered by the metadata API
  See example configuration on how to define tasks

  make configuration changes that are not covered by the metadata API
  See example configuration on how to define tasks

EXAMPLES
  $ sfdx jayree:org:configure
  $ sfdx jayree:org:configure -u me@my.org
  $ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
  $ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"
```

_See code: [src/commands/jayree/org/configure/index.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/index.ts)_

### `sfdx jayree:org:configure:country`

update country integration values in the State/Country Picklists

```
USAGE
  $ sfdx jayree:org:configure:country -o <value> [--json] [--api-version <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  update country integration values in the State/Country Picklists

  update country integration values in the State/Country Picklists
```

_See code: [src/commands/jayree/org/configure/country.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/country.ts)_

### `sfdx jayree:org:configure:state`

import (create/update) states into the State/Country Picklists

```
USAGE
  $ sfdx jayree:org:configure:state -o <value> [--json] [--api-version <value>] [--country-code <value>] [--category <value>]
    [--language <value>] [--concurrent <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  --api-version=<value>     Override the api version used for api requests made by this command
  --category=<value>        Subdivision category
  --concurrent=<value>      [default: 1] execute tasks in parallel
  --country-code=<value>    Alpha-2 code
  --language=<value>        Language code

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  import (create/update) states into the State/Country Picklists

  import (create/update) states into the State/Country Picklists
```

_See code: [src/commands/jayree/org/configure/state.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/state.ts)_
<!-- commandsstop -->
