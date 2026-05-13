#!/usr/bin/env node
/* global process */

/**
 * Thin wrapper around the strip-unminified-prod library. Runs against the
 * `build/` directory in the current working directory, emits a one-line
 * summary, and exits.
 *
 * See `strip-unminified-prod-lib.js` for context and behaviour details.
 */

const path = require( 'path' );
const { strip } = require( './strip-unminified-prod-lib.js' );

const buildDir = path.join( process.cwd(), 'build' );
const { deletedFiles, patchedFiles, skipped } = strip( buildDir );

if ( skipped ) {
	// eslint-disable-next-line no-console
	console.log( `[strip-unminified-prod] no build/ at ${ buildDir }, skipping.` );
} else if ( deletedFiles || patchedFiles ) {
	// eslint-disable-next-line no-console
	console.log(
		`[strip-unminified-prod] removed ${ deletedFiles } unminified file(s); patched ${ patchedFiles } PHP loader(s).`
	);
}
