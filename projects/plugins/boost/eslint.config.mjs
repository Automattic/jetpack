import {
	makeBaseConfig,
	defineConfig,
	javascriptFiles,
	typescriptFiles,
} from 'jetpack-js-tools/eslintrc/base.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
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
		files: javascriptFiles,
		rules: {
			'import/no-unresolved': [
				'error',
				{
					ignore: [
						// Image guide doesn't have a `jetpack:src` entry, so it needs to be built to work and may not be when linting.
						// And since it uses svelte, if we did want to add a `jetpack:src` entry then we'd also need to teach Boost's webpack config how to build svelte files. Sigh.
						// Easier to just ignore it for this rule.
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
