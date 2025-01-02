/* eslint-disable import/no-extraneous-dependencies */
import makeBaseConfig, { typescriptFiles } from 'jetpack-js-tools/eslintrc/base.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		files: typescriptFiles,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: path.dirname( fileURLToPath( import.meta.url ) ),
				project: [ './tsconfig.json', './tsconfig.eslint.json' ],
			},
		},
	},
	{
		rules: {
			'import/no-extraneous-dependencies': 'error',

			'jsx-a11y/anchor-has-content': 'error',
			'jsx-a11y/anchor-is-valid': 'error',

			// Legacy rule changes. Ideally someone should go through and fix all these.
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/check-types': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-hyphen-before-param-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-type': 'off',

			'react/jsx-no-bind': 'off',
			'react-hooks/rules-of-hooks': 'off',

			'import/order': 'off',
			'no-nested-ternary': 'off',

			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', caughtErrors: 'none' },
			],
		},
	},
];
