const browserslist = require( 'browserslist' );
const debug = require( 'debug' );
const { rules: esRules } = require( 'eslint-plugin-es-x' );
const semver = require( 'semver' );
const browsersMap = require( './browsersMap.js' );
const { needsCheck } = require( './needsCheck.js' );

const warn = debug( '@automattic/eslint-config-target-es:warn' );

/**
 * Get the list of supported browsers.
 *
 * @param {object} options       - Options.
 * @param {string} options.query - Browserslist query.
 * @return {object} Browsers mapped to arrays of versions.
 */
function getAllBrowsers( options = {} ) {
	const browsers = {};
	for ( const b of browserslist( options.query ) ) {
		const m = b.match( /^([a-z_]+) (all|[0-9.]+)(-.*)?$/ );
		if ( ! m ) {
			throw new Error( `Unrecognized browser from browserslist: ${ b }` );
		}
		const browser = browsersMap[ m[ 1 ] ];
		if ( typeof browser === 'undefined' ) {
			warn( `Ignoring unknown browser code ${ m[ 1 ] }` );
			continue;
		}
		if ( browser === null ) {
			warn( `Ignoring browser code ${ m[ 1 ] }, we don't have usage data for it` );
			continue;
		}
		const ver = m[ 2 ] === 'all' ? '0.0.0' : semver.coerce( m[ 2 ] ).version;
		browsers[ browser ] ||= [];
		browsers[ browser ].push( ver );
		browsers[ browser ].sort( semver.compare );
	}
	return browsers;
}

/**
 * Get the list of supported browsers.
 *
 * @deprecated since 2.1.0. Use getAllBrowsers instead.
 * @param {object} options       - Options.
 * @param {string} options.query - Browserslist query.
 * @return {object} Browsers mapped to minimum versions.
 */
function getBrowsers( options = {} ) {
	warn( 'getBrowsers is deprecated. Use getAllBrowsers instead.' );
	const browsers = getAllBrowsers( options );
	const ret = {};
	for ( const k of Object.keys( browsers ) ) {
		ret[ k ] = browsers[ k ][ 0 ];
	}
	return ret;
}

/**
 * Get the es-x rule configurations.
 *
 * @param {object}       options          - Options.
 * @param {boolean|null} options.builtins - If true, only rules with "javascript.builtins" paths are checked. If false, such rules are not checked. If null/undefined, all may be checked.
 * @param {string}       options.query    - Browserslist query.
 * @return {object} Rules configuration.
 */
function getRules( options = {} ) {
	const browsers = getAllBrowsers( options );
	const ret = {};
	for ( const rule of Object.keys( esRules ) ) {
		ret[ `es-x/${ rule }` ] = needsCheck( rule, browsers, options ) ? 2 : 0;
	}
	return ret;
}

module.exports = {
	getAllBrowsers,
	getBrowsers,
	getRules,
};
