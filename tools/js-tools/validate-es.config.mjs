import eslintConfigTargetEs from '@automattic/eslint-config-target-es/flat/language';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import { javascriptFiles } from './eslintrc/files.mjs';

export default defineConfig(
	{
		name: 'Global files',
		files: javascriptFiles,
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
	}
);
