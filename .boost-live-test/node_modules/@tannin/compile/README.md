`@tannin/compile`
=================

Compiles an evaluating function for a C expression.

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install @tannin/compile
```

Otherwise, download a pre-built copy from unpkg:

[https://unpkg.com/@tannin/compile/dist/compile.min.js](https://unpkg.com/@tannin/compile/dist/compile.min.js)

## Usage

```js
import compile from '@tannin/compile';

const evaluate = compile( 'n > 1' );

evaluate( { n: 2 } );
// ⇒ true
```

## License

Copyright 2019-2020 Andrew Duthie

Released under the [MIT License](https://opensource.org/licenses/MIT).
