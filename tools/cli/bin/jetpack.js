#!/usr/bin/env node

import process from 'process';
import { fileURLToPath } from 'url';
import { checkAnalyticsEnabled } from '../helpers/analytics.js';

/**
 * Async import with better error handling.
 *
 * @param {string} path - Path to import from.
 * @return {*} - Return from `import()`.
 */
async function guardedImport( path ) {
	try {
		return await import( path );
	} catch ( error ) {
		let { bold, dim } =
			( await import( 'chalk' ).then(
				m => ( { bold: m.chalkStderr?.bold, dim: m.chalkStderr?.dim } ),
				() => null
			) ) || {};
		bold ||= v => v;
		dim ||= v => `\n${ v.replace( /^/m, '  ' ) }`;

		if ( error.code === 'ERR_MODULE_NOT_FOUND' ) {
			// if pnpm install hasn't been run, the import() will fail here.
			console.error(
				bold(
					'*** Something is missing from your install. Please run `pnpm install` and try again. ***'
				)
			);
			console.error( dim( error.message ) );
		} else if (
			error.name === 'SyntaxError' &&
			( error.stack.match(
				/Named export '.+?' not found. The requested module '.+?' is a CommonJS module/
			) ||
				error.stack.match( /The requested module '.+?' does not provide an export named '.+?'/ ) )
		) {
			console.error(
				bold(
					'*** Perhaps you have outdated dependencies. Please run `pnpm install` and try again. ***'
				)
			);
			console.error( dim( error.message ) );
		} else {
			console.error( error );
			console.error( '' );
			console.error( bold( '*** Something unexpected happened. See error above. ***' ) );
		}
		process.exit( 1 );
	}
}

const { checkCliLocation, compareToolVersions } = await guardedImport(
	'../helpers/checkEnvironment.js'
);

// Shell completion (see `jetpack completion`) runs this on every TAB and reads stdout.
const isCompletion = process.argv.includes( '--get-yargs-completions' );

/**
 * Checks for executing the CLI within a different monorepo checkout.
 */
try {
	await checkCliLocation( { quiet: isCompletion } );
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
 * Check tool versions and the analytics preference. Skipped for shell completion, which runs on
 * every TAB and must not spawn pnpm, php and composer or print anything.
 */
if ( ! isCompletion ) {
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

	await checkAnalyticsEnabled();
}

const cliRouter = await guardedImport( '../cliRouter.js' );
cliRouter.cli();
