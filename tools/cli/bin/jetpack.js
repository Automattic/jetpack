#!/usr/bin/env node

/**
 * External dependencies
 */
import process from 'process';
import { fileURLToPath } from 'url';

/**
 * Standardizes the cwd for the process. Allows `jetpack` cli to run correctly from any location in the repo.
 */

process.chdir( fileURLToPath( new URL( '../../..', import.meta.url ) ) );

try {
	const cliRouter = await import( '../cliRouter.js' );
	cliRouter.cli();
} catch ( error ) {
	const identity = v => v;
	const chalk = await import( 'chalk' ).then(
		m => m.default,
		() => ( {} )
	);

	if ( error.code === 'ERR_MODULE_NOT_FOUND' ) {
		// if pnpm install hasn't been run, the import() will fail here.
		console.error(
			'Something is missing from your install. Please run `pnpm install` and try again.'
		);

		// Print the original error's message too, as sometimes the error isn't fixed by `pnpm install`.
		console.error(
			( chalk.grey || identity )( `The original error message was ${ error.message }` )
		);
	} else {
		console.error( error );
		console.error(
			( chalk.bold || identity )( 'Something unexpected happened. See error above.' )
		);
	}
	process.exit( 1 );
}
