import fs from 'fs/promises';
import chalk from 'chalk';
import { execa } from 'execa';
import { projectDir } from '../helpers/install.js';
import { projectTypes } from '../helpers/projectHelpers.js';

export const command = 'composer';
export const describe = 'Run Composer commands in the monorepo root or a specific project.';

/**
 * Options definition for the composer subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the composer commands defined.
 */
export function builder( yargs ) {
	return yargs
		.parserConfiguration( { 'unknown-options-as-args': true } )
		.strict( false )
		.usage(
			'$0 composer [args..]\n$0 composer <project> [args..]\n\n' +
				'Runs Composer at the monorepo root, or in a specific project directory.\n\n' +
				'Examples:\n' +
				'  $0 composer install --no-dev\n' +
				'  $0 composer phpcs:lint\n' +
				'  $0 composer plugins/jetpack phpunit\n' +
				'  $0 composer packages/connection install'
		);
}

/**
 * Entry point for the CLI.
 */
export async function handler() {
	// Extract raw args from process.argv after 'composer'.
	const allArgs = process.argv.slice( 2 );
	const composerIdx = allArgs.indexOf( 'composer' );
	const rawArgs = allArgs.slice( composerIdx + 1 );

	// Determine if the first arg is a project.
	let cwd;
	let composerArgs;

	if ( rawArgs.length > 0 && projectTypes.some( t => rawArgs[ 0 ].startsWith( t + '/' ) ) ) {
		const project = rawArgs[ 0 ];
		composerArgs = rawArgs.slice( 1 );
		cwd = projectDir( project );
	} else {
		composerArgs = rawArgs;
		cwd = projectDir( 'monorepo' );
	}

	// Validate the target directory has a composer.json.
	if ( ( await fs.access( cwd + '/composer.json' ).catch( () => false ) ) === false ) {
		console.error( chalk.red( `No composer.json found in ${ cwd }` ) );
		process.exit( 1 );
	}

	try {
		const result = await execa( 'composer', composerArgs, {
			cwd,
			stdio: 'inherit',
			reject: false,
		} );
		process.exit( result.exitCode );
	} catch ( e ) {
		console.error( chalk.red( `Failed to run composer: ${ e.message }` ) );
		process.exit( 1 );
	}
}
