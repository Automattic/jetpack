// @ts-ignore
import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		rules: {
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-check': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
		},
	},
];
