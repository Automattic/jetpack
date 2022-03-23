/**
 * This is a workaround for a feature not available in ESLint, yet.
 *
 * @see https://github.com/eslint/eslint/issues/3458
 * @todo Remove this when the above feature is natively available in ESLint
 */
require( '@rushstack/eslint-patch/modern-module-resolution' );

module.exports = {
	parser: '@babel/eslint-parser',
	extends: [ 'plugin:jest/recommended' ],
	plugins: [ 'jest' ],
	env: {
		browser: true,
		es6: true,
		mocha: true,
		node: true,
		jquery: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2019,
		ecmaFeatures: {
			jsx: true,
		},
		requireConfigFile: false,
	},
	settings: {},
};
