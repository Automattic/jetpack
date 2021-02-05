/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import execa from 'execa';
import Listr from 'listr';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForGenerate } from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/readJson';
import { normalizeGenerateArgv } from '../helpers/normalizeArgv';

/**
 * Relays commands to generate a particular project
 *
 * @param {object} options - The argv options.
 */
async function generateRouter( options ) {
	normalizeGenerateArgv( options );
	console.log( options );

	//Route the project to the correct function to be built here.
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function generateCli( argv ) {
	argv = await promptForGenerate( argv );
	await generateRouter( argv );
}

/** */

/**
 * Command definition for the generate subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the generate commands defined.
 */
export function generateDefine( yargs ) {
	yargs.command(
		'generate [project]',
		'Creates a new project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project being worked on, e.g. package, plugin, etc',
					type: 'string',
				} )
				.options( 'name', {
					alias: 'n',
					describe: 'Name of the project',
					type: 'string',
				} );
		},
		async argv => {
			await generateCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}
