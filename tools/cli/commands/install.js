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
