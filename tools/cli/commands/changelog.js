/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import path from 'path';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { chalkJetpackGreen } from '../helpers/styling';
import { normalizeProject } from '../helpers/normalizeArgv';

/**
 * Command definition for the changelog subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the changelog commands defined.
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
	argv = normalizeProject( argv );
	argv = await promptForProject( argv );
	const projDir = path.resolve( `projects/${ argv.project }` );
	const process = child_process.spawnSync( `vendor/bin/changelogger ${ argv.cmd }`, [ '' ], {
		cwd: projDir,
		stdio: 'inherit',
		shell: true,
	} );

	// Node.js exit code status 0 === success
	if ( process.status !== 0 ) {
		console.error( chalk.red( 'Something went wrong! Check your file path?' ), process.error );
	} else {
		console.log( chalkJetpackGreen( `Changelog for ${ argv.project } added successfully!` ) );
	}
}

/** Validate arguments
 *
 * @param {object} argv - arguments passed to changelogger.
 */
function validateArgs( argv ) {
	// make sure we're using a valid command
	switch ( argv.cmd ) {
		case 'add':
			break;
		case 'validate':
			throw new Error( 'Sorry! That command is not supported yet!' );
		case 'version':
			throw new Error( 'Sorry! That command is not supported yet!' );
		case 'write':
			throw new Error( 'Sorry! That command is not supported yet!' );
		default:
			throw new Error(
				`${ chalk.bgRed( 'Unrecognized command:' ) } \`${
					argv.cmd
				}\`. Use \`jetpack changelog --help\` for help.`
			);
	}
}
