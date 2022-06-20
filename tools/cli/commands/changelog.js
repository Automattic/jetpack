import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readComposerJson } from '../helpers/json.js';
import { normalizeProject } from '../helpers/normalizeArgv.js';
import { projectTypes, allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';
import { runCommand } from '../helpers/runCommand.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

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
								type: 'boolean',
							} )
							.option( 'base-dir', {
								describe: 'Output file paths in this directory relative to it.',
								type: 'boolean',
							} )
							.option( 'no-strict', {
								alias: 'strict',
								describe: 'Do not exit with a failure code if only warnings are found.',
								type: 'boolean',
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
								type: 'boolean',
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
								type: 'boolean',
							} )
							.option( 'buildinfo', {
								alias: 'b',
								describe: 'When fetching the next version, include this buildinfo suffix',
								type: 'boolean',
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
								type: 'boolean',
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
							} )
							.option( 'add-pr-num', {
								describe: 'Append the GH PR number to each entry',
								type: 'boolean',
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
				)
				// Squash subcommand.
				.command(
					'squash [project] [file]',
					'Squashes changelog projects',
					yargSquash => {
						yargSquash
							.positional( 'project', {
								describe: 'Project in the form of type/name, e.g. plugins/jetpack',
								type: 'string',
							} )
							.option( 'file', {
								describe: 'File that we want to squash, either changelog or readme',
								type: 'string',
								choices: [ 'changelog', 'readme' ],
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

	const commands = [ 'add', 'validate', 'version', 'write', 'squash' ];
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
		const composerJSON = readComposerJson( proj );
		// todo - handle duplicate special projects with the same type of requirements.
		// todo - If we want to generate changelogger questions dynamically, we can push the entire composerJSON.extra.changelogger.types object.
		if (
			composerJSON.extra &&
			composerJSON.extra.changelogger &&
			composerJSON.extra.changelogger.types
		) {
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
		const needChangelog = await checkChangelogFiles();
		const uniqueProjects = await checkSpecialProjects( needChangelog );

		// If we don't detect any modified projects, shortcircuit to default changelogger.
		if ( needChangelog.length === 0 && uniqueProjects.length === 0 ) {
			console.log(
				chalk.green(
					'Did not detect a touched project that still need a changelog. You can still add a changelog manually.'
				)
			);
			changelogArgs( argv );
			return;
		}

		const promptType = await changelogAddPrompt( argv, needChangelog, uniqueProjects );

		// Bail if user doesn't want to auto-add.
		if ( ! promptType.autoAdd && ! promptType.autoPrompt ) {
			console.log(
				chalk.green(
					`Auto changelog cancelled. You can run 'jetpack changelog add [project-type/project]' to add changelogs individually.`
				)
			);
			return;
		}

		// Auto add the changelog files for the projects that we can:
		if ( promptType.autoAdd ) {
			console.log(
				chalk.green( `Running auto changelogger for ${ needChangelog.length } project(s)!` )
			);
			const response = await promptChangelog( argv, needChangelog );
			for ( const proj of needChangelog ) {
				argv = await formatAutoArgs( proj, argv, response );
				await changelogArgs( argv );
			}

			// Revert to interactive mode if we have projects with unique changelog configs.
			if ( uniqueProjects.length > 0 ) {
				console.log(
					chalk.green(
						`Changelog file added to ${ needChangelog.length } project(s)! Returning to interactive mode for remaining projects.`
					)
				);
				needChangelog.splice( 0, needChangelog.length );
				autoPrompter( argv, needChangelog, uniqueProjects );
			}
			return;
		}

		if ( promptType.autoPrompt ) {
			autoPrompter( argv, needChangelog, uniqueProjects );
			return;
		}
	}
	changelogArgs( argv );
}

/**
 * Prompts an interactive changelogger for reach project that needs one.
 *
 * @param {object} argv - arguments passed.
 * @param {Array} needChangelog - projects that need changelog.
 * @param {Array} uniqueProjects - projects with custom configs.
 */
async function autoPrompter( argv, needChangelog, uniqueProjects ) {
	argv.auto = false;
	const totalProjects = [ ...needChangelog, ...uniqueProjects ];
	for ( const proj of totalProjects ) {
		argv.args = [];
		argv.project = proj;
		console.log( chalk.green( `Running changelogger for ${ argv.project }` ) );
		await changelogArgs( argv );
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
	if ( response.comment ) {
		argv.pass.push( '-c', response.comment );
	}
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
	const removeArg = [ argv.project, ...projectTypes ];
	let file;

	if ( argv.auto ) {
		argv.args.push( ...argv.pass );
	}

	// Check for required command specific arguments.
	switch ( argv.args[ 0 ] ) {
		case 'add':
			console.log(
				"When writing your changelog entry, please use the format 'Subject: change description.'\n" +
					'Here is an example of a good changelog entry:\n' +
					'  Sitemaps: ensure that the Home URL is slashed on subdirectory websites.\n'
			);
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
		case 'squash':
			if ( typeof argv.file === 'undefined' ) {
				file = await promptForFile( argv );
			} else {
				file = argv.file;
			}
			argv.args = [ 'squash' ];
			await changeloggerSquash( argv, file );
			break;
	}

	// Remove the project from the list of args we're passing to changelogger.
	argv = await removeArgs( argv, removeArg );

	// Run the changelogger command.
	await changeloggerCli( argv );

	// Add any newly added changelog files.
	await gitAdd( argv );

	console.log( chalkJetpackGreen( argv.success ) );
}

/**
 * Handles squashing just the readme file.
 *
 * @param {object} argv - arguments passed as cli.
 * @param {string} file - what file we want to squash.
 */
async function changeloggerSquash( argv, file ) {
	const changelogContents =
		file === 'readme' ? fs.readFileSync( `projects/${ argv.project }/CHANGELOG.md` ) : null;
	try {
		if ( file === 'changelog' ) {
			console.log( 'Squashing changelog...' );
		}
		await changeloggerCli( argv );

		if ( file === 'readme' ) {
			console.log( 'Updating readme...' );
			await runCommand( 'tools/plugin-changelog-to-readme.sh', [ `${ argv.project }` ] );
		}
		console.log( chalk.green( 'Squash complete!' ) );
	} finally {
		if ( changelogContents !== null ) {
			fs.writeFileSync( `projects/${ argv.project }/CHANGELOG.md`, changelogContents );
		}
	}
	process.exit();
}

/**
 * Remove project from arguments list we pass to the changelogger.
 *
 * @param {object} argv - arguments passed as cli.
 * @param {Array} removeArg - the array of projects we want to remove.
 * @returns {argv} - the arguemnts.
 */
async function removeArgs( argv, removeArg ) {
	for ( const proj of removeArg ) {
		if ( argv.args.includes( proj ) ) {
			argv.args.splice( argv.args.indexOf( proj ), 1 );
		}
	}
	return argv;
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
	}
}

/**
 * Add new changelog files to git staging.
 *
 * @param {object} argv - the arguments passed.
 */
async function gitAdd( argv ) {
	const changelogPath = `projects/${ argv.project }/changelog`;
	const addedFiles = await child_process
		.spawnSync( 'git', [
			'-c',
			'core.quotepath=off',
			'ls-files',
			'--others',
			'--exclude-standard',
		] )
		.stdout.toString()
		.trim();
	for ( const file of addedFiles.split( '\n' ) ) {
		if ( path.dirname( file ) === changelogPath ) {
			await runCommand( 'git', [ 'add', file ] );
		}
	}
}

/**
 * Checks if changelog files are required.
 *
 * @returns {Array} matchedProjects - projects that need a changelog.
 */
async function checkChangelogFiles() {
	console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );

	// Bail if we're pushing to a release branch, like boost/branch-1.3.0
	let currentBranch = child_process.spawnSync( 'git', [ 'branch', '--show-current' ] );
	currentBranch = currentBranch.stdout.toString().trim();
	const branchReg = /\/branch-(\d+)\.(\d+)(\.(\d+))?/; // match example: jetpack/branch-1.2.3
	if ( currentBranch.match( branchReg ) ) {
		console.log( chalk.green( 'Release branch detected. No changelog required.' ) );
		return [];
	}

	const re = /^projects\/([^/]+\/[^/]+)\//; // regex matches project file path, ie 'project/packages/connection/..'
	const modifiedProjects = new Set();
	const changelogsAdded = new Set();
	let touchedFiles = child_process.spawnSync( 'git', [
		'-c',
		'core.quotepath=off',
		`diff`,
		`--no-renames`,
		`--name-only`,
		`--merge-base`,
		`origin/trunk`,
	] );
	touchedFiles = touchedFiles.stdout.toString().trim().split( '\n' );

	// Check for any existing changelog files.
	for ( const file of touchedFiles ) {
		const match = file.match( /^projects\/([^/]+\/[^/]+)\/changelog\// );
		if ( match ) {
			changelogsAdded.add( match[ 1 ] );
		}
	}

	// Check for any touched projects without a changelog.
	for ( const file of touchedFiles ) {
		const match = file.match( re );
		if ( match && ! changelogsAdded.has( match[ 1 ] ) ) {
			modifiedProjects.add( match[ 1 ] );
		}
	}

	return allProjects().filter( proj => modifiedProjects.has( proj ) );
}

/**
 * Checks if any projects already have a changelog file by that name.
 *
 * @param {string} fileName - what we want to name the file.
 * @param {Array} needChangelog - projects that need changelog.
 * @returns {argv}.
 */
function doesFilenameExist( fileName, needChangelog ) {
	let fileExists = false;
	for ( const proj of needChangelog ) {
		const projPath = path.join(
			fileURLToPath( new URL( './', import.meta.url ) ),
			`../../../projects/${ proj }/changelog/${ fileName }`
		);
		try {
			if ( fs.existsSync( projPath ) ) {
				console.log(
					chalk.red( `\r A changelog file in "${ proj }" is already named "${ fileName }".` )
				);
				fileExists = true;
			}
		} catch ( err ) {
			console.error( 'Error reading file', err );
		}
	}
	return fileExists;
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
		choices: [ 'add', 'validate', 'version', 'write', 'squash' ],
	} );
	argv.cmd = response.cmd;
	return argv;
}

/**
 * Prompts for for the readme
 *
 * @param {argv} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptForFile( argv ) {
	const response = await inquirer.prompt( {
		type: 'list',
		name: 'file',
		message: 'What are you looking to squash?',
		choices: [ 'readme', 'changelog' ],
	} );
	return response.file;
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
 * @param {Array} needChangelog - projects that need changelog.
 * @returns {argv}.
 */
async function promptChangelog( argv, needChangelog ) {
	const gitBranch = child_process
		.spawnSync( 'git', [ 'branch', '--show-current' ] )
		.stdout.toString()
		.trim()
		.replace( /\//g, '-' );
	console.log( gitBranch );
	const commands = await inquirer.prompt( [
		{
			type: 'string',
			name: 'changelogName',
			message: 'Name your change file:',
			default: gitBranch,
			validate: input => {
				const fileExists = doesFilenameExist( input, needChangelog );
				if ( fileExists ) {
					return 'Please choose another file name, or delete the file manually.';
				}
				return true;
			},
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
			name: 'comment',
			message:
				'You omitted the changelog entry, which is fine. But please comment as to why no entry is needed.',
			when: answers => answers.significance === 'patch' && answers.entry === '',
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
 * Prompts you for how you want changelogger to run (add to all projects or not, etc).
 *
 * @param {object} argv - the arguments passed.
 * @param {Array} needChangelog - files that need changelogs.
 * @param {Array} uniqueProjects - projects with unique changelog types.
 * @returns {argv}.
 */
async function changelogAddPrompt( argv, needChangelog, uniqueProjects ) {
	const totalProjects = [ ...needChangelog, ...uniqueProjects ];
	if ( uniqueProjects.length === 0 && needChangelog.length > 1 ) {
		const response = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'autoAdd',
				message: `Found ${ needChangelog.length } project(s) that need a changelog. Create and add same changelog to all projects?`,
			},
			{
				type: 'confirm',
				name: 'autoPrompt',
				message: 'Create changelog for each project individually?',
				when: answers => ! answers.autoAdd,
			},
		] );
		return response;
	}

	if ( totalProjects.length === 1 ) {
		const response = await inquirer.prompt( {
			type: 'confirm',
			name: 'autoPrompt',
			message: `Add changelog for ${ totalProjects[ 0 ] }?`,
		} );
		return response;
	}

	const response = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'autoAdd',
			message: `Found ${ needChangelog.length } projects that can accept the same changelog file.\n  Found ${ uniqueProjects.length } project(s) that requires manual configuration. \n  Add same changelog file to ${ needChangelog.length } project(s)?`,
		},
		{
			type: 'confirm',
			name: 'autoPrompt',
			message: 'Create changelog for each project individually?',
			when: answers => ! answers.autoAdd,
		},
	] );
	return response;
}
