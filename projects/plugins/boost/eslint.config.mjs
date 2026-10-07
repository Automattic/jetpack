import {
	makeBaseConfig,
	defineConfig,
	javascriptFiles,
	typescriptFiles,
} from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	{
		files: typescriptFiles,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: [ './tsconfig.json', './tsconfig.eslint.json' ],
			},
		},
	},
	{
		files: javascriptFiles,
		rules: {
			'import/no-unresolved': [
				'error',
				{
					ignore: [
						// Image Guide exports built files, which may be absent when linting.
						'^@automattic/jetpack-image-guide$',
					],
				},
			],
		},
	},
	{
		files: javascriptFiles, // @todo Which of the rule changes here should only really apply to typescriptFiles?
		rules: {
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
	}
);
