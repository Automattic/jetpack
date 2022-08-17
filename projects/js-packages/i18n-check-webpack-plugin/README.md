# i18n-check-webpack-plugin

A Webpack plugin to check that WordPress i18n hasn't been mangled by Webpack optimizations.

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev @automattic/i18n-check-webpack-plugin
```

## Usage

This goes in the `plugins` section of your Webpack config, e.g.
```js
{
	plugins: [
		new I18nCheckWebpackPlugin(),
	],
};
```

Parameters recognized by the plugin are:

- `filter`: Allows for specifying which source modules to process for i18n strings. The default is to process all files with extensions `js`, `jsx`, `ts`, `tsx`, `cjs`, and `mjs`.

  The value may be a function, which will be passed the file path relative to [Webpack's context] and which should return true if the file should be processed, or a string or RegExp to be compared with the relative file path, or an array of such strings, RegExps, and/or functions.
- `expectDomain`: Set to the expected text domain that should be used in the output assets. If the assets use some other domain, an error will be generated.
- `warnOnly`: Set true to produce warnings rather than errors when issues are found.
- `extractorOptions`: Supply options for `GettextExtractor`.
   - `babelOptions`: Supply options for Babel.
   - `functions`: Supply a custom list of i18n functions to recognize.

## Known problematic code patterns

These are some code patterns that are known to cause translations to be mangled.

### Lost comments due to expression movement

To avoid the minifier dropping or misplacing the translator comments, it's best to keep the comment as close to the function call as possible. For example, in
```js
const a, b, c;

/* translators: This is a bad example. */
const example = __( 'Example', 'domain' );
```
the minifier will combine those into a single `const` statement and misplace the comment on the way. To fix it, move the comment to the variable declaration instead of the `const` statement:
```js
const a, b, c;

const
	/* translators: This is a good example. */
	example = __( 'Example', 'domain' );
```
In some cases even the assignment may be dropped. In that case, you can attach the comment directly to the function call, or inside a multi-line function call:
```js
const example =
	/* translators: This is a good example. */
	__( 'Example', 'domain' );

const example2 = __(
	/* translators: This is a good example. */
	'Example',
	'domain'
);

const example3 = __( /* translators: This won't work. The comment must be on a line after the `__(`. */ 'Example', 'domain' );
```

Similarly in jsx, a comment placed like this may wind up misplaced:
```js
<Tag
	/* translators: This is a bad example. */
	property={ __( 'Here's another example', 'domain' ) }
/>
```
Instead put it inside the property:
```js
<Tag
	property={
		/* translators: This is an example of how to do it right. */
		__( 'Here's another example', 'domain' )
	}
/>
```

### Conditional function call compaction

When a conditional calls the same function in each branch with only one argument different, Terser will transform it to a single call with the condition inside the argument. For example, either of these
```js
example = flag ? __( 'Flag is set', 'domain' ) : __( 'Flag is not set', 'domain' );
```
```js
if ( flag ) {
	example = __( 'Flag is set', 'domain' );
} else {
	example = __( 'Flag is not set', 'domain' );
}
```
will become
```js
example = __( flag ? 'Flag is set' : 'Flag is not set', 'domain' );
```
which will result in neither string being detected for translation.

You can fix this by making the calls less similar, for example by adding a dummy argument to one call
```js
example = flag ? __( 'Flag is set', 'domain' ) : __( 'Flag is not set', 'domain', /* dummy arg to avoid bad minification */ 0 );
```
or by specifying an unnecessary context in one call (or a different context in both)
```js
example = flag ? __( 'Flag is set', 'domain' ) : _x( 'Flag is not set', '', 'domain' );
```
```js
example = flag ? _x( 'Flag is set', 'Something', 'domain' ) : _x( 'Flag is not set', 'Something different', 'domain' );
```

### Pruned branches and common strings

In some cases, such as when `process.env.NODE_ENV` is tested or when ES module tree-shaking is done, code paths can be known to be unreachable. For example, only one branch in the following will be kept:
```js
if ( process.env.NODE_ENV === 'production' ) {
	console.log( __( 'This is production mode', 'domain' ) );
} else {
	console.log( __( 'This is development mode', 'domain' ) );
}
```
The plugin tries to detect this sort of thing and avoid reporting the translations from the pruned branch as having been mangled.
But this can fail if the relevant strings are still used untranslated:
```js
if ( value === 'foo' ) {
	if ( process.env.NODE_ENV === 'development' ) {
		console.log( __( 'Found a value', 'domain' ), __( 'foo', 'domain' ) );
	}
	// Then do some other stuff...
}
```
In production mode the one use of `__( 'foo', 'domain' )` is dropped, but the plugin will think it was only mangled because the string `'foo'` is still present.

You can fix this by including a unique context which will not appear elsewhere in the code:
```js
if ( value === 'foo' ) {
	if ( process.env.NODE_ENV === 'development' ) {
		console.log( __( 'Found a value', 'domain' ), _x( 'foo', 'The value "foo"', 'domain' ) );
	}
	// Then do some other stuff...
}
```

This can also happen if you use different translator comments for the same string in multiple places, whether in the same file or different files.
```js
export const usedFunction = v => {
	return sprintf(
		/* translators: A thing */
		__( 'Thing: %s', 'domain' ),
		v
	);
};

export const unusedFunction = v => {
	return sprintf(
		/* translators: A munged thing */
		__( 'Thing: %s', 'domain' ),
		munge( v )
	);
};
```
In that case a good fix would be to use identical translator comments for all instances of the string. Or, if the comments need to be different, that's a good sign you should be using `_x()` with differing contexts too.

## Caveats

Certain situations cannot be detected by the plugin:

* If the string is used in multiple places, and only one place is mangled, the mangling of that one place may not be detected.
* If the string literal itself is mangled, it may be considered as being in a pruned branch.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

i18n-check-webpack-plugin is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
