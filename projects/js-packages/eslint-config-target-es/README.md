# eslint-config-target-es

ESLint shareable config to activate [eslint-plugin-es] checks based on [browserslist] browser targets and [MDN browser compatibility data].

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev eslint eslint-plugin-es @automattic/eslint-config-target-es
```

## Usage

First, you'll probably want to set up a [browserslist] configuration.

Then you can use this like any other sharable config in your `.eslintrc.*` file. Three configurations are offered.

To check only for language features, such as nullish coalescing, your eslintrc might look like
```js
{
	extends: [ '@automattic/eslint-config-target-es/language' ],
}
```

To check only for builtins, such as Promise, WeakRef, and various features of RegExp, your eslintrc might look like
```js
{
	extends: [ '@automattic/eslint-config-target-es/builtins' ],
}
```

To check both, your eslintrc might look like
```js
{
	extends: [ '@automattic/eslint-config-target-es/all' ],
}
```

For least surprise, omitting any suffix is the same as `/all`.

### Checking built files

If you want to check your built files to make sure you didn't omit transpiling any packages that need transpiling, you might create a `validate-es.config.js` like this
```js
module.exports = {
	root: true,
	extends: [ '@automattic/eslint-config-target-es/language' ],
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

### Advanced usage

You can import or require `@automattic/eslint-config-target-es/functions` to gain access to some functions that can be used to build your own configuration.

As browserslist and MDN use different browser codes, `getBrowsers( { query: } )` will take a browserslist query and return an object with the MDN browser codes and the minimum matched version for each.

`getRules( { query:, builtins: } )` will return the rules config. Set `builtins` true for "builtins", false for "language", or null/undefined for "all".

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

eslint-config-target-es is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

--

[eslint-plugin-es]: https://www.npmjs.com/package/eslint-plugin-es
[browserslist]: https://www.npmjs.com/package/browserslist
[MDN browser compatibility data]: https://www.npmjs.com/package/@mdn/browser-compat-data
