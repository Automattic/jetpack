const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/jest' ),
		require.resolve( 'jetpack-js-tools/eslintrc/prettier' ),
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	overrides: [],
	env: {
		browser: true,
		jest: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	globals: {},
	settings: {},
	rules: {
		'jest/no-disabled-tests': 'warn',
		'jest/no-focused-tests': 'error',
		'jest/no-identical-title': 'error',
		'jest/prefer-to-have-length': 'warn',
		'jest/valid-expect': 'error',
	},
};
