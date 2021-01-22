/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import Listr from 'listr';
import execa from 'execa';
import process from 'process';

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
 * @param {boolean} root - If the monorepo should be installed via --root arg.
 */
export async function install( project, root = false ) {
	// Special hack for installing just the monorepo.
	if ( project === 'monorepo' ) {
		project = '';
		root = true;
	}

	const tasks = [];
	root ? tasks.push( installProjectTask( project, root ) ) : null;
	project ? tasks.push( installProjectTask( project ) ) : null;

	const installs = new Listr( tasks, { concurrent: true } );

	installs.run().catch( err => {
		console.error( err );
	} );
}

/**
 * Preps the task for an individual project.
 *
 * @param {string} project - A monorepo project.
 * @param {boolean} root - If we want to install the monorepo.
 *
 * @returns {object} - The project install task per Listr format.
 */
export function installProjectTask( project, root = false ) {
	// This should never happen. Hard exit to avoid errors in consuming code.
	if ( ! project && ! root ) {
		console.error( 'You cannot create an install task for nothing.' );
		process.exit( 1 );
	}
	const cwd = root ? process.cwd() : path.resolve( `projects/${ project }` );
	const composerEnabled = root ? true : Boolean( readComposerJson( project, false ) );
	const yarnEnabled = root ? true : Boolean( readPackageJson( project, false ) );
	project = root ? 'Monorepo' : project;

	return {
		title: `Installing ${ project }`,
		task: () => {
			return new Listr(
				[
					{
						title: chalkJetpackGreen( 'Installing Composer Dependencies' ),
						enabled: () => {
							return composerEnabled;
						},
						task: () => execa.command( 'composer install', { cwd: cwd } ),
					},
					{
						title: chalkJetpackGreen( 'Installing Yarn Dependencies' ),
						enabled: () => {
							return yarnEnabled;
						},
						task: () => execa.command( 'yarn install', { cwd: cwd } ),
					},
				],
				{ concurrent: true }
			);
		},
	};
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
		project: argv.project || '',
		root: argv.root || false,
	};

	if ( argv.project || argv.root ) {
		await install( argv.project, argv.root );
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
				} )
				.option( 'root', {
					alias: 'r',
					type: 'boolean',
					description: 'Install the monorepo dependencies',
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
