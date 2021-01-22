/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';
import path from 'path';
import Listr from "listr";
import execa from 'execa';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';
import { readComposerJson, readPackageJson } from '../helpers/readJson';

/**
 * Installs a project.
 *
 * @param {string} project - The project.
 */
export async function install( project ) {
	const cwd = path.resolve( `projects/${project}` );
	const installs = new Listr( [
		{
			title: `Installing ${project}`,
			task: () => {
				return new Listr([{
						title: 'Installing Composer Dependencies',
						enabled: () => { return Boolean( readComposerJson( project, false ) ); },
						task: () => execa.command( 'composer install', { cwd: cwd } )
					},
						{
							title: 'Installing Yarn Dependencies',
							enabled: () => { return Boolean( readPackageJson( project, false ) ); },
							task: () => execa.command( 'yarn install', { cwd: cwd } )
						}

					], { concurrent: true }

				);
			}
		}

		]
	);

	installs.run().catch( err => {
		console.error( err );
	} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function installCli( argv ) {
	argv = await promptForProject( argv );
	argv = {
		...argv,
		project: argv.project || ''
	};

	if ( argv.project ) {
		await install( argv.project );
	} else {
		console.log( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Command definition for the install subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function installDefine( yargs ) {
	yargs.command(
		'install [project]',
		'Installs a monorepo project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} );
		},
		async argv => {
			await installCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}
