# is-plain-object

[![npm version](https://img.shields.io/npm/v/is-plain-object.svg)](https://www.npmjs.com/package/is-plain-object)
[![npm downloads](https://img.shields.io/npm/dm/is-plain-object.svg)](https://www.npmjs.com/package/is-plain-object)
[![CI](https://github.com/jonschlinkert/is-plain-object/actions/workflows/ci.yml/badge.svg)](https://github.com/jonschlinkert/is-plain-object/actions/workflows/ci.yml)

> Returns `true` if an object was created by the `Object` constructor or with a `null` prototype.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and starring the project to show your ❤️ and support.

Use [isobject](https://github.com/jonschlinkert/isobject) if you only want to check whether a value is an object and not an array or `null`.

## Install

```sh
npm install is-plain-object
```

## Usage

With ES modules:

```js
import { isPlainObject } from 'is-plain-object';

isPlainObject({});                        // true
isPlainObject({ foo: 'bar' });            // true
isPlainObject(Object.create(null));       // true
isPlainObject(Object.create({}));         // true

isPlainObject();                          // false
isPlainObject(null);                      // false
isPlainObject([]);                        // false
isPlainObject(new Date());                // false
isPlainObject(/foo/);                     // false
isPlainObject(() => {});                  // false
```

With CommonJS:

```js
const { isPlainObject } = require('is-plain-object');
```

## API

### `isPlainObject(value)`

Returns `true` when `value` is a plain object. Objects created by the `Object` constructor and objects with a `null` prototype are considered plain.

## Development

Install dependencies, build the CommonJS and ES module bundles, and run the tests:

```sh
npm install
npm run build
npm test
```

## Related projects

- [is-number](https://www.npmjs.com/package/is-number): Check if a value is a finite number.
- [isobject](https://www.npmjs.com/package/isobject): Check if a value is an object and not an array or `null`.
- [kind-of](https://www.npmjs.com/package/kind-of): Get the native type of a value.

## License

[MIT](LICENSE) © Jon Schlinkert
