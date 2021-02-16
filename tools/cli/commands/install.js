/**
 * External dependencies
 */
import chalk from 'chalk';
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';

/**
 * Internal dependencies
 */
import { promptForProject } from '../helpers/promptForProject.js';
import { installProjectTask } from '../helpers/tasks/installProjectTask';
import { allProjects } from '../helpers/projectHelpers';
import { normalizeInstallArgv } from '../helpers/normalizeArgv';

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

	const opts = {
		concurrent: ! argv.v,
		renderer: argv.v ? VerboseRenderer : UpdateRenderer,
	};

	const installs = new Listr( tasks, opts );

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
	argv = normalizeInstallArgv( argv );

	if ( ! argv.root && ! argv.all ) {
		argv = await promptForProject( argv );
	}

	if ( argv.project || argv.root || argv.all ) {
		await install( argv );
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Command definition for the install subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
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
 *
 * @returns {Array} The tasks array
 */
function addRootInstallTask( argv, tasks ) {
	normalizeInstallArgv( argv );
	argv.root ? tasks.push( installProjectTask( argv ) ) : null;
	return tasks;
}
