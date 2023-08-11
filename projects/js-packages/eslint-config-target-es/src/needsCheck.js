const mdn = require( '@mdn/browser-compat-data' );
const debug = require( 'debug' );
const semver = require( 'semver' );
const rulesMap = require( './rulesMap.js' );

const warn = debug( '@automattic/eslint-config-target-es:warn' );
const debuglog = debug( '@automattic/eslint-config-target-es:debug' );

/**
 * Test if a rule needs to be checked.
 *
 * @param {string} rule - Rule.
 * @param {object} browsers - Browsers targeted.
 * @param {object} options - Options.
 * @param {boolean|null} options.builtins - If true, only rules with "javascript.builtins" paths are checked. If false, such rules are not checked. If null/undefined, all may be checked.
 * @returns {boolean} Whether the rule needs to be checked.
 */
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

	const semver000 = semver.coerce( '0.0.0' );

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
				warn( `No support data for ${ browser } for rule ${ rule } (${ path }), skipping` );
				continue browser;
			}

			const supports = Array.isArray( data.__compat.support[ browser ] )
				? data.__compat.support[ browser ]
				: [ data.__compat.support[ browser ] ];
			const vers = Array.isArray( browsers[ browser ] )
				? browsers[ browser ]
				: [ browsers[ browser ] ];

			version: for ( const ver of vers ) {
				const results = [];
				support: for ( const support of supports ) {
					if ( support.version_added === null ) {
						continue support;
					}

					if ( support.version_added === false ) {
						results.push( 'no support' );
						continue support;
					}
					if ( support.version_added === 'preview' ) {
						results.push( 'added version is "preview"' );
						continue support;
					}

					let added, removed;
					if ( support.version_added === true ) {
						added = semver000;
					} else {
						added = support.version_added.startsWith( '≤' )
							? semver000
							: semver.coerce( support.version_added );
					}
					if ( support.version_removed === true ) {
						removed = semver000;
					} else if (
						typeof support.version_removed === 'string' &&
						support.version_removed !== 'preview'
					) {
						removed = support.version_removed.startsWith( '≤' )
							? semver000
							: semver.coerce( support.version_removed );
					}

					const range = removed ? `${ added } – <${ removed }` : `>= ${ added }`;

					if ( semver.gt( added, ver ) || ( removed && semver.lte( removed, ver ) ) ) {
						results.push( `outside range ${ range }` );
					} else if ( support.partial_implementation ) {
						results.push( `partial implementation for ${ range }` );
					} else if ( support.prefix ) {
						results.push( `prefixed implementation for ${ range }` );
					} else if ( support.alternative_name ) {
						results.push( `alternatively named implementation for ${ range }` );
					} else if ( support.flags ) {
						results.push( `flagged implementation for ${ range }` );
					} else {
						// It's good! Check the next version.
						continue version;
					}
				}

				// If there was no support data at all...
				if ( results.length === 0 ) {
					warn( `No support data for ${ browser } for rule ${ rule } (${ path }), skipping` );
					continue browser;
				}

				// If no support entry hit the "It's good" case, it's no good. Log the reasons.
				// If there are reasons other than "outside range", skip any "outside range" as irrelevant.
				let results2 = results.filter( v => ! v.startsWith( 'outside range' ) );
				if ( results2.length === 0 ) {
					results2 = results;
				}
				debuglog(
					`${ browser } ${ ver } needs check for ${ rule } (${ path }); ${ results2.join( '; ' ) }`
				);
				return true;
			}
		}
	}

	return false;
}

module.exports = {
	needsCheck,
};
