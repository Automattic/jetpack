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
					describe: 'Changelogger command',
					type: 'string',
					choices: [ 'add', 'validate', 'write', 'version' ],
				} )
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.option( 'file', {
					alias: 'f',
					describe: 'Name of changelog file',
					type: 'string',
				} )
				.option( 'significance', {
					alias: 's',
					describe: 'Significance of changes (patch, minor, major)',
					type: 'string',
				} )
				.option( 'type', {
					alias: 't',
					describe: 'Type of change',
					type: 'string',
				} )
				.option( 'entry', {
					alias: 'e',
					describe: 'Changelog entry',
					type: 'string',
				} )
				.option( 'gh-action', {
					describe: 'Output validation issues using GitHub Action command syntax.',
					type: 'bool',
				} )
				.option( 'base-dir', {
					describe: 'Output file paths in this directory relative to it.',
					type: 'bool',
				} )
				.option( 'no-strict', {
					alias: 'strict',
					describe: 'Do not exit with a failure code if only warnings are found.',
					type: 'bool',
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
	const commandData = {};
	argv = normalizeProject( argv );
	argv = await promptForProject( argv );
	parseCmd( argv, commandData );
	const projDir = path.resolve( `projects/${ argv.project }` );
	validatePath( argv, projDir );

	const data = child_process.spawnSync( `${ argv.cmdPath }`, commandData.args, {
		cwd: projDir,
		stdio: 'inherit',
	} );

	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error( chalk.red( commandData.error ) );
		process.exit( data.status );
	} else {
		console.log( chalkJetpackGreen( commandData.success ) );
	}
}

/**
 * Set command specific data based on command passed.
 *
 * @param {object} argv - arguments passed to changelogger.
 * @param {object} commandData - data we want to return to the process.
 */
function parseCmd( argv, commandData ) {
	const parsedArgKey = Object.keys( argv );
	let acceptedArgs;
	switch ( argv.cmd ) {
		case 'add':
			acceptedArgs = [ 's', 't', 'e' ]; //significance, type, excerpt
			commandData.success = `Changelog for ${ argv.project } added successfully!`;
			commandData.error = `Changelogger couldn't be executed correctly. See error.`;
			commandData.args = [ argv.cmd ];

			// Check passed arguments against accepted args and add them to our command.
			for ( const arg of parsedArgKey ) {
				if ( acceptedArgs.includes( arg ) ) {
					commandData.args.push( `-${ arg }${ argv[ arg ] }` );
				}
			}

			// If no args or passed, or not all accepted arguments are passed, default to non-interactive mode.
			if ( commandData.args.length === 1 ) {
				break;
			}
			if ( commandData.args.length !== acceptedArgs.length + 1 ) {
				console.error(
					chalk.bgRed(
						'Need to pass all arguments for non-interactive mode. Defaulting to interactive mode.'
					)
				);
				break;
			}

			commandData.args.push( '--no-interaction' );
			break;
		case 'validate':
			acceptedArgs = [ 'gh-action', `basedir`, 'no-strict' ];
			commandData.success = `Validation for ${ argv.project } completed succesfully!`;
			commandData.error = `Changelog validation failed. See above.`;
			commandData.args = [ argv.cmd ];

			// Format command data based on passed arguments
			for ( const arg of parsedArgKey ) {
				if ( acceptedArgs.includes( arg ) ) {
					commandData.args.push( `--${ arg }` );
				}
			}

			if ( commandData.args.includes( '--basedir' ) ) {
				commandData.args.push( argv.basedir );
			}
			break;
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

	// If we're specifying a file, pass that on to changelogger.
	// (I believe this is used by all commands, but we can move it back to `add` if necessary )
	if ( argv.file ) {
		commandData.args.push( `-f${ argv.file }` );
	}
	if ( argv.v ) {
		commandData.args.push( '-v' );
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
