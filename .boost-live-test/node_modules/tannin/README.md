Tannin
======

Tannin is a [gettext](https://www.gnu.org/software/gettext/) localization library.

Inspired by [Jed](https://github.com/messageformat/Jed), it is built to be largely compatible with Jed-formatted locale data, and even offers a [Jed drop-in replacement compatibility shim](#jed-compatibility) to easily convert an existing project. Contrasted with Jed, it is more heavily optimized for performance and bundle size. While Jed works well with one-off translations, it suffers in single-page applications with repeated rendering of elements. Using Tannin, you can expect a bundle size **20% that of Jed** (**980 bytes gzipped**) and upwards of **330x better performance** ([see benchmarks](#benchmarks)). It does so without sacrificing the safety of plural forms evaluation, using a hand-crafted expression parser in place of the verbose compiled grammar included in Jed.

Furthermore, the project is architected as a mono-repo, published on npm under the `@tannin` scope. These modules can be used standalone, with or without Tannin. For example, you may find value in [`@tannin/compile`](https://www.npmjs.com/package/@tannin/compile) for creating an expression evaluator, or [`@tannin/sprintf`](https://www.npmjs.com/package/@tannin/sprintf) as a minimal [printf](https://en.wikipedia.org/wiki/Printf_format_string) string formatter.

The following modules are available:

- [`tannin`](https://www.npmjs.com/package/tannin)
- [`@tannin/compat`](https://www.npmjs.com/package/@tannin/compat)
- [`@tannin/compile`](https://www.npmjs.com/package/@tannin/compile)
- [`@tannin/evaluate`](https://www.npmjs.com/package/@tannin/evaluate)
- [`@tannin/plural-forms`](https://www.npmjs.com/package/@tannin/plural-forms)
- [`@tannin/compat`](https://www.npmjs.com/package/@tannin/compat)
- [`@tannin/postfix`](https://www.npmjs.com/package/@tannin/postfix)
- [`@tannin/sprintf`](https://www.npmjs.com/package/@tannin/sprintf)

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install tannin
```

Otherwise, download a pre-built copy from unpkg:

[https://unpkg.com/tannin/dist/tannin.min.js](https://unpkg.com/tannin/dist/tannin.min.js)

## Usage

Construct a new instance of `Tannin`, passing locale data in the form of a [Jed-formatted JSON object](http://messageformat.github.io/Jed/).

The returned `Tannin` instance includes the fully-qualified `dcnpgettext` function to retrieve a translated string.

```js
import Tannin from 'tannin';

const i18n = new Tannin( {
	the_domain: {
		'': {
			domain: 'the_domain',
			lang: 'en',
			plural_forms: 'nplurals=2; plural=(n != 1);',
		},
		example: [ 'singular translation', 'plural translation' ],
	},
} );

i18n.dcnpgettext( 'the_domain', undefined, 'example' );
// ⇒ 'singular translation'
```

Tannin accepts `plural_forms` both as a standard [gettext plural forms string](https://www.gnu.org/software/gettext/manual/html_node/Plural-forms.html) or as a function which, given a number, should return the (zero-based) plural form index. Providing `plural_forms` as a function can yield a performance gain of approximately 8x for plural evaluation.

For example, consider the following "default" English (untranslated) initialization:

```js
const i18n = new Tannin( {
	messages: {
		'': {
			domain: 'messages',
			plural_forms: ( n ) => n === 1 ? 0 : 1,
		},
	},
} );

i18n.dcnpgettext( 'messages', undefined, 'example', 'examples', 1 );
// ⇒ 'example'

i18n.dcnpgettext( 'messages', undefined, 'example', 'examples', 2 );
// ⇒ 'examples'
```

## Jed Compatibility

For a more human-friendly API, or to more easily transition an existing project, consider using [`@tannin/compat`](https://www.npmjs.com/package/@tannin/compat) as a drop-in replacement for Jed.

```js
import Jed from '@tannin/compat';

const i18n = new Jed( {
	locale_data: {
		the_domain: {
			'': {
				domain: 'the_domain',
				lang: 'en',
				plural_forms: 'nplurals=2; plural=(n != 1);',
			},
			example: [ 'singular translation', 'plural translation' ],
		},
	},
	domain: 'the_domain',
} );

i18n.translate( 'example' ).fetch();
// ⇒ 'singular translation'
```

## Benchmarks

The following benchmarks are performed in Node 10.16.0 on a MacBook Pro (2019), 2.4 GHz 8-Core Intel Core i9, 32 GB 2400 MHz DDR4 RAM.

```
Singular
---
Tannin x 216,670,213 ops/sec ±0.73% (90 runs sampled)
Tannin (Optimized Default) x 219,477,869 ops/sec ±0.32% (96 runs sampled)
Jed x 58,730,499 ops/sec ±0.34% (96 runs sampled)


Singular (Untranslated)
---
Tannin x 75,835,743 ops/sec ±1.26% (96 runs sampled)
Tannin (Optimized Default) x 76,474,169 ops/sec ±0.61% (92 runs sampled)
Jed x 241,632 ops/sec ±0.73% (96 runs sampled)


Plural
---
Tannin x 7,108,006 ops/sec ±0.96% (95 runs sampled)
Tannin (Optimized Default) x 51,658,190 ops/sec ±1.25% (94 runs sampled)
Jed x 236,797 ops/sec ±0.98% (97 runs sampled)
```

To run benchmarks on your own machine:

```
git clone https://github.com/aduth/tannin.git
cd tannin
npm install
node packages/tannin/benchmark
```

## License

Copyright 2019-2020 Andrew Duthie

Released under the [MIT License](https://opensource.org/licenses/MIT).
