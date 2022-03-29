module.exports = {
	...require( '../../../.prettierrc.js' ),
	plugins: [ 'prettier-plugin-svelte' ],
	svelteStrictMode: false,
	svelteBracketNewLine: true,
	svelteIndentScriptAndStyle: true,
	svelteSortOrder: 'options-scripts-styles-markup',
	overrides: [
		{
			files: '*.svelte',
			options: { parser: 'svelte' },
		},
	],
};
