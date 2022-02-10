# remove-asset-webpack-plugin

A Webpack plugin to remove assets from the build.

This runs relatively late in the Webpack build, so derived assets may be included even if the parent asset is removed.
This may be useful if you're using [static-site-generator-webpack-plugin](https://www.npmjs.com/package/static-site-generator-webpack-plugin) to build static HTML while building scripts another way,
or if you're using Webpack to build SASS to CSS without any associated JS script.

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev @automattic/remove-asset-webpack-plugin
```

## Usage

This goes in the `plugins` section of your Webpack config, e.g.
```js
{
	plugins: [
		new RemoveAssetWebpackPlugin( {
			assets: [
				'foo.js',
				'foo.js.map',
			],
		},
	],
};
```

### Parameters

* `assets`: This specifies the assets to remove from the output. The value may be a string, RegExp, Function, or an array of the same.
  * If a string, the string specifies the asset name to remove from the output.
  * If a RegExp, any asset name matching the regex is removed.
  * If a Function, any asset for which the function returns true is removed. The function is passed two parameters: the name of the asset, and the asset itself.

If you want to debug asset removal, set environment variable `DEBUG` to include `@automattic/remove-asset-webpack-plugin`.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

eslint-config-target-es is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
