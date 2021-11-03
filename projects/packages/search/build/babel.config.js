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
			test: '../src/instant-search',
			presets: [
				presetOverrideBabelPluginTransformRuntimeAbsoluteRuntime(
					'../src/instant-search/babel.config.js'
				),
			],
		},
	],
};

module.exports = config;
