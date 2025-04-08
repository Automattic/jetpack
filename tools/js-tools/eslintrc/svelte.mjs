import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteEslintParser from 'svelte-eslint-parser';
import typescriptEslint from 'typescript-eslint';

export default [
	...eslintPluginSvelte.configs[ 'flat/recommended' ],
	{
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
	...typescriptEslint.config( {
		files: [ '**/*.svelte' ],
		extends: [ typescriptEslint.configs.recommended ],
	} ),
	{
		files: [ '**/*.svelte' ],
		languageOptions: {
			parser: svelteEslintParser,
			parserOptions: {
				parser: typescriptEslint.parser,
			},
		},
	},
];
