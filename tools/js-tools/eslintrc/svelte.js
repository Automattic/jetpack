module.exports = {
	extends: [ './preload', 'plugin:svelte/recommended' ],
	parserOptions: {
		extraFileExtensions: [ '.svelte' ],
	},
	overrides: [
		{
			files: [ '*.svelte' ],
			extends: [ './typescript' ],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: require.resolve( '@typescript-eslint/parser' ),
			},
		},
	],
	rules: {
		// This rule is for React projects; it prevents components which are not
		// yet mounted in the DOM from attaching to the window directly. Not
		// relevant in a svelte project.
		// Ref: https://github.com/WordPress/gutenberg/pull/26810
		'@wordpress/no-global-event-listener': 0,
	},
};
