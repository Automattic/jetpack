/**
 * Mangle calypso-build's babel preset to work around some problems.
 *
 * - Set `absoluteRuntime` true for `@babel/plugin-transform-runtime`.
 * - Remove the broken `babel-plugin-optimize-i18n`.
 *
 * @param {string|Function} preset - The preset being wrapped.
 * @returns {Function} The wrapped preset-function.
 */
function overrideCalypsoBuildPreset( preset ) {
	if ( 'string' === typeof preset ) {
		preset = require( preset );
	}
	return ( api, opts ) => {
		const ret = preset( api, opts );
		// Override the configuration for @babel/plugin-transform-runtime to set absoluteRuntime true.
		// This prevents it from blowing up when other workspace projects are symlinked.
		ret.plugins.forEach( p => {
			if ( Array.isArray( p ) && /[\\/]@babel[\\/]plugin-transform-runtime[\\/]/.test( p[ 0 ] ) ) {
				p[ 1 ].absoluteRuntime = true;
			}
		} );
		ret.plugins = ret.plugins.filter(
			p => ! ( typeof p === 'string' && p.endsWith( '/babel-plugin-optimize-i18n.js' ) )
		);
		return ret;
	};
}

const config = {
	presets: [ overrideCalypsoBuildPreset( '@automattic/calypso-build/babel/default' ) ],
	plugins: [ '@babel/plugin-proposal-nullish-coalescing-operator' ],
	overrides: [
		{
			test: './extensions/',
			presets: [ require.resolve( '@automattic/calypso-build/babel/wordpress-element' ) ],
		},
		{
			// Transpile ES Modules syntax (`import`) in config files (but not elsewhere)
			test: [ './gulpfile.babel.js', './tools/webpack.config.js', './tools/builder/' ],
			presets: [
				[
					overrideCalypsoBuildPreset( '@automattic/calypso-build/babel/default' ),
					{ modules: 'commonjs' },
				],
			],
		},
		{
			test: './modules/search/instant-search',
			presets: [ overrideCalypsoBuildPreset( './modules/search/instant-search/babel.config.js' ) ],
		},
		{
			test: './modules/search/customberg',
			presets: [ overrideCalypsoBuildPreset( './modules/search/customberg/babel.config.js' ) ],
		},
	],
	env: {
		test: {
			presets: [ [ require.resolve( '@babel/preset-env' ), { targets: { node: 'current' } } ] ],
			plugins: [
				[ require.resolve( '@babel/plugin-transform-runtime' ), { absoluteRuntime: true } ],
			],
		},
	},
};

module.exports = config;
