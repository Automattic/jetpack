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
@use '@automattic/jetpack-base-styles/style';
```

To make that work with [`sass`](https://www.npmjs.com/package/sass) NPM modules without Webpack, you'd have to use [loadPaths](https://sass-lang.com/documentation/js-api/interfaces/options/#loadPaths) or [includePaths](https://sass-lang.com/documentation/js-api/interfaces/legacyfileoptions/#includePaths):

```json
{
	"loadPaths": [ "node_modules" ]
}
```
