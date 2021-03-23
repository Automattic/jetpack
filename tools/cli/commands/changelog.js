/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';

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
		[ 'changelog <cmd> [project]', 'changelogger' ],
		'Runs a changelogger command for a project',
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
	validateCmd( argv );

	argv = normalizeProject( argv );
	argv = await promptForProject( argv );
	const projDir = path.resolve( `projects/${ argv.project }` );
	validatePath( argv, projDir );

	const data = child_process.spawnSync( `${ argv.cmdPath }`, [ `${ argv.cmd }` ], {
		cwd: projDir,
		stdio: 'inherit',
	} );

	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error(
			chalk.red( `Changelogger failed to execute command. Please see error above for more info.` )
		);
		process.exit( data.status );
	} else {
		console.log( chalkJetpackGreen( `Changelog for ${ argv.project } added successfully!` ) );
	}
}

/** Validate arguments
 *
 * @param {object} argv - arguments passed to changelogger.
 */
function validateCmd( argv ) {
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

/** Validate that the vendor/bin/changelogger file exists
 *
 * @param {object} argv - arguments passed to the wizard.
 * @param {string} dir - path to file we're adding changlog too.
 */
function validatePath( argv, dir ) {
	if ( ! fs.existsSync( dir ) ) {
		throw new Error( chalk.red( `Project doesn't exist! Typo?` ) );
	}
	if ( argv.project === 'packages/changelogger' ) {
		argv.cmdPath = 'bin/changelogger';
		return;
	}
	if ( fs.existsSync( dir + `/vendor/bin/changelogger` ) ) {
		argv.cmdPath = 'vendor/bin/changelogger';
		return;
	}
	throw new Error(
		chalk.red(
			`Path to changelogger script doesn't exist. Try running 'jetpack install ${ argv.project }' first!`
		)
	);
}
