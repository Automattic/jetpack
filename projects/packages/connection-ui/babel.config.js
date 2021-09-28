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
};

module.exports = config;
