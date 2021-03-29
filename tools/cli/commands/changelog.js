/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { chalkJetpackGreen } from '../helpers/styling';
import { normalizeProject } from '../helpers/normalizeArgv';

/**
 * Comand definition for changelog subcommand.
 *
 * @param {yargs} yargs - The Yargs dependency.
 * @returns {object} Yargs with the changelog commands defined.
 */
export function changelogDefine( yargs ) {
	yargs.command(
		[ 'changelog <cmd> [project]', 'changelogger' ],
		'Runs a changelogger add command for a project',
		yarg => {
			yarg
				.positional( 'command', {
					describe: 'Command for changelog script to run',
					type: 'string',
					choices: [ 'add', 'validate', 'write', 'version' ],
				} )
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} );
		},
		async argv => {
			await changelogRouter( argv );
		}
	);

	return yargs;
}

/**
 * Routes Changelog Command to correct place.
 *
 * @param {argv} argv - the arguments passed.
 */
function changelogRouter( argv ) {
	if ( ! argv.cmd ) {
		argv.cmd = promptCommand( argv );
	}
	switch ( argv.cmd ) {
		case 'add':
			changelogAdd( argv );
			break;
		case 'validate':
			changelogValidate( argv );
			break;
		default:
			throw new Error( 'Command not implemented yet!' );
	}
}

/**
 * Prompts for changelog command if not passed one.
 *
 * @param {argv} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptCommand( argv ) {
	argv.cmd = await inquirer.prompt( {
		type: 'list',
		name: 'type',
		message: 'What type of project are you working on today?',
		choices: [ 'add', 'verify', 'write', 'version' ],
	} );
	return argv;
}
/**
 * Comand definition for changelog add subcommand.
 *
 * @param {yargs} yargs - The Yargs dependency.
 * @returns {object} Yargs with the changelog commands defined.
 */
export function changelogAddDefine( yargs ) {
	yargs.command(
		[ 'changelog add [project]', 'changelogger' ],
		'Runs a changelogger add command for a project',
		yarg => {
			yarg
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
				} );
		},
		async argv => {
			await changelogAdd( argv );
		}
	);

	return yargs;
}

/**
 * Comand definition for changelog validate subcommand.
 *
 * @param {yargs} yargs - The Yargs dependency.
 * @returns {object} Yargs with the changelog commands defined.
 */
export function changelogValidateDefine( yargs ) {
	yargs.command(
		[ 'changelog validate [project]', 'changelogger' ],
		'Runs a changelogger validate command to validate changelog files for a project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
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
			await changelogValidate( argv );
		}
	);

	return yargs;
}

/**
 * Changelog add script.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changelogAdd( argv ) {
	argv = await validateProject( argv );
	const parsedArgKey = Object.keys( argv );
	const acceptedArgs = [ 's', 't', 'e', 'f' ]; //significance, type, excerpt, file
	argv.success = `Changelog for ${ argv.project } added successfully!`;
	argv.error = `Changelogger couldn't be executed correctly. See error.`;
	argv.args = [ 'add' ];

	// Check passed arguments against accepted args and add them to our command.
	for ( const arg of parsedArgKey ) {
		if ( acceptedArgs.includes( arg ) ) {
			argv.args.push( `-${ arg }${ argv[ arg ] }` );
		}
	}
	if ( argv.v ) {
		argv.args.push( '-v' );
	}

	// Check if we have all required args for a passthrough, otherwise default to interactive mode.
	if ( argv.s && argv.t && argv.e ) {
		argv.args.push( '--no-interaction' );
		changeloggerCli( argv );
		return;
	}
	if ( argv.args.length > 1 ) {
		console.error(
			chalk.bgRed(
				'Need to pass all arguments for non-interactive mode. Defaulting to interactive mode.'
			)
		);
		changeloggerCli( argv );
		return;
	}
	changeloggerCli( argv );
}

/**
 * Changelog validate script.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changelogValidate( argv ) {
	argv = await validateProject( argv );
	const parsedArgKey = Object.keys( argv );
	const acceptedArgs = [ 'gh-action', `basedir`, 'no-strict' ];
	argv.success = `Validation for ${ argv.project } completed succesfully!`;
	argv.error = `Changelog validation failed. See above.`;
	argv.args = [ 'validate' ];

	// Add any options we're passing onto the command.
	for ( const arg of parsedArgKey ) {
		if ( acceptedArgs.includes( arg ) ) {
			argv.args.push( `--${ arg }` );
		}
	}

	if ( argv.args.includes( '--basedir' ) ) {
		argv.args.push( argv.basedir );
	}

	if ( argv.v ) {
		argv.args.push( '-v' );
	}
	changeloggerCli( argv );
}

/**
 * Runs changelogger script for project specified.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changeloggerCli( argv ) {
	console.log( argv );
	// @todo Add validation of changelogger commands? See projects/packages/changelogger/README.md
	// @todo refactor? .github/files/require-change-file-for-touched-projects.php to a common function that we could use here. Would allow us to run a "jetpack changelog add" without a project to walk us through all of them?
	const data = child_process.spawnSync( `${ argv.cmdPath }`, argv.args, {
		cwd: argv.cwd,
		stdio: 'inherit',
	} );

	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error( chalk.red( argv.error ) );
		process.exit( data.status );
	} else {
		console.log( chalkJetpackGreen( argv.success ) );
	}
}

/**
 * Make sure we're working with a valid project,
 * prompt for one if we're not.
 *
 * @param {object} argv - arguments passed as cli.
 * @returns {object} argv - arguments with project added.
 */
export async function validateProject( argv ) {
	argv = normalizeProject( argv );
	argv = await promptForProject( argv );
	argv.cwd = path.resolve( `projects/${ argv.project }` );
	validatePath( argv, argv.cwd );
	return argv;
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
