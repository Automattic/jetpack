/**
 * External dependencies
 */
import chalk from 'chalk';
import Listr from 'listr';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject.js';
import installProjectTask from '../helpers/tasks/installProjectTask';
import { allProjects } from '../helpers/projectHelpers';
import { normalizeInstallArgv, normalizeProject } from '../helpers/normalizeArgv';
import listrOpts from '../helpers/tasks/listrOpts';

/**
 * Installs a project.
 *
 * @param {object} argv - Passthrough of the argv to include project, root, etc options.
 */
export async function install( argv ) {
	argv = normalizeInstallArgv( argv );

	let tasks = [];
	if ( argv.all ) {
		allProjects().forEach( item => {
			argv.project = item;
			tasks.push( installProjectTask( argv ) );
		} );
		// Reset.
		argv.root = true;
		argv.project = '';
	}

	tasks = addRootInstallTask( argv, tasks );

	argv.project ? tasks.push( installProjectTask( argv ) ) : null;

	const opts = listrOpts( argv );

	const installs = new Listr( tasks, opts );

	installs.run().catch( err => {
		console.error( err );
		process.exit( err.exitCode || 1 );
	} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function installCli( argv ) {
	argv = normalizeInstallArgv( argv );
	argv = normalizeProject( argv );

	if ( ! argv.root && ! argv.all ) {
		argv = await promptForProject( argv );
	}

	if ( argv.project || argv.root || argv.all ) {
		await install( argv );
	} else {
		console.error( chalk.red( 'You did not choose a valid project!' ) );
	}
}

/**
 * Command definition for the install subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the install commands defined.
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
				} )
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Installs everything',
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

/**
 * Conditionally add the root install task
 *
 * @param {object} argv - The argv object
 * @param {Array} tasks - The tasks array
 * @returns {Array} The tasks array
 */
function addRootInstallTask( argv, tasks ) {
	normalizeInstallArgv( argv );
	argv.root ? tasks.push( installProjectTask( argv ) ) : null;
	return tasks;
}
