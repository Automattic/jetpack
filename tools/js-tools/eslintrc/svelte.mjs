import { fileURLToPath } from 'node:url';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteEslintParser from 'svelte-eslint-parser';
import typescriptEslint from 'typescript-eslint';
import { defineConfig, javascriptFiles } from './base.mjs';

export default defineConfig(
	{
		files: javascriptFiles,
		extends: [ eslintPluginSvelte.configs[ 'flat/recommended' ] ],
	},
	{
		files: javascriptFiles,
		languageOptions: {
			parserOptions: {
				extraFileExtensions: [ '.svelte' ],
			},
		},
		rules: {
			// This rule is for React projects; it prevents components which are not
			// yet mounted in the DOM from attaching to the window directly. Not
			// relevant in a svelte project.
			// Ref: https://github.com/WordPress/gutenberg/pull/26810
			'@wordpress/no-global-event-listener': 'off',
		},
	},
	{
		files: [ '**/*.svelte' ],
		extends: [ typescriptEslint.configs.recommended ],
	},
	{
		files: [ '**/*.svelte' ],
		languageOptions: {
			parser: svelteEslintParser,
			parserOptions: {
				parser: typescriptEslint.parser,
			},
		},
		settings: {
			'import/parsers': {
				// Hack for the import of ts files from svelte.
				// Otherwise it tries to use the svelteEslintParser defined just above, which chokes on the TS code.
				[ fileURLToPath( new URL( './get-ts-parser.cjs', import.meta.url ) ) ]: javascriptFiles
					.map( v => v.replace( '**/*', '' ) )
					.filter( v => v !== '.svelte' ),
			},
		},
	}
);
