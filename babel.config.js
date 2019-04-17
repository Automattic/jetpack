const config = {
	extends: require.resolve( '@automattic/calypso-build/babel.config.js' ),
	overrides: [
		{
			test: './extensions/',
			presets: [ require( '@automattic/calypso-build/babel/wordpress-element' ) ],
		},
	],
	env: {
		test: {
			presets: [ [ '@babel/env', { targets: { node: 'current' } } ] ],
			// plugins: [ 'add-module-exports', 'babel-plugin-dynamic-import-node' ],
		},
	},
};

module.exports = config;
