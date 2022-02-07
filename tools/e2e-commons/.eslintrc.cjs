const loadIgnorePatterns = require( '../../tools/js-tools/load-eslint-ignore.js' );

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
		'arrow-parens': [ 0, 'as-needed' ],
		'no-console': 0,
		'jest/no-done-callback': 0,
		'jest/no-disabled-tests': 0,
	},
};
