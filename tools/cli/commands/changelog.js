/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import inquirer from 'inquirer';
import simpleGit from 'simple-git';

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
	// Main Changelog command
	yargs.command(
		[ 'changelog [cmd]', 'changelogger [cmd]' ],
		'Runs the changelogger wizard',
		yarg => {
			yarg
				.positional( 'cmd', {
					describe: 'Command for changelog script to run',
					type: 'string',
					choices: [ 'add', 'validate', 'write', 'version' ],
				} )
				.options( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				// Changelog add subcommand
				.command(
					'add [project]',
					'Runs a changelogger add command for a project',
					yargAdd => {
						yargAdd
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
				)
				// Changelog validate subscommand
				.command(
					'validate [project]',
					'Runs a changelogger validate command to validate changelog files for a project',
					yargValidate => {
						yargValidate
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
				)
				.command(
					'write [project]',
					'Writes all of the added changelog files to the project README.md',
					yargWrite => {
						yargWrite
							.positional( 'project', {
								describe: 'Project in the form of type/name, e.g. plugins/jetpack',
								type: 'string',
							} )
							.option( 'amend', {
								describe: 'Amend the latest version instead of creating a new one',
								type: 'string',
							} )
							.option( 'yes', {
								describe:
									'Default all questions to "yes" instead of "no". Particularly useful for non-interactive mode',
								type: 'bool',
							} )
							.option( 'use-version', {
								describe:
									'Specify a version instead of determining the version automatically, e.g. 2.0.0',
								type: 'string',
							} )
							.option( 'use-significance', {
								describe:
									'When determining the new version, use this significance instead of using the actual change files',
								type: 'string',
							} )
							.option( 'prerelease', {
								alias: 'p',
								describe: 'When determining the new version, include this prerelease suffix',
								type: 'bool',
							} )
							.option( 'buildinfo', {
								alias: 'b',
								describe: 'When fetching the next version, include this buildinfo suffix',
								type: 'bool',
							} )
							.option( 'release-date', {
								describe: 'Release date, as a valid PHP date or "unreleased"',
								type: 'string',
							} )
							.option( 'default-first-version', {
								describe:
									'If the changelog is currently empty, guess a "first" version instead of erroring',
								type: 'string',
							} )
							.option( 'deduplicate', {
								describe: 'Deduplicate new changes against the last N versions',
								type: 'bool',
							} )
							.option( 'prologue', {
								describe: 'Prologue text for the new changelog entry',
								type: 'string',
							} )
							.option( 'epilogue', {
								describe: 'Epilogue text for the new changelog entry',
								type: 'string',
							} )
							.option( 'link', {
								describe: 'Link for the new changelog entry',
								type: 'string',
							} );
					},
					async argv => {
						await changelogWrite( argv );
					}
				);
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
async function changelogRouter( argv ) {
	if ( ! argv.cmd ) {
		argv = await promptCommand( argv );
	}
	switch ( argv.cmd ) {
		case 'add':
			changelogAdd( argv );
			break;
		case 'validate':
			changelogValidate( argv );
			break;
		case 'write':
			changelogWrite( argv );
			break;
		case 'version':
			console.error( chalk.red( 'Command not yet implemented!' ) );
			process.exit( 1 );
		default:
			throw new Error( 'Unknown command' ); // Yargs should provide a helpful response before this, but to be safe.
	}
}

/**
 * Prompts for changelog command if not passed one.
 *
 * @param {argv} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptCommand( argv ) {
	const response = await inquirer.prompt( {
		type: 'list',
		name: 'cmd',
		message: 'What changelogger command do you want to run?',
		choices: [ 'add', 'validate', 'version', 'write' ],
	} );
	argv.cmd = response.cmd;
	return argv;
}

/**
 * Changelog add script.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changelogAdd( argv ) {
	argv = await validateProject( argv );
	const parsedArgKey = Object.keys( argv );
	const acceptedArgs = [ 's', 't', 'e', 'f' ]; //significance, type, entry, file
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
	const acceptedArgs = [ 'gh-action', 'basedir', 'no-strict' ];
	argv.success = `Validation for ${ argv.project } completed succesfully!`;
	argv.error = 'Changelog validation failed. See above.';
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
 * Changelog write script.
 *
 * @param {object} argv - arguments passed to the CLI.
 */
async function changelogWrite( argv ) {
	argv = await validateProject( argv );
	argv.success = `${ argv.project } CHANGELOG.md written to succesfully!`;
	argv.error = 'Writing to the changelog file failed. See error.';
	argv.args = [ argv.cmd || argv._[ 1 ], ...process.argv.slice( 4 ) ];

	// Remove project from command list we pass to changelogger.
	if ( argv.args.includes( argv.project ) ) {
		argv.args.splice( argv.args.indexOf( argv.project ), 1 );
	}

	changeloggerCli( argv );
}

/**
 * Runs changelogger script for project specified.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changeloggerCli( argv ) {
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
		await gitAdd( argv );
		console.log( chalkJetpackGreen( argv.success ) );
	}
}

/**
 * Add new changelog files to git staging.
 *
 * @param {argv} argv - the arguments passed.
 */
async function gitAdd( argv ) {
	const changelogPath = `projects/${ argv.project }/changelog`;
	const git = simpleGit();
	const gitStatus = await git.status();
	for ( const file of gitStatus.not_added ) {
		if ( path.dirname( file ) === changelogPath ) {
			git.add( file );
		}
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

/**
 * Validate that the vendor/bin/changelogger file exists
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
