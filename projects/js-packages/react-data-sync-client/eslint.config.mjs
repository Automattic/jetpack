import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		rules: {
			'jsdoc/check-alignment': 'off',
			'jsdoc/check-examples': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/check-param-names': 'off',
			'jsdoc/check-syntax': 'off',
			'jsdoc/check-tag-names': 'off',
			'jsdoc/check-types': 'off',
			'jsdoc/implements-on-classes': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-hyphen-before-param-description': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-name': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-check': 'off',
			'jsdoc/require-returns-description': 'off',
			'jsdoc/require-returns-type': 'off',
			'jsdoc/tag-lines': 'off',
			'jsdoc/valid-types': 'off',
			'jsdoc/check-values': 'off',
		},
	},
];
