#!/usr/bin/env node
/* global process */

/**
 * Thin wrapper around the stamp-textdomains library. Run from a package
 * directory, it stamps that package's text domain onto every gettext call in
 * the built JS bundles so translations resolve at runtime.
 *
 * The domain is read from `composer.json` `extra.textdomain` in the current
 * working directory, or overridden with `--domain`. The build directory
 * defaults to `build`, overridable with `--dir`. Stamped results are cached in
 * `node_modules/.cache/stamp-textdomains` so rebuilds only re-stamp changed
 * bundles; `--no-cache` turns that off.
 *
 * See `stamp-textdomains-lib.js` for context and behaviour details.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { stampDir, writeI18nManifest } = require( './stamp-textdomains-lib.js' );

/**
 * Resolve the text domain to stamp: an explicit `--domain` wins, otherwise
 * `extra.textdomain` from composer.json in the current working directory.
 *
 * @param {string|undefined} argDomain - Value passed via `--domain`, if any.
 * @return {string} The resolved text domain.
 */
function getDomain( argDomain ) {
	if ( argDomain ) {
		return argDomain;
	}
	const composerFile = path.resolve( 'composer.json' );
	if ( fs.existsSync( composerFile ) ) {
		const composer = JSON.parse( fs.readFileSync( composerFile, 'utf8' ) );
		const domain = composer.extra && composer.extra.textdomain;
		if ( typeof domain === 'string' && domain !== '' ) {
			return domain;
		}
	}
	throw new Error(
		'stamp-textdomains: no text domain. Pass --domain or set extra.textdomain in composer.json.'
	);
}

const args = process.argv.slice( 2 );
const getFlag = name => {
	const i = args.indexOf( `--${ name }` );
	return i >= 0 ? args[ i + 1 ] : undefined;
};

const domain = getDomain( getFlag( 'domain' ) );
const buildDir = path.resolve( getFlag( 'dir' ) || 'build' );
const cacheDir = args.includes( '--no-cache' )
	? undefined
	: path.resolve( 'node_modules', '.cache', 'stamp-textdomains' );
const { count, reused, stringBearing } = stampDir( buildDir, domain, { cacheDir } );
const bundles = writeI18nManifest( buildDir, stringBearing );
// eslint-disable-next-line no-console
console.log(
	`stamp-textdomains: stamped "${ domain }" onto ${ count } file(s) in ${ buildDir } (${ reused } reused from cache); ${ bundles.length } string-bearing bundle(s) listed in the i18n manifest`
);
