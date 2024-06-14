# eslint-config-target-es

ESLint shareable config to activate [eslint-plugin-es-x] checks based on [browserslist] browser targets and [MDN browser compatibility data].

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev eslint eslint-plugin-es-x @automattic/eslint-config-target-es
```

## Usage

First, you'll probably want to set up a [browserslist] configuration.

Then you can use this like any other sharable config in your `eslint.config.js` or `.eslintrc.*` file. Three configurations are offered.

* To check only for language features, such as nullish coalescing, use the 'language' config.
* To check only for builtins, such as Promise, WeakRef, and various features of RegExp, use the 'builtins' config.
* To check both, use the 'all' config.

For `eslint.config.js`, that might look like this:
```js
import eslintConfigTargetEs from '@automattic/eslint-config-target-es/flat/language';

export default [
	eslintConfigTargetEs,
	// etc
];
```

while for eslintrc you'd do like
```js
{
	extends: [ '@automattic/eslint-config-target-es/rc/language' ],
}
```

For backwards compatibility, the eslintrc configs may also be accessed without the `/rc/` path component (e.g. as `@automattic/eslint-config-target-es/language`), and `@automattic/eslint-config-target-es` is equivalent to `@automattic/eslint-config-target-es/rc/all`.

### Checking built files

If you want to check your built files to make sure you didn't omit transpiling any packages that need transpiling, you might create a `validate-es.config.js` like this
```js
module.exports = {
	root: true,
	extends: [ '@automattic/eslint-config-target-es/rc/language' ],
	env: {
		// Whatever environments you need.
	},
};
```
and then run eslint like
```
eslint --no-eslintrc --no-inline-config --config validate-es.config.js --no-ignore build/
```
to avoid your standard eslintrc and eslintignore and to avoid errors from any inline directives.

Something similar can be done for flat config.

### Advanced usage

You can import or require `@automattic/eslint-config-target-es/functions` to gain access to some functions that can be used to build your own configuration.

As browserslist and MDN use different browser codes, `getAllBrowsers( { query: } )` will take a browserslist query and return an object with the MDN browser codes and the matched versions for each.

`getRules( { query:, builtins: } )` will return the rules config. Set `builtins` true for "builtins", false for "language", or null/undefined for "all".

### Caveats

Some browsers supported by browserslist are not availble in the MDN data (e.g. Opera Mini) or are no longer being updated (e.g. Internet Explorer). In cases like these where no data is available, features are assumed to be supported. Set the environment variable `DEBUG=@automattic/eslint-config-target-es:warn` to generate messages when this happens.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

eslint-config-target-es is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

--

[eslint-plugin-es-x]: https://www.npmjs.com/package/eslint-plugin-es-x
[browserslist]: https://www.npmjs.com/package/browserslist
[MDN browser compatibility data]: https://www.npmjs.com/package/@mdn/browser-compat-data
