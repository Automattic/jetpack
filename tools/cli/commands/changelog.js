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
import { allProjects } from '../helpers/projectHelpers';

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
						await changelogArgs( argv );
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
						await changelogArgs( argv );
					}
				)
				.command(
					'version [project] [which]',
					'Displays versions from the changelog and change files',
					yargAdd => {
						yargAdd
							.positional( 'project', {
								describe: 'Project in the form of type/name, e.g. plugins/jetpack',
								type: 'string',
							} )
							.positional( 'which', {
								describe: 'Version to fetch: previous, current or next',
								type: 'string',
							} )
							.option( 'use-version', {
								describe:
									'When fetching the next version, use this instead of the current version in the changelog',
								type: 'string',
							} )
							.option( 'use-significance', {
								describe:
									'When fetching the next version, use this significance instead of using the actual change files',
								type: 'string',
							} )
							.option( 'prerelease', {
								alias: 'p',
								describe: 'When fetching the next version, include this prerelease suffix',
								type: 'string',
							} )
							.option( 'buildinfo', {
								alias: 'b',
								describe: 'When fetching the next version, include this buildinfo suffix',
								type: 'string',
							} )
							.option( 'default-first-version', {
								describe:
									'If the changelog is currently empty, guess a "first" version instead of erroring. When used with `current`, makes it work as `next` in that situation.',
								type: 'string',
							} );
					},
					async argv => {
						await changelogArgs( argv );
					}
				);
		},
		async argv => {
			await changelogCommand( argv );
		}
	);
	return yargs;
}

/**
 * Get a command if we're not passed one as an argument.
 *
 * @param {argv} argv - the arguments passed.
 */
async function changelogCommand( argv ) {
	if ( ! argv.cmd ) {
		argv = await promptCommand( argv );
	}

	const commands = [ 'add', 'validate', 'version', 'write' ];
	if ( ! commands.includes( argv.cmd ) ) {
		throw new Error( 'Unknown command' ); // Yargs should provide a helpful response before this, but to be safe.
	}

	changelogArgs( argv );
}

/**
 * Checks if any projects have special changelog configurations.
 *
 * @param {Array} needChangelog - files that need a changelog.
 * @returns {Array} - array of projects with unique changelog configurations.
 */
async function checkSpecialProjects( needChangelog ) {
	const specialProjects = [];
	for ( const proj of needChangelog ) {
		const projPath = path.join( __dirname, '../../..', 'projects/', proj, '/composer.json' );
		const rawComposerFile = fs.readFileSync( projPath, err => {
			if ( err ) {
				throw new Error(
					chalk.red( `Couldn't read the composer.json file for the project!` ),
					err
				);
			}
		} );
		const composerJSON = JSON.parse( rawComposerFile );
		// todo - handle duplicate special projects with the same type of requirements.
		// todo - If we want to generate changelogger questions dynamically, we can push the entire composerJSON.extra.changelogger.types object.
		if ( composerJSON.extra.changelogger && composerJSON.extra.changelogger.types ) {
			needChangelog.splice( needChangelog.indexOf( proj ), 1 );
			specialProjects.push( proj );
		}
	}
	return specialProjects;
}

/**
 * Run the changelog add wizard, which checks if multiple projects need changelogs.
 *
 * @param {argv} argv - the arguments passed.
 */
async function changelogAdd( argv ) {
	if ( argv._[ 1 ] === 'add' && ! argv.project ) {
		const needChangelog = await changedProjects();
		const uniqueProjects = await checkSpecialProjects( needChangelog );
		const changelogAll = await changelogAddPrompt( argv, needChangelog, uniqueProjects );

		// Auto add the changelog files for the projects that we can:
		if ( changelogAll.autoAdd ) {
			console.log(
				chalk.green( `Running auto changelogger for ${ needChangelog.length } project(s)!` )
			);
			const response = await promptChangelog( argv );
			for ( const proj of needChangelog ) {
				argv = await formatAutoArgs( proj, argv, response );
				await changelogArgs( argv );
			}
			if ( uniqueProjects ) {
				console.log(
					chalk.green(
						`Changelog file added to ${ needChangelog.length } project(s)! Returning to interactive mode for remaining projects.`
					)
				);
			}
			needChangelog.splice( 0, needChangelog.length );
		}

		// If not auto adding, or if there are special configurations, prompt for each one:
		if ( ! changelogAll.autoAdd || uniqueProjects ) {
			argv.auto = false;
			const totalProjects = [ ...needChangelog, ...uniqueProjects ];
			for ( const proj of totalProjects ) {
				argv.args = [];
				argv.project = proj;
				console.log( chalk.green( `Running changelogger for ${ argv.project }` ) );
				await changelogArgs( argv );
			}
			return;
		}
	} else {
		changelogArgs( argv );
	}
}

/**
 * If we're auto-adding to multiple projects, format argv the way changelogger likes.
 *
 * @param {string} proj - project we're running changelog for.
 * @param {object} argv - argv values.
 * @param {object} response - changelog command response.
 * @returns {object} argv - returns argv.
 */
async function formatAutoArgs( proj, argv, response ) {
	argv.pass = [];
	argv.auto = true;
	argv.project = proj;
	argv.pass.push( '-s', response.significance );
	argv.pass.push( '-t', response.type );
	argv.pass.push( '-e', response.entry );
	argv.pass.push( '-f', response.changelogName );
	return argv;
}

/**
 * Adds any passthrough arguments to args before running command.
 *
 * @param {object} argv - arguments passed to the CLI.
 */
async function changelogArgs( argv ) {
	argv = await validateProject( argv );
	argv.success = `Command '${ argv.cmd || argv._[ 1 ] }' for ${
		argv.project
	} completed succesfully!`;
	argv.error = `Command '${ argv.cmd || argv._[ 1 ] }' for ${ argv.project } has failed! See error`;
	argv.args = [ argv.cmd || argv._[ 1 ], ...process.argv.slice( 4 ) ];

	if ( argv.auto ) {
		argv.args.push( ...argv.pass );
	}

	// Check for required command specific arguements.
	switch ( argv.args[ 0 ] ) {
		case 'add':
			if ( ( argv.s && argv.t && argv.e ) || argv.auto ) {
				argv.args.push( '--no-interaction' );
			} else if ( argv.s || argv.t || argv.e ) {
				console.error(
					chalk.bgRed(
						'Need to pass all required arguments for non-interactive mode. Defaulting to interactive mode.'
					)
				);
			}
			break;
		case 'version':
			if ( ! argv.which ) {
				argv = await promptVersion( argv );
				argv.args.push( argv.ver );
			}
			break;
	}

	// Remove project from command list we pass to changelogger.
	if ( argv.args.includes( argv.project ) ) {
		argv.args.splice( argv.args.indexOf( argv.project ), 1 );
	}
	await changeloggerCli( argv );
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
 * Prompts for which version to return.
 *
 * @param {argv} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptVersion( argv ) {
	const response = await inquirer.prompt( {
		type: 'list',
		name: 'ver',
		message: 'Which version would you like to get?',
		choices: [ 'current', 'next', 'previous' ],
	} );
	argv.ver = response.ver;
	return argv;
}

/**
 * Prompts for changelog options.
 *
 * @param {object} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptChangelog( argv ) {
	const git = simpleGit();
	const gitStatus = await git.status();
	const gitBranch = gitStatus.current.replace( /\//g, '-' );

	const commands = await inquirer.prompt( [
		{
			type: 'string',
			name: 'changelogName',
			message: 'Name your change file:',
			default: gitBranch,
		},
		{
			type: 'list',
			name: 'significance',
			message: 'Significance of the change, in the style of semantic versioning.',
			choices: [
				{
					value: 'patch',
					name: '[patch] Backwards-compatible bug fixes.',
				},
				{
					value: 'minor',
					name: '[minor] Added (or deprecated) functionality in a backwards-compatible manner.',
				},
				{
					value: 'major',
					name: '[major] Broke backwards compatibility in some way.',
				},
			],
		},
		{
			type: 'list',
			name: 'type',
			message: 'Type of change.',
			choices: [
				{
					value: 'security',
					name: '[security  ] Security',
				},
				{
					value: 'added',
					name: '[added     ] Added',
				},
				{
					value: 'changed',
					name: '[changed   ] Changed',
				},
				{
					value: 'deprecated',
					name: '[deprecated] Deprecated',
				},
				{
					value: 'removed',
					name: '[removed   ] Removed',
				},
				{
					value: 'fixed',
					name: '[fixed     ] Fixed',
				},
			],
		},
		{
			type: 'string',
			name: 'entry',
			message: 'Changelog entry. May be left empty if this change is particularly insignificant.',
			when: answers => answers.significance === 'patch',
		},
		{
			type: 'string',
			name: 'entry',
			message: 'Changelog entry. May not be empty.',
			when: answers => answers.significance === 'minor' || 'major',
			validate: input => {
				if ( ! input || ! input.trim() ) {
					return `Changelog entry can't be blank`;
				}
				return true;
			},
		},
	] );
	return { ...commands };
}

/**
 * Asks if you want to add changelog files for each.
 *
 * @param {object} argv - the arguments passed.
 * @param {Array} needChangelog - files that need changelogs.
 * @param {Array} uniqueProjects - projects with unique changelog types.
 *
 * @returns {argv}.
 */
async function changelogAddPrompt( argv, needChangelog, uniqueProjects ) {
	if ( uniqueProjects.length === 0 ) {
		const response = await inquirer.prompt( {
			type: 'confirm',
			name: 'autoAdd',
			message: `Found ${ needChangelog.length } project(s) of the same type that need a changelog. Add same changelog to all projects?`,
		} );
		return response;
	}

	const response = await inquirer.prompt( {
		type: 'confirm',
		name: 'autoAdd',
		message: `Found ${ needChangelog.length } projects that can accept the same changelog file.\n  Found ${ uniqueProjects.length } project(s) that requires manual configuration. \n  Add same changelog file to ${ needChangelog.length } project(s)?`,
	} );
	return response;
}

/**
 * Runs changelogger script for project specified.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changeloggerCli( argv ) {
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
 * @param {object} argv - the arguments passed.
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
 * Gets list of currently modified files.
 *
 * @returns {Array} modifiedProjects - projects that need a changelog.
 */
async function changedProjects() {
	const modifiedProjects = [];
	const gitFiles = [];
	const git = simpleGit();
	const gitStatus = await git.status();
	const projects = allProjects();
	// Get all files that were worked with (created, deleted, modified, etc)
	for ( const file of gitStatus.files ) {
		gitFiles.push( file.path );
	}

	// See if any files modified match our project list.
	for ( const proj of projects ) {
		for ( const file of gitFiles ) {
			if ( file.includes( proj ) && ! modifiedProjects.includes( proj ) ) {
				modifiedProjects.push( proj );
			}
		}
	}
	return modifiedProjects;
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
