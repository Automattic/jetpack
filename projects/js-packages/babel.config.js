const config = {
	presets: [ require.resolve( '@automattic/calypso-build/babel/default' ) ],
	env: {
		test: {
			presets: [ [ '@babel/preset-env', { targets: { node: 'current' } } ] ],
			plugins: [ '@babel/plugin-transform-runtime' ],
		},
	},
};

module.exports = config;
