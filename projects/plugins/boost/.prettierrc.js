module.exports = {
	...require( '../../../.prettierrc.js' ),
	plugins: [ require.resolve( 'prettier-plugin-svelte' ) ],
	svelteStrictMode: false,
	svelteIndentScriptAndStyle: true,
};
