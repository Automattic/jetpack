const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

// .eslintrc.js
module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/esnext',
		'plugin:playwright/playwright-test',
		'prettier',
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		requireConfigFile: false,
	},
	env: {
		node: true,
	},
	globals: {
		wp: true,
		jpConnect: true,
	},
	rules: {
		'no-console': 0,
	},
};
