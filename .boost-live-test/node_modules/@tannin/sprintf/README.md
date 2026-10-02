# `@tannin/sprintf`

Given a format string, returns string with arguments interpolatation. Arguments can either be provided directly via function arguments spread, or with an array as the second argument.

See: [https://en.wikipedia.org/wiki/Printf_format_string](https://en.wikipedia.org/wiki/Printf_format_string)

In addition to basic placeholder substitution, the following options a placeholder are implemented:

- Positional index
- Named arguments
- Precision / maximum width (including `*` precision)
- Type (only the behaviors of `f`, `d`, `s`, and `%` are applied)

Notably, this excludes:

- Flags
- Minimum width (padding)
- Length

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install @tannin/sprintf
```

Otherwise, download a pre-built copy from unpkg:

[https://unpkg.com/@tannin/sprintf/dist/sprintf.min.js](https://unpkg.com/@tannin/sprintf/dist/sprintf.min.js)

## Usage

Using positional arguments:

```js
import sprintf from '@tannin/sprintf';

sprintf('Hello %s!', 'world');
// ⇒ 'Hello world!'
```

Using named arguments:

```js
import sprintf from '@tannin/sprintf';

sprintf('Hello %(place)s! From %(name)s.', { place: 'world', name: 'Andrew' });
// ⇒ 'Hello world! From Andrew.'
```

## Type coercions and default values

When replacing numeric types (`%d` and `%f`), values will be coerced to numeric values, and default to 0:

- `sprintf( '%d', 123 )` returns `'123'`
- `sprintf( '%d', '123' )` returns `'123'`
- `sprintf( '%d', 'string' )` returns `'0'`
- `sprintf( '%d', false )` returns `'0'`
- `sprintf( '%d', null )` returns `'0'`
- `sprintf( '%d', undefined )` returns `'0'`

When replacing string types (`%s`), values will be coerced to strings, and nullish values will be replaced with `''`:

- `sprintf( '%s', 'string' )` returns `'string'`
- `sprintf( '%s', 0 )` returns `'0'`
- `sprintf( '%s', false )` returns `'false'`
- `sprintf( '%s', null )` returns `''`
- `sprintf( '%s', undefined )` returns `''`

## License

Copyright 2019-2025 Andrew Duthie

Released under the [MIT License](https://opensource.org/licenses/MIT).
