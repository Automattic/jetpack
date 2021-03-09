const config = {
	presets: [ require.resolve( '@automattic/calypso-build/babel/default' ) ],
	overrides: [
		{
			test: './extensions/',
			presets: [ require.resolve( '@automattic/calypso-build/babel/wordpress-element' ) ],
		},
		{
			// Transpile ES Modules syntax (`import`) in config files (but not elsewhere)
			test: [ './gulpfile.babel.js', './tools/webpack.config.js', './tools/builder/' ],
			presets: [
				[ require.resolve( '@automattic/calypso-build/babel/default' ), { modules: 'commonjs' } ],
			],
		},
		{
			test: './modules/search/instant-search',
			presets: [ require.resolve( './modules/search/instant-search/babel.config.js' ) ],
		},
	],
	env: {
		test: {
			presets: [ [ '@babel/preset-env', { targets: { node: 'current' } } ] ],
			plugins: [ '@babel/plugin-transform-runtime' ],
		},
	},
};

module.exports = config;
