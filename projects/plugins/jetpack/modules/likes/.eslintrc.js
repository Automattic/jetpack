// eslint-disable-next-line
module.exports = {
	root: true,
	extends: [ 'eslint:recommended' ],
	env: {
		browser: true,
		es6: true,
		jquery: false,
	},
	globals: {
		_: false,
		Backbone: false,
		// jQuery: false,
		wp: false,
	},
	parserOptions: {
		ecmaVersion: 2019,
	},
	rules: {
		// TODO: maybe fix the above warnings
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
		// 'one-var': [ 'error', 'always' ],
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
