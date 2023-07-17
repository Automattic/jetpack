#!/usr/bin/env node

import process from 'process';
import { fileURLToPath } from 'url';

/**
 * Async import with better error handling.
 *
 * @param {string} path - Path to import from.
 * @returns {*} - Return from `import()`.
 */
async function guardedImport( path ) {
	try {
		return await import( path );
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
}

const { checkCliLocation, compareToolVersions } = await guardedImport(
	'../helpers/checkEnvironment.js'
);

/**
 * Checks for executing the CLI within a different monorepo checkout.
 */
try {
	await checkCliLocation();
} catch ( error ) {
	console.error( error );
	console.error( 'Something unexpected happened. See error above.' );
	process.exit( 1 );
}

/**
 * Standardizes the cwd for the process. Allows `jetpack` cli to run correctly from any location in the repo.
 */
process.chdir( fileURLToPath( new URL( '../../..', import.meta.url ) ) );

/**
 * Checks to make sure we're on the right version of various tools.
 */
try {
	if ( ! ( await compareToolVersions() ) && ! process.env.JETPACK_CLI_IGNORE_VERSION_CHECKS ) {
		console.error( '(Ignore the above errors by setting JETPACK_CLI_IGNORE_VERSION_CHECKS=1)' );
		process.exit( 1 );
	}
} catch ( error ) {
	console.error( error );
	console.error( 'Something unexpected happened. See error above.' );
	process.exit( 1 );
}

const cliRouter = await guardedImport( '../cliRouter.js' );
cliRouter.cli();
