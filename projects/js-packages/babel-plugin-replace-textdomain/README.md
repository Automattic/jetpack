# babel-plugin-replace-textdomain

A Babel plugin to replace the textdomain in gettext-style function calls.

This may be useful when using node modules for code-sharing among multiple applications (e.g. WordPress plugins), so each application's bundle uses a consistent textdomain throughout.

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev @automattic/babel-plugin-replace-textdomain
```

## Usage

In your Babel config, you might include the plugin something like this:
```json
{
	"plugins": [
		[ "@automattic/babel-plugin-replace-textdomain", { "textdomain": "new-domain" } ]
	]
}
```

Plugin options are:

- `textdomain`: Specify the replacement text domain. The value may be a string, which will replace all domains; an object, to map specific domains (leaving any others untouched); or a function, which will be passed the existing domain (empty string if the domain is missing entirely) and is expected to return the new domain (or null).
- `functions`: Specify the functions that take domain arguments. This is an object mapping function names to the (zero-based) index of the domain argument.

  The default function list handles the `__`, `_x`, `_n`, and `_nx` functions provided by [@wordpress/i18n]. This list may be accessed as `require( '@automattic/babel-plugin-replace-textdomain' ).defaultFunctions`.

To report instances of the specified i18n functions called without a domain or with an improper value for the domain, set the `DEBUG` environment variable to include `@automattic/babel-plugin-replace-textdomain`.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

i18n-loader-webpack-plugin is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

[@wordpress/i18n]: https://www.npmjs.com/package/@wordpress/i18n
