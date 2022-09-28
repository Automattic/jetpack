module.exports = {
	...require( '../../../.prettierrc.js' ),
	plugins: [ require.resolve( 'prettier-plugin-svelte' ) ],
	svelteStrictMode: false,
	svelteBracketNewLine: true,
	svelteIndentScriptAndStyle: true,
	svelteSortOrder: 'options-scripts-styles-markup',
};
