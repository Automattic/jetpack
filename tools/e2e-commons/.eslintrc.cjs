const loadIgnorePatterns = require( '../../tools/js-tools/load-eslint-ignore.js' );

// .eslintrc.js
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:playwright/playwright-test' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		requireConfigFile: false,
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
