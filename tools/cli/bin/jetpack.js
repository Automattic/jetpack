#!/usr/bin/env node

import process from 'process';
import { fileURLToPath } from 'url';
import { checkAnalyticsEnabled } from '../helpers/analytics.js';

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
		const bold =
			( await import( 'chalk' ).then(
				m => m.default?.stderr?.bold,
				() => null
			) ) || ( v => v );

		console.error( error );
		console.error( '' );
		if ( error.code === 'ERR_MODULE_NOT_FOUND' ) {
			// if pnpm install hasn't been run, the import() will fail here.
			console.error(
				bold(
					'*** Something is missing from your install. Please run `pnpm install` and try again. ***'
				)
			);
		} else {
			console.error( bold( '*** Something unexpected happened. See error above. ***' ) );
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
	if ( ! ( await compareToolVersions() ) && ! process.env.JETPACK_CLI_NONFATAL_VERSION_CHECKS ) {
		console.error(
			'(Continue despite the above errors by setting JETPACK_CLI_NONFATAL_VERSION_CHECKS=1)'
		);
		process.exit( 1 );
	}
} catch ( error ) {
	console.error( error );
	console.error( 'Something unexpected happened. See error above.' );
	process.exit( 1 );
}

/**
 * Check if the user has been asked to enable analytics tracking.
 */
await checkAnalyticsEnabled();

const cliRouter = await guardedImport( '../cliRouter.js' );
cliRouter.cli();
