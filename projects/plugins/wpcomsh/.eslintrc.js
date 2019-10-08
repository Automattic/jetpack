module.exports = {
	root: true,
	extends: [ 'plugin:jest/recommended', 'prettier' ],
	overrides: [],
	env: {
		browser: true,
		jest: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	globals: {},
	plugins: [ 'jest', 'import' ],
	settings: {},
	rules: {
		'jest/no-disabled-tests': 'warn',
		'jest/no-focused-tests': 'error',
		'jest/no-identical-title': 'error',
		'jest/prefer-to-have-length': 'warn',
		'jest/valid-expect': 'error',
	},
};
