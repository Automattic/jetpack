`@tannin/postfix`
=================

Given a C expression, returns the equivalent postfix (Reverse Polish) notation terms as an array.

If a postfix string is desired, simply `.join( ' ' )` the result.

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install @tannin/postfix
```

Otherwise, download a pre-built copy from unpkg:

[https://unpkg.com/@tannin/postfix/dist/postfix.min.js](https://unpkg.com/@tannin/postfix/dist/postfix.min.js)

## Usage

```js
import postfix from '@tannin/postfix';

postfix( 'n > 1' );
// ⇒ [ 'n', '1', '>' ]
```

## License

Copyright 2019-2020 Andrew Duthie

Released under the [MIT License](https://opensource.org/licenses/MIT).
