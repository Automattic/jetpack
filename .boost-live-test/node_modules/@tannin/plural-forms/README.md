`@tannin/plural-forms`
======================

Compiles a function to compute the plural forms index for a given value.

Given a C expression, returns a function which, when called with a value, evaluates the result with the value assumed to be the "n" variable of the expression. The result will be coerced to its numeric equivalent.

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install @tannin/plural-forms
```

Otherwise, download a pre-built copy from unpkg:

[https://unpkg.com/@tannin/plural-forms/dist/plural-forms.min.js](https://unpkg.com/@tannin/plural-forms/dist/plural-forms.min.js)

## Usage

```js
import pluralForms from '@tannin/plural-forms';

const evaluate = pluralForms( 'n > 1' );

evaluate( 2 );
// ⇒ 1

evaluate( 1 );
// ⇒ 0
```

## License

Copyright 2019-2020 Andrew Duthie

Released under the [MIT License](https://opensource.org/licenses/MIT).
