module.exports = {
	...require( '@wordpress/prettier-config' ),
	plugins: [ 'prettier-plugin-svelte' ],
	svelteStrictMode: false,
	svelteBracketNewLine: true,
	svelteIndentScriptAndStyle: true,
};
