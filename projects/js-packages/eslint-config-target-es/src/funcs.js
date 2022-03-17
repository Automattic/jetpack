const browserslist = require( 'browserslist' );
const debug = require( 'debug' );
const mdn = require( '@mdn/browser-compat-data' );
const semver = require( 'semver' );
const { rules: esRules } = require( 'eslint-plugin-es' );
const browsersMap = require( './browsersMap.js' );
const rulesMap = require( './rulesMap.js' );

const warn = debug( '@automattic/eslint-config-target-es:warn' );
const debuglog = debug( '@automattic/eslint-config-target-es:debug' );

/**
 * Get the list of supported browsers.
 *
 * @param {object} options - Options.
 * @param {string} options.query - Browserslist query.
 * @returns {object} Browsers mapped to versions.
 */
function getBrowsers( options = {} ) {
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
		if ( typeof browsers[ browser ] === 'undefined' || semver.lt( ver, browsers[ browser ] ) ) {
			browsers[ browser ] = ver;
		}
	}
	return browsers;
}

/**
 * Test if a rule needs to be checked.
 *
 * @param {string} rule - Rule.
 * @param {object} browsers - Browsers targeted.
 * @param {object} options - Options.
 * @param {boolean|null} options.builtins - If true, only rules with "javascript.builtins" paths are checked. If false, such rules are not checked. If null/undefined, all may be checked.
 * @returns {boolean} Whether the rule needs to be checked.
 */
// eslint-disable-next-line no-unused-vars
function needsCheck( rule, browsers, options = {} ) {
	let paths = rulesMap[ rule ];
	if ( paths === true || paths === false ) {
		return paths;
	}
	if ( ! Array.isArray( paths ) ) {
		paths = [ paths ];
	}

	if (
		options.builtins === false &&
		paths.some( path => path.startsWith( 'javascript.builtins.' ) )
	) {
		return false;
	}
	if (
		options.builtins === true &&
		! paths.some( path => path.startsWith( 'javascript.builtins.' ) )
	) {
		return false;
	}

	path: for ( const path of paths ) {
		let data = mdn;
		for ( const k of path.split( '.' ) ) {
			data = data[ k ];
			if ( ! data ) {
				warn( `Invalid feature map for rule ${ rule }: ${ path } does not exist` );
				continue path;
			}
		}
		if ( ! data.__compat || ! data.__compat.support ) {
			warn( `Invalid feature map for rule ${ rule }: No data at ${ path }` );
			continue path;
		}

		browser: for ( const browser of Object.keys( browsers ) ) {
			if ( ! data.__compat.support[ browser ] ) {
				debuglog( `No support data for ${ browser } for rule ${ rule } (${ path }), skipping` );
				continue browser;
			}
			let support = data.__compat.support[ browser ];
			if ( Array.isArray( support ) ) {
				support = support[ 0 ];
			}

			if ( support.version_added === null ) {
				debuglog( `No support data for ${ browser } for rule ${ rule } (${ path }), skipping` );
				continue browser;
			} else if ( support.version_added === false ) {
				debuglog( `${ browser } needs check for ${ rule } (${ path })` );
				return true;
			} else if ( support.version_added === true ) {
				continue browser;
			} else if ( semver.gt( semver.coerce( support.version_added ), browsers[ browser ] ) ) {
				debuglog(
					`${ browser } < ${ support.version_added } needs check for ${ rule } (${ path }); we have ${ browsers[ browser ] }`
				);
				return true;
			} else if ( support.partial_implementation ) {
				debuglog(
					`${ browser } needs check for ${ rule } (${ path }) due to partial implementation`
				);
				return true;
			}
		}
	}

	return false;
}

/**
 * Get the es rule configurations.
 *
 * @param {object} options - Options.
 * @param {boolean|null} options.builtins - If true, only rules with "javascript.builtins" paths are checked. If false, such rules are not checked. If null/undefined, all may be checked.
 * @param {string} options.query - Browserslist query.
 * @returns {object} Rules configuration.
 */
function getRules( options = {} ) {
	const browsers = getBrowsers( options );
	const ret = {};
	for ( const rule of Object.keys( esRules ) ) {
		ret[ `es/${ rule }` ] = needsCheck( rule, browsers, options ) ? 2 : 0;
	}
	return ret;
}

module.exports = {
	getBrowsers,
	getRules,
};
