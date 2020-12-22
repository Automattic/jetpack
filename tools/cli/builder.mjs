/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';
import path from 'path';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from './helpers/styling.mjs';
import { promptForProject } from './helpers/promptForProject.mjs';
import { cliFunctions } from './helpers/cliFunctions.mjs';

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Relays build commands to a particular project.
 *
 * @param options
 */
export async function builder( options ) {
	options = {
		...options,
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
		default:
			log( chalk.yellow( 'This project does not have a build step defined.' ) );
	}
	return true;
}

/**
 * Entry point for the CLI.
 */
export async function cli() {
	const cli = cliFunctions();
	// Add cli. commands here to string together options.

	let options = cli.parse( process.argv, { version: false } );

	options = await promptForProject( options );
	if ( options.verbose ) {
		console.log( options );
	}
	await builder( options );
}
