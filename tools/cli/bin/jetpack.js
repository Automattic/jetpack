#!/usr/bin/env node

/**
 * External dependencies
 */
import process from 'process';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import * as cliRouter from '../cliRouter.js';

/**
 * Standardizes the cwd for the process. Allows `jetpack` cli to run correctly from any location in the repo.
 */

process.chdir( fileURLToPath( new URL( '../../..', import.meta.url ) ) );

try {
	cliRouter.cli();
} catch ( error ) {
	if ( error.code === 'MODULE_NOT_FOUND' ) {
		// if pnpm install hasn't been run, esm require will fail here.
		console.error(
			'Something is missing from your install. Please run `pnpm install` and try again.'
		);
	} else {
		console.error( error );
		console.error( 'Something unexpected happened. See error above.' );
	}
	process.exit( 1 );
}
