/**
 * A babel preset wrapper to set @babel/plugin-transform-runtime's absoluteRuntime to true.
 *
 * @param {string|Function} preset - The preset being wrapped.
 * @returns {Function} The wrapped preset-function.
 */
function presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime( preset ) {
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
		return ret;
	};
}

const config = {
	presets: [
		presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime(
			'@automattic/calypso-build/babel/default'
		),
	],
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
					presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime(
						'@automattic/calypso-build/babel/default'
					),
					{ modules: 'commonjs' },
				],
			],
		},
		{
			test: './modules/search/instant-search',
			presets: [
				presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime(
					'./modules/search/instant-search/babel.config.js'
				),
			],
		},
		{
			test: './modules/search/customberg',
			presets: [
				presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime(
					'./modules/search/customberg/babel.config.js'
				),
			],
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
