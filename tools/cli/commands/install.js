/**
 * External dependencies
 */
import chalk from 'chalk';
import Listr from 'listr';

/**
 * Internal dependencies
 */
import { promptForProject } from '../helpers/promptForProject.js';
import { installProjectTask } from '../helpers/tasks/installProjectTask';
import { allProjects } from '../helpers/projectHelpers';

/**
 * Installs a project.
 *
 * @param {string} project - The project.
 * @param {boolean} root - If the monorepo should be installed via --root arg.
 * @param {boolean} all -- If everything should be installed.
 */
export async function install( project, root = false, all = false ) {
	// Special hack for installing just the monorepo.
	if ( project === 'monorepo' || all ) {
		project = '';
		root = true;
	}

	const tasks = [];
	root ? tasks.push( installProjectTask( project, root ) ) : null;
	project ? tasks.push( installProjectTask( project ) ) : null;

	if ( all ) {
		allProjects().forEach( item => {
			tasks.push( installProjectTask( item ) );
		} );
	}

	const installs = new Listr( tasks, { concurrent: true } );

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
	argv = {
		...argv,
		project: argv.project || '',
		root: argv.root || false,
		all: argv.all || false,
	};

	if ( ! argv.root && ! argv.all ) {
		argv = await promptForProject( argv );
	}

	if ( argv.project || argv.root || argv.all ) {
		await install( argv.project, argv.root, argv.all );
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
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
