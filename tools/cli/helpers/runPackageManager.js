import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import { projectDir } from './install.js';
import { projectTypes } from './projectHelpers.js';

/**
 * Run a package-manager command in the monorepo root or a specific project directory.
 *
 * @param {object} options              - Configuration for the package manager.
 * @param {string} options.command      - The CLI command name (e.g. 'composer', 'pnpm').
 * @param {string} options.requiredFile - File that must exist in the target directory (e.g. 'composer.json').
 */
export async function runPackageManager( { command, requiredFile } ) {
	// Extract raw args from process.argv rather than yargs-parsed argv, because
	// yargs consumes flags it recognizes (e.g. --verbose) and can mangle others
	// (e.g. --no-dev). Reading process.argv ensures all flags pass through untouched.
	const allArgs = process.argv.slice( 2 );
	const cmdIdx = allArgs.indexOf( command );
	const rawArgs = allArgs.slice( cmdIdx + 1 );

	// Determine if the first arg is a project.
	const isProjectArg =
		rawArgs.length > 0 &&
		( rawArgs[ 0 ] === 'monorepo' || projectTypes.some( t => rawArgs[ 0 ].startsWith( t + '/' ) ) );
	const project = isProjectArg ? rawArgs[ 0 ] : 'monorepo';
	const cmdArgs = isProjectArg ? rawArgs.slice( 1 ) : rawArgs;
	const cwd = projectDir( project );

	// Validate the target directory has the required file.
	if ( ( await fs.access( path.join( cwd, requiredFile ) ).catch( () => false ) ) === false ) {
		console.error( chalk.red( `No ${ requiredFile } found in project ${ project }` ) );
		process.exit( 1 );
	}

	try {
		const result = await execa( command, cmdArgs, {
			cwd,
			stdio: 'inherit',
			reject: false,
		} );
		process.exit( result.exitCode );
	} catch ( e ) {
		console.error( chalk.red( `Failed to run ${ command }: ${ e.message }` ) );
		process.exit( 1 );
	}
}
