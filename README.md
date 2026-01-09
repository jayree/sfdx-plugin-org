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
* [`sfdx jayree flow get coverage`](#sfdx-jayree-flow-get-coverage)
* [`sfdx jayree org configure`](#sfdx-jayree-org-configure)
* [`sfdx jayree org configure country`](#sfdx-jayree-org-configure-country)
* [`sfdx jayree org configure state`](#sfdx-jayree-org-configure-state)
* [`sfdx jayree org get settings`](#sfdx-jayree-org-get-settings)
* [`sfdx jayree org stream`](#sfdx-jayree-org-stream)

### `sfdx jayree flow get coverage`

Check the flow test coverage of an Org.

```
USAGE
  $ sfdx jayree flow get coverage -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree flowtestcoverage

EXAMPLES
  $ sfdx jayree:flowtestcoverage
  === Flow Test Coverage
  Coverage: 82%
  ...
```

_See code: [src/commands/jayree/flow/get/coverage.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/flow/get/coverage.ts)_

### `sfdx jayree org configure`

Make configuration changes that are not covered by the metadata API.

```
USAGE
  $ sfdx jayree org configure -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-t <value>...]
    [--concurrent]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -t, --tasks=<value>...     Task name(s) listed in sfdx-project.json, if no tasks are specified, all tasks marked as
                             active will be executed.
      --api-version=<value>  Override the api version used for api requests made by this command
      --concurrent           Execute tasks in parallel.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  $ sfdx jayree:org:configure
  $ sfdx jayree:org:configure -u me@my.org
  $ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
  $ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"
```

_See code: [src/commands/jayree/org/configure/index.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/org/configure/index.ts)_

### `sfdx jayree org configure country`

update country integration values in the State/Country Picklists

```
USAGE
  $ sfdx jayree org configure country -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/jayree/org/configure/country.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/org/configure/country.ts)_

### `sfdx jayree org configure state`

import (create/update) states into the State/Country Picklists

```
USAGE
  $ sfdx jayree org configure state -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [--country-code <value>]
    [--category <value>] [--language <value>] [--concurrent <value>]

FLAGS
  -o, --target-org=<value>    (required) Username or alias of the target org. Not required if the `target-org`
                              configuration variable is already set.
      --api-version=<value>   Override the api version used for api requests made by this command
      --category=<value>      Subdivision category.
      --concurrent=<value>    [default: 1] execute tasks in parallel.
      --country-code=<value>  Alpha-2 code.
      --language=<value>      Language code.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/jayree/org/configure/state.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/org/configure/state.ts)_

### `sfdx jayree org get settings`

Write the current settings from an Org to a scratch org def file.

```
USAGE
  $ sfdx jayree org get settings -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-w] [-f <value>]

FLAGS
  -f, --file=<value>                  Write to 'file' instead of project-scratch-def.json.
  -o, --target-org=<value>            (required) Username or alias of the target org. Not required if the `target-org`
                                      configuration variable is already set.
  -w, --writetoprojectscratchdeffile  Write output to project-scratch-def.json file.
      --api-version=<value>           Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree org settings

EXAMPLES
  $ sfdx jayree:org:settings
  $ sfdx jayree:org:settings -u me@my.org
  $ sfdx jayree:org:settings -u MyTestOrg1 -w
```

_See code: [src/commands/jayree/org/get/settings.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/org/get/settings.ts)_

### `sfdx jayree org stream`

Listen to streaming api and platform events.

```
USAGE
  $ sfdx jayree org stream -o <value> -c <value> [--json] [--flags-dir <value>] [--api-version <value>] [-r <value>]

FLAGS
  -c, --channel=<value>      (required) The event name.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -r, --replay-id=<value>    Receive all stored events after the event specified by the replayId value and new events.
                             [default: -1] Receive new events that are broadcast after the command subscribes. [-2]
                             Receive all event, including past events that are within the retention window and new
                             events.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree org streaming

EXAMPLES
  $ sfdx jayree org stream --channel=/event/eventName__e
  ...
```

_See code: [src/commands/jayree/org/stream.ts](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.154/src/commands/jayree/org/stream.ts)_
<!-- commandsstop -->
