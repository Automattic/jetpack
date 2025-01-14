import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url, {
		envs: [ 'browser', 'jquery' ],
	} ),
	{
		languageOptions: {
			globals: {
				_: false,
				Backbone: false,
				wp: false,
			},
		},
		rules: {
			// Files here are not transpiled. Turn off a bunch of rules.
			'no-var': 'off',
			'prefer-const': 'off',
			'no-alert': 'off',
			strict: 'off',
			'no-eval': 'off',
			'no-new': 'off',
			'@wordpress/no-global-active-element': 'off',
			'@wordpress/no-global-get-selection': 'off',

			'jsdoc/require-jsdoc': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/check-tag-names': 'off',
			'jsdoc/check-types': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-hyphen-before-param-description': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-description': 'off',
			'jsdoc/require-returns-type': 'off',
			'jsdoc/no-undefined-types': 'off',
			'jsdoc/check-param-names': 'off',
		},
	},
];
