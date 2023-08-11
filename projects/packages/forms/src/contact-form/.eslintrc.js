/* eslint-env node */
const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [ 'eslint:recommended' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	env: {
		browser: true,
		jquery: true,
		es6: true,
	},
	globals: {
		_: false,
		Backbone: false,
		wp: false,
	},
	parserOptions: {
		ecmaVersion: 2019,
	},
	rules: {
		eqeqeq: 'warn',
		curly: 'warn',
		'no-console': 'warn',
		'no-empty': 'warn',
		'no-unused-vars': 'warn',
		'no-useless-escape': 0,
		'no-control-regex': 0,
		'no-unused-expressions': 'warn',

		'no-caller': 'error',
		'no-cond-assign': [ 'error', 'except-parens' ],
		'no-eq-null': 'error',
		'no-irregular-whitespace': 'error',
		'no-trailing-spaces': 'error',
		quotes: [ 'warn', 'single', { avoidEscape: true } ],
		'wrap-iife': [ 'error', 'any' ],

		// eslint 6.x migration
		'no-redeclare': 1,
		'no-prototype-builtins': 1,
		'no-shadow-restricted-names': 1,
		'no-undef': 1,
		'no-extra-boolean-cast': 1,
	},
};
