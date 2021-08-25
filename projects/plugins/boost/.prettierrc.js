module.exports = {
	...require( '@wordpress/prettier-config' ),
	...require( '../../../.prettierrc'),
	plugins: [ 'prettier-plugin-svelte' ],
	svelteStrictMode: false,
	svelteBracketNewLine: true,
	svelteIndentScriptAndStyle: true,
};
