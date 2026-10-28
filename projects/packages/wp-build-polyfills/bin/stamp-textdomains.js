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

const path = require( 'path' );
const { resolveTextdomain } = require( './package-textdomain-lib.js' );
const { stampDir, writeI18nManifest } = require( './stamp-textdomains-lib.js' );

const args = process.argv.slice( 2 );
const getFlag = name => {
	const i = args.indexOf( `--${ name }` );
	return i >= 0 ? args[ i + 1 ] : undefined;
};

const domain = resolveTextdomain( getFlag( 'domain' ), 'stamp-textdomains' );
const buildDir = path.resolve( getFlag( 'dir' ) || 'build' );
// CI starts cold, and the e2e build artifact would otherwise ship the cache files.
const cacheDir =
	args.includes( '--no-cache' ) || process.env.CI
		? undefined
		: path.resolve( 'node_modules', '.cache', 'stamp-textdomains' );
const { count, reused, stringBearing } = stampDir( buildDir, domain, { cacheDir } );
const bundles = writeI18nManifest( buildDir, stringBearing );
// eslint-disable-next-line no-console
console.log(
	`stamp-textdomains: stamped "${ domain }" onto ${ count } file(s) in ${ buildDir } (${ reused } reused from cache); ${ bundles.length } string-bearing bundle(s) listed in the i18n manifest`
);
