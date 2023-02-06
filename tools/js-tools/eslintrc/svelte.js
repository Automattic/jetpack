module.exports = {
	extends: [ './preload' ],
	parserOptions: {
		extraFileExtensions: [ '.svelte' ],
	},
	overrides: [
		{
			files: [ '*.svelte' ],
			processor: 'svelte3/svelte3',
			extends: [ './typescript' ],
		},
	],
	settings: {
		'svelte3/typescript': () => require( 'typescript' ),
	},
	plugins: [ 'svelte3' ],
	rules: {
		// This rule is for React projects; it prevents components which are not
		// yet mounted in the DOM from attaching to the window directly. Not
		// relevant in a svelte project.
		// Ref: https://github.com/WordPress/gutenberg/pull/26810
		'@wordpress/no-global-event-listener': 0,
	},
};
