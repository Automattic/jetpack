/* global process */

/**
 * Text-domain resolution shared by the bins that run from a package
 * directory: an explicit `--domain` wins, otherwise `extra.textdomain` from
 * the package's composer.json.
 */

const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Resolve the text domain a bin should use.
 *
 * @param {string|undefined} argDomain - Value passed via `--domain`, if any.
 * @param {string}           binName   - The calling bin, named in the error.
 * @param {string}           [cwd]     - Package directory holding composer.json.
 * @return {string} The resolved text domain.
 */
function resolveTextdomain( argDomain, binName, cwd = process.cwd() ) {
	if ( argDomain ) {
		return argDomain;
	}
	const composerFile = path.join( cwd, 'composer.json' );
	if ( fs.existsSync( composerFile ) ) {
		const composer = JSON.parse( fs.readFileSync( composerFile, 'utf8' ) );
		const domain = composer.extra && composer.extra.textdomain;
		if ( typeof domain === 'string' && domain !== '' ) {
			return domain;
		}
	}
	throw new Error(
		`${ binName }: no text domain. Pass --domain or set extra.textdomain in composer.json.`
	);
}

module.exports = { resolveTextdomain };
