// @ts-ignore
import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		files: [ '**/*.ts', '**/*.tsx' ],
		plugins: {
			'@typescript-eslint': true,
			jsdoc: true,
		},
		rules: {
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-check': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
		},
	},
];
