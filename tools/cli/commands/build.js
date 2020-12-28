/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';
import path from 'path';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
export async function build( options ) {
	options = {
		...options,
		project: options.project || false,
		targetDirectory: options.targetDirectory || process.cwd(),
	};

	switch ( options.project ) {
		case 'plugins/jetpack':
			log(
				chalkJetpackGreen(
					'Hell yeah! It is time to build Jetpack!\n' +
						'Go ahead and sit back. Relax. This will take a few minutes.'
				)
			);
			child_process.spawnSync( 'yarn', [ 'build' ], {
				cwd: path.resolve( 'projects/plugins/jetpack' ), // If I can get options.project to work...
				shell: true,
				stdio: 'inherit',
			} );
			break;
		case false:
			log( chalk.red( 'You did not choose a project!' ) );
			break;
		default:
			log( chalk.yellow( 'This project does not have a build step defined.' ) );
	}
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function buildCli( argv ) {
	argv = await promptForProject( argv );
	await build( argv );
}

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function buildDefine( yargs ) {
	yargs.command( 'build [project]', 'Builds a monorepo project', ( yarg ) => {
			yarg.positional( 'project', {
				describe: 'Project in the form of type/name, e.g. plugins/jetpack',
				type: 'string'
			} );
		},
		async ( argv ) => {
			await buildCli( argv );
			if ( argv.v ) {
				// eslint-disable-next-line no-console
				console.log( argv );
			}
		}
	);

	return yargs;
}
