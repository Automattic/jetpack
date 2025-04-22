import eslintConfigTargetEs from '@automattic/eslint-config-target-es/flat/language';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default [
	{
		name: 'Global files',
		files: [ '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs', '**/*.ts', '**/*.tsx', '**/*.svelte' ],
	},
	eslintConfigTargetEs,
	{
		languageOptions: {
			parser: typescriptEslint.parser,
			globals: {
				...globals.browser,
				...globals.jquery,
			},
			ecmaVersion: 'latest',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	},
];
