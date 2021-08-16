# Base Styles

Base SCSS utilities and variables for Jetpack.

## Installation

Install the module

```bash
npm install @automattic/jetpack-base-styles --save-dev
```

## Use

### SCSS utilities and variables

In your application's SCSS file, include styles like so:

```scss
@import 'node_modules/@automattic/jetpack-base-styles/colors';
@import 'node_modules/@automattic/jetpack-base-styles/variables';
@import 'node_modules/@automattic/jetpack-base-styles/mixins';
@import 'node_modules/@automattic/jetpack-base-styles/breakpoints';
@import 'node_modules/@automattic/jetpack-base-styles/animations';
@import 'node_modules/@automattic/jetpack-base-styles/z-index';
@import 'node_modules/@automattic/jetpack-base-styles/default-custom-properties';
```

If you use [Webpack](https://webpack.js.org/) for your SCSS pipeline, you can use `~` to resolve to `node_modules`:

```scss
@import '~@automattic/jetpack-base-styles/colors';
```

To make that work with [`sass`](https://www.npmjs.com/package/sass) or [`node-sass`](https://www.npmjs.com/package/node-sass) NPM modules without Webpack, you'd have to use [includePaths option](https://sass-lang.com/documentation/js-api#includepaths):

```json
{
	"includePaths": [ "node_modules" ]
}
```