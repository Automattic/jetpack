import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { readComposerJson } from '../helpers/json.js';
import { normalizeProject } from '../helpers/normalizeArgv.js';
import { projectTypes, allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';
import { runCommand } from '../helpers/runCommand.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

let changeloggerPath = null;

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
							} )
							.option( 'comment', {
								alias: 'c',
								describe: 'Changelog comment',
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
 * Checks if any projects have special changelog type configurations.
 *
 * @param {Array} needChangelog - files that need a changelog.
 * @returns {object} - Object containing types associated with each project.
 */
async function getProjectChangeTypes( needChangelog ) {
	const types = {};
	for ( const proj of needChangelog ) {
		const composerJSON = readComposerJson( proj );
		if (
			composerJSON.extra &&
			composerJSON.extra.changelogger &&
			composerJSON.extra.changelogger.types
		) {
			types[ proj ] = composerJSON.extra.changelogger.types;
		} else {
			types[ proj ] = 'default';
		}
	}
	return types;
}

/**
 * Run the changelog add wizard, which checks if multiple projects need changelogs.
 *
 * @param {argv} argv - the arguments passed.
 */
async function changelogAdd( argv ) {
	// If we already have all the information we need for a potentially-successful changelogger run, skip the prompts and just do it.
	if ( argv.project && argv.s && argv.t && argv.e ) {
		await changelogArgs( argv );
		return;
	}

	let needChangelog;
	const defaultProjects = [];
	const uniqueProjects = [];
	const defaultTypes = {
		security: 'Improves or modifies the security of the project.',
		added: 'Added new functionality.',
		changed: 'Changed existing functionality.',
		deprecated: 'Deprecated existing functionality.',
		removed: 'Removed existing functionality.',
		fixed: 'Fixed a bug.',
	};

	if ( argv.project ) {
		needChangelog = [ argv.project ];
	}

	// If we weren't passed a project, check if any projects need changelogs.
	if ( argv._[ 1 ] === 'add' && ! argv.project ) {
		needChangelog = await checkChangelogFiles();
		if ( needChangelog.length === 0 ) {
			console.log(
				chalk.green(
					'Did not detect a touched project that still needs a changelog. You can still add a changelog manually by running `jetpack changelog add <type/project>'
				)
			);
			return;
		}
	}

	const projectChangeTypes = await getProjectChangeTypes( needChangelog );

	// Iterate over the project types, and if it's not default, add it to uniqueProjects.
	for ( const proj in projectChangeTypes ) {
		if ( projectChangeTypes[ proj ] !== 'default' ) {
			uniqueProjects.push( proj );
		} else {
			defaultProjects.push( proj );
			projectChangeTypes[ proj ] = defaultTypes;
		}
	}

	// Confirm what projects we're adding a changelog to, and how we want to add them.
	const promptConfirm = argv.project
		? { separateChangelogFiles: true }
		: await changelogAddPrompt( argv, defaultProjects, uniqueProjects );

	if ( ! promptConfirm ) {
		console.log( 'Changelog command cancelled' );
		return;
	}

	if ( promptConfirm.separateChangelogFiles ) {
		uniqueProjects.unshift( ...defaultProjects.splice( 0 ) );
	}

	if ( defaultProjects.length > 0 ) {
		console.log(
			chalk.green(
				`Running changelogger for ${
					defaultProjects.length
				} project(s):\n\t${ defaultProjects.join( '\n\t' ) }`
			)
		);
		const response = await promptChangelog( argv, defaultProjects, defaultTypes );
		for ( const proj of defaultProjects ) {
			argv = await formatAutoArgs( proj, argv, response );
			await changelogArgs( argv );
		}
	}

	for ( const proj of uniqueProjects ) {
		console.log( chalk.green( `Running changelogger for ${ proj }!` ) );
		const response = await promptChangelog( argv, [ proj ], projectChangeTypes[ proj ] );
		argv = await formatAutoArgs( proj, argv, response );
		await changelogArgs( argv );
	}

	return;
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
			argv.args.push( '--no-interaction' );
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
	if ( ! changeloggerPath ) {
		changeloggerPath = path.resolve( 'projects/packages/changelogger/bin/changelogger' );
		let data = child_process.spawnSync( changeloggerPath, [], {
			stdio: 'ignore',
		} );
		if ( data.status !== 0 ) {
			console.debug( 'Preparing changelogger...' );
			child_process.spawnSync( 'composer', [ 'update' ], {
				cwd: path.resolve( 'projects/packages/changelogger' ),
				stdio: 'ignore',
			} );
			data = child_process.spawnSync( changeloggerPath, [], {
				stdio: 'ignore',
			} );
			if ( data.status !== 0 ) {
				throw new Error(
					"Failed to prepare changelogger. Try running 'jetpack install -v packages/changelogger'."
				);
			}
		}
	}

	const data = child_process.spawnSync( changeloggerPath, argv.args, {
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
	const branchReg = /\/branch-/; // match example: jetpack/branch-1.2.3
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
		const match = file.match( /^projects\/([^/]+\/[^/]+)\/changelog\/[^.]/ );
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
 * Validate that the project exists
 *
 * @param {object} argv - arguments passed to the wizard.
 * @param {string} dir - path to file we're adding changlog too.
 */
function validatePath( argv, dir ) {
	if ( ! fs.existsSync( dir ) ) {
		throw new Error( chalk.red( `Project doesn't exist! Typo?` ) );
	}
}

/**
 * Prompts for changelog command if not passed one.
 *
 * @param {argv} argv - the arguments passed.
 * @returns {argv}.
 */
async function promptCommand( argv ) {
	const response = await enquirer.prompt( {
		type: 'select',
		name: 'cmd',
		message: 'What changelogger command do you want to run?',
		choices: [ 'add', 'validate', 'version', 'write', 'squash' ],
	} );
	argv.cmd = response.cmd;
	return argv;
}

/**
 * Prompts for the file to squash.
 *
 * @returns {string} 'readme' or 'changelog'.
 */
async function promptForFile() {
	const response = await enquirer.prompt( {
		type: 'select',
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
	const response = await enquirer.prompt( {
		type: 'select',
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
 * @param {object} types - the changelog types for the projects.
 *
 * @returns {argv}.
 */
async function promptChangelog( argv, needChangelog, types ) {
	const gitBranch = child_process
		.spawnSync( 'git', [ 'branch', '--show-current' ] )
		.stdout.toString()
		.trim()
		.replace( /\//g, '-' );
	const maxLength = Object.keys( types ).reduce( ( a, v ) => ( v.length > a ? v.length : a ), 0 );
	const typeChoices = Object.entries( types ).map( ( [ value, name ] ) => ( {
		value,
		name: `[${ value.padEnd( maxLength, ' ' ) }] ${ name }`,
	} ) );
	// Get the changelog name.
	const { changelogName } = await enquirer.prompt( {
		type: 'input',
		name: 'changelogName',
		message: 'Name your changelog file:',
		default: argv.f ?? gitBranch,
		validate: input => {
			const fileExists = doesFilenameExist( input, needChangelog );
			if ( fileExists ) {
				return 'Filename exists already. Please choose another file name, or delete the file existing manually.';
			}
			return true;
		},
	} );

	// Get the significance.
	const { significance } = await enquirer.prompt( {
		type: 'autocomplete',
		name: 'significance',
		message: 'Significance of the change, in the style of semantic versioning.',
		suggest: ( input, choices ) => choices.filter( choice => choice.value.startsWith( input ) ),
		initial() {
			return this.choices.findIndex( v => v.value === argv.s );
		},
		highlight: v => v,
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
	} );

	const userFacingResponse = await enquirer.prompt( {
		type: 'confirm',
		name: 'userFacing',
		message:
			'Is this change something an end user or site administrator of a standalone Jetpack site would like to know about?',
		initial: argv.t !== 'other',
		skip: ! needChangelog.includes( 'plugins/jetpack' ),
	} );

	// Get the type, set it to other if this isn't a user facing change.
	let typeResponse;
	if ( ! userFacingResponse.userFacing && typeChoices.findIndex( v => v.value === 'other' ) >= 0 ) {
		typeResponse = { type: 'other' };
	} else {
		// Get the type of change.
		typeResponse = await enquirer.prompt( {
			type: 'autocomplete',
			name: 'type',
			message: 'Type of change.',
			suggest: ( input, choices ) => choices.filter( choice => choice.value.startsWith( input ) ),
			highlight: v => v,
			choices: typeChoices,
			initial: typeChoices.findIndex( v => v.value === argv.t ),
		} );
	}
	const { type } = typeResponse;

	console.log(
		chalk.yellow(
			"When writing your changelog entry, please use the format 'Subject: change description.'\n" +
				'Here is an example of a good changelog entry:\n' +
				'  Sitemaps: ensure that the Home URL is slashed on subdirectory websites.\n'
		)
	);

	// Get the entry, if it's a patch type it can be left blank.
	let entryResponse;
	if ( significance !== 'patch' ) {
		entryResponse = await enquirer.prompt( {
			type: 'input',
			name: 'entry',
			message: 'Changelog entry. May not be empty.',
			initial: argv.e,
			validate: input => {
				if ( ! input || ! input.trim() ) {
					return `Changelog entry can't be blank`;
				}
				return true;
			},
		} );
	} else {
		entryResponse = await enquirer.prompt( {
			type: 'input',
			name: 'entry',
			message: 'Changelog entry. May be left empty if this change is particularly insignificant.',
			initial: argv.e,
		} );
	}
	const { entry } = entryResponse;

	// Get the comment if the entry is left blank for a patch level change.
	let commentResponse;
	if ( entry === '' ) {
		commentResponse = await enquirer.prompt( {
			type: 'input',
			name: 'comment',
			message:
				'You omitted the changelog entry, which is fine. But please comment as to why no entry is needed.',
			initial: argv.c,
		} );
	}
	const { comment } = commentResponse || {};

	return {
		changelogName,
		significance,
		type,
		entry,
		comment,
	};
}

/**
 * Prompts you for how you want changelogger to run (add to all projects or not, etc).
 *
 * @param {object} argv - the arguments passed.
 * @param {Array} defaultProjects - projects that use the default changelog types.
 * @param {Array} uniqueProjects - projects with unique changelog types.
 * @returns {argv}.
 */
async function changelogAddPrompt( argv, defaultProjects, uniqueProjects ) {
	const totalProjects = [ ...defaultProjects, ...uniqueProjects ];
	let prompts;

	// Determine if we can add the same changelog file to all, or if we need to add them individually.
	if ( totalProjects.length === 1 ) {
		prompts = {
			type: 'confirm',
			name: 'separateChangelogFiles',
			message: `Add a changelog for ${ totalProjects[ 0 ] }?`,
			initial: true,
		};
	} else if ( defaultProjects.length <= 1 && uniqueProjects.length > 0 ) {
		prompts = {
			type: 'confirm',
			name: 'separateChangelogFiles',
			message: `Found ${ totalProjects.length } project(s) that need a changelog. Create a changelog for each one?`,
			initial: true,
		};
	} else if ( defaultProjects.length > 0 && uniqueProjects.length === 0 ) {
		prompts = [
			{
				type: 'confirm',
				name: 'sameChangelogFiles',
				message: `Found ${ defaultProjects.length } project(s) that need a changelog. Create and add the same changelog to all of them?`,
				initial: true,
			},
			{
				type: 'confirm',
				name: 'separateChangelogFiles',
				message: 'Create a changelog for each project individually?',
				initial() {
					return this.skipped ? undefined : true; // https://github.com/enquirer/enquirer/issues/340
				},
				skip() {
					return this.state.answers.sameChangelogFiles;
				},
			},
		];
	} else {
		prompts = [
			{
				type: 'confirm',
				name: 'sameChangelogFiles',
				message: `Found ${ defaultProjects.length } project(s) that can accept the same changelog and ${ uniqueProjects.length } project(s) that need individual ones. Create and add the same changelog to the ones we're able?`,
				initial: true,
			},
			{
				type: 'confirm',
				name: 'separateChangelogFiles',
				message: 'Create a changelog for each project individually?',
				initial() {
					return this.skipped ? undefined : true; // https://github.com/enquirer/enquirer/issues/340
				},
				skip() {
					return this.state.answers.sameChangelogFiles;
				},
			},
		];
	}
	const response = await enquirer.prompt( prompts );
	if ( ! response.sameChangelogFiles && ! response.separateChangelogFiles ) {
		return false;
	}
	return response;
}
