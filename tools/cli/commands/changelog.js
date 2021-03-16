/**
 * External dependencies
 */
import child_process from 'child_process';
import path from 'path';
import pluralize from 'pluralize';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';

/**
 * Command definition for the changelog subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the generate commands defined.
 */
export function changelogDefine( yargs ) {
	yargs.command(
		'changelog <cmd> [project]',
		'Creates a new changelog file for project',
		yarg => {
			yarg
				.positional( 'cmd', {
					describe: 'Changelogger command (e.g. add)',
					type: 'string',
				} )
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} );
		},
		async argv => {
			await changeloggerCli( argv );
		}
	);

	return yargs;
}

/**
 * Runs changelogger script for project specified.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changeloggerCli( argv ) {
	// @todo Add validation of changelogger commands? See projects/packages/changelogger/README.md
	// @todo refactor? .github/files/require-change-file-for-touched-projects.php to a common function that we could use here. Would allow us to run a "jetpack changelog add" without a project to walk us through all of them?
	validateArgs( argv );
	argv = await promptForProject( argv );
	const projDir = path.resolve( `projects/${ argv.project }` );
	child_process.spawn( `vendor/bin/changelogger ${ argv.cmd }`, [ '' ], {
		cwd: projDir,
		stdio: 'inherit',
		shell: true,
	} );
}

/** Validate arguments
 *
 * @param {object} argv - arguments passed to changelogger.
 */
function validateArgs ( argv ) {
	// make sure we're using a valid command
	switch ( argv.cmd ) {
		case 'add':
			break;
		case 'validate':
			break;
		case 'version':
			break;
		case 'write':
			break;
		default:
			throw new Error( 'Not a valid command. Use `jetpack changelog --help` for help with changelogger' );
	}
	// If someone doesn't pass an entire project, prompt for specifics.
	if ( argv.project ) {
		switch ( pluralize( argv.project ) ) {
			case 'plugins':
				argv.type = 'plugins';
				argv.project = '';
				break;
			case 'packages':
				argv.type = 'packages';
				argv.project = '';
				break;
			case 'github-action':
				argv.type = 'github-actions';
				argv.project = '';
				break;
			default:
				argv.type = argv.project;
				break;
		}
	}
}