const config = {
	presets: [ require.resolve( '@automattic/calypso-build/babel/default' ) ],
	overrides: [
		{
			test: './extensions/',
			presets: [ require.resolve( '@automattic/calypso-build/babel/wordpress-element' ) ],
		},
	],
	env: {
		test: {
			presets: [ [ '@babel/preset-env', { targets: { node: 'current' } } ] ],
		},
	},
};

module.exports = config;
