# is-core-module <sup>[![Version Badge][2]][1]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Is this specifier a node.js core module? Optionally provide a node version to check; defaults to the current node version.

## Example

```js
var isCore = require('is-core-module');
var assert = require('assert');
assert(isCore('fs'));
assert(!isCore('butts'));
```

## TypeScript

`isCore` accepts any string. `isCore.Module` is the union of every specifier in `core.json`, regardless of node version, so editors can suggest them.

The types import `core.json`, so [`resolveJsonModule`](https://www.typescriptlang.org/tsconfig/#resolveJsonModule), [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop), and [`allowSyntheticDefaultImports`](https://www.typescriptlang.org/tsconfig/#allowSyntheticDefaultImports) must be enabled; some `module` and `moduleResolution` settings enable them by default, but `node16` does not enable `resolveJsonModule`.
Without them, TypeScript reports an error in this package's `index.d.ts`, or, with `skipLibCheck`, `isCore.Module` silently widens to `string | number | symbol`.

```ts
import isCore = require('is-core-module');

function isBuiltin(specifier: string): boolean {
	return isCore(specifier); // any string is accepted
}

const name: isCore.Module = 'node:fs'; // only specifiers listed in `core.json`
isCore(name, '16.0.0'); // true
```

## Tests
Clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/is-core-module
[2]: https://versionbadg.es/inspect-js/is-core-module.svg
[5]: https://david-dm.org/inspect-js/is-core-module.svg
[6]: https://david-dm.org/inspect-js/is-core-module
[7]: https://david-dm.org/inspect-js/is-core-module/dev-status.svg
[8]: https://david-dm.org/inspect-js/is-core-module#info=devDependencies
[11]: https://nodei.co/npm/is-core-module.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/is-core-module.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/is-core-module.svg
[downloads-url]: https://npm-stat.com/charts.html?package=is-core-module
[codecov-image]: https://codecov.io/gh/inspect-js/is-core-module/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/inspect-js/is-core-module/
[actions-image]: https://img.shields.io/github/check-runs/inspect-js/is-core-module/main
[actions-url]: https://github.com/inspect-js/is-core-module/actions
