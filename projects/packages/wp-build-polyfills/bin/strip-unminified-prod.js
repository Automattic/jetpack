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

// --keep=<glob>[,<glob>…] (repeatable): unminified files to retain for i18n
// string extraction. See strip()'s docs for the glob semantics.
const keep = [];
for ( const arg of process.argv.slice( 2 ) ) {
	if ( arg.startsWith( '--keep=' ) ) {
		keep.push( ...arg.slice( '--keep='.length ).split( ',' ).filter( Boolean ) );
	} else {
		throw new Error( `[strip-unminified-prod] unknown argument: ${ arg }` );
	}
}

const buildDir = path.join( process.cwd(), 'build' );
const { deletedFiles, keptFiles, patchedFiles, skipped } = strip( buildDir, { keep } );

if ( skipped ) {
	// eslint-disable-next-line no-console
	console.log( `[strip-unminified-prod] no build/ at ${ buildDir }, skipping.` );
} else if ( deletedFiles || keptFiles || patchedFiles ) {
	const kept = keptFiles ? `; kept ${ keptFiles } for string extraction` : '';
	// eslint-disable-next-line no-console
	console.log(
		`[strip-unminified-prod] removed ${ deletedFiles } unminified file(s)${ kept }; patched ${ patchedFiles } PHP loader(s).`
	);
}
