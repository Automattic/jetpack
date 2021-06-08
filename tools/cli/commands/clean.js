/**
 * External dependencies
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import child_process from 'child_process';

/**
 * Internal dependencies
 */
import promptForProject, { promptForType } from '../helpers/promptForProject';
import { normalizeCleanArgv } from '../helpers/normalizeArgv';
import { runCommand } from '../helpers/runCommand';
import { allProjects } from '../helpers/projectHelpers';
import fs from 'fs';

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function cleanDefine( yargs ) {
	yargs.command(
		'clean [project]',
		'Removes unversioned files and folder from a specific project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.positional( 'include', {
					alias: 'i',
					describe: 'Files/folders to include for deletion',
					type: 'string',
					choices: [ 'node_modules', 'composer.lock', 'vendor', 'working', 'ignored' ],
				} )
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Remove everything from monorepo root',
				} )
				.option( 'dist', {
					type: 'boolean',
					description: 'Remove distributed files (vendor, node_modules)',
				} );
		},
		async argv => {
			await cleanCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handle args for clean command.
 *
 * @param {argv}  argv - the arguments passed.
 */
export async function cleanCli( argv ) {
	if ( argv.project ) {
		await parseProj( argv );
	} else {
		await promptProj( argv );
	}

	if ( argv.include ) {
		await parseToClean( argv );
	} else {
		await promptForClean( argv );
	}

	const allFiles = await collectAllFiles( argv.toClean );
	const toCleanFiles = await collectCleanFiles( allFiles, argv.toClean );
	const runConfirm = await confirmRemove( argv );

	if ( ! runConfirm.confirm ) {
		console.log( chalk.red( 'Cancelling jetpack clean.' ) );
		return;
	}

	await cleanFiles( toCleanFiles, argv );
	return;
}

/**
 * Delete the files that we want.
 *
 * @param {Array} toCleanFiles - files that we want to clean.
 * @param {object} argv - the arguments passed.
 */
async function cleanFiles( toCleanFiles, argv ) {
	for ( const file of toCleanFiles ) {
		fs.rm( file, { recursive: true, force: true }, ( err ) => {
			console.log( 'Cleaning ', file );
			if ( err ) {
				// File deletion failed
				console.error( err.message );
				return;
			}
		} );
	}

	// Cleanup root and tools node_modules folder if that's what we're deleting.
	if ( argv.scope === 'all' && argv.toClean.includes( 'node_modules' ) ) {
		process.on( 'exit', async () => {
			await runCommand( 'rm', [ '-rf', 'node_modules', 'tools/cli/node_modules' ] );
		} );
	}
}
/**
 * Returns list of files that we want to delete.
 *
 * @param {Array} allFiles - a list of all possible deletable files.
 * @param {Array} toClean - what kind of files we want to delete.
 * @returns {Array} deleteQueue - files that we want to delete.
 */
async function collectCleanFiles( allFiles, toClean ) {
	const deleteQueue = [];
	for ( const file of toClean ) {
		switch ( file ) {
			case 'untracked':
				deleteQueue.push( ...allFiles.untracked );
				break;
			case 'docker':
				deleteQueue.push( ...allFiles.docker );
				break;
			case 'node_modules':
				deleteQueue.push( ...allFiles.node_modules );
				break;
			case 'composer.lock':
				deleteQueue.push( ...allFiles.composerLock );
				break;
			case 'vendor':
				deleteQueue.push( ...allFiles.vendor );
				break;
			case 'other':
				deleteQueue.push( ...allFiles.other );
				break;
		}
	}

	for ( const file of deleteQueue ) {
		console.log( file );
	}

	return deleteQueue;
}
/**
 * Gets list of files that could be deleted.
 *
 * @param {Array} toClean - files that we want to clean.
 * @returns {object} allFiles.
 */
async function collectAllFiles( toClean ) {
	const allFiles = {
		untracked: [],
		docker: [],
		node_modules: [],
		vendor: [],
		composerLock: [],
		other: [],
		combined: [],
	};

	if ( toClean.includes( 'untracked' ) ) {
		allFiles.untracked = child_process.execSync( 'git ls-files --exclude-standard --directory --other' );
		allFiles.untracked = allFiles.untracked.toString().trim().split( '\n' );
	}

	allFiles.other = child_process.execSync( 'git ls-files --exclude-standard --directory --ignored --other' );
	allFiles.other = allFiles.other.toString().trim().split( '\n' );

	allFiles.combined = allFiles.untracked.concat( allFiles.other );

	for ( const file of allFiles.combined ) {
		if ( file.match( /^\.env$|^tools\/docker\// ) ) {
			allFiles.docker.push( file );
			allFiles.other.splice( allFiles.other.indexOf( file ) );
		}
		if ( file.match( /(^|\/)node_modules\/$/ ) ) {
			allFiles.node_modules.push( file );
			allFiles.other.splice( allFiles.other.indexOf( file ) );
		}
		if ( file.match( /(^|\/)vendor\/$/ ) ) {
			allFiles.vendor.push( file );
			allFiles.other.splice( allFiles.other.indexOf( file ) );
		}
		if ( file.match( /(^|\/)composer\.lock$/ ) ) {
			allFiles.composerLock.push( file );
			allFiles.other.splice( allFiles.other.indexOf( file ) );
		}
	}

	return allFiles;
}

/**
 * Clean all build files.
 *
 * @param {object} argv - arguments passed.
 */
async function distClean( argv ) {
	argv.scope = 'all';
	argv.project = '.';
	argv.include = {};

	console.log( chalk.green( `Cleaning build files (this may take awhile)...` ) );
	// Clean node_modules.
	argv.include.toClean = 'node_modules';
	argv.cmd = 'rm';
	await makeRemove( argv );
	await runCommand( argv.cmd, argv.options );

	// Clean vendor.
	argv.include.toClean = 'vendor';
	argv.cmd = 'rm';
	await makeRemove( argv );
	await runCommand( argv.cmd, argv.options );

	return;
}

/**
 * Clean everything (except checked in composer.lock)
 *
 * @param {object} argv - arguments passed.
 */
async function cleanAll( argv ) {
	// Clean node modules and vendor
	await distClean( argv );

	//Clean any untracked and working files
	argv.cmd = 'git';
	argv.include.toClean = 'both';
	argv.include.ignored = [ 'vendor', 'node_modules' ];
	await makeOptions( argv );
	await commandRoute( argv );
	return;
}

/**
 * Handle prepping the commands before routing to run the command.
 *
 * @param {object} argv - arguments passed.
 */
async function commandRoute( argv ) {
	// Dry Run
	if ( argv.cmd === 'find' ) {
		await runCommand( argv.cmd, argv.dryOptions );
	} else {
		await runCommand( argv.cmd, [ ...argv.options, '-n' ] ); // dry run
		if ( argv.include.toClean === 'both' ) {
			runCommand( argv.cmd, [ `clean`, argv.project, '-n' ] );
		}
	}
	// Confirm we want to delete.
	const runConfirm = await confirmRemove( argv );

	// Live Commands
	if ( runConfirm.confirm ) {
		console.log( chalk.green( `Cleaning files (this may take awhile)...` ) );
		// For tracked files using 'rm -rf'
		if ( argv.cmd === 'find' ) {
			( argv.cmd = 'rm' ), ( argv = await makeRemove( argv ) );
			await runCommand( argv.cmd, argv.options );
		}

		// For untracked files using 'git clean'
		if ( argv.cmd === 'git' ) {
			await runCommand( argv.cmd, [ `clean`, ...argv.options, '-f' ] ); // do it live.
			if ( argv.include.toClean === 'both' ) {
				console.log( chalk.green( 'Cleaning working files...' ) );
				await runCommand( argv.cmd, [ `clean`, ...argv.project, '-f' ] );
			}
		}

		// Cleanup any remaining node_modules folders on process exit if that's what we're cleaning
		if ( argv.include.toClean === 'node_modules' ) {
			process.on( 'exit', async () => {
				await runCommand( 'rm', [ '-rf', 'node_modules', 'tools/cli/node_modules' ] );
			} );
		}

		// Success message
		if ( argv.project === '.' ) {
			argv.project = 'Everything';
		}
		console.log(
			chalk.green( `Clean completed! ${ argv.project } cleans up so nicely, doesn't it?` )
		);
	}
}

/**
 * Parse passed project paramater.
 *
 * @param {object} argv - the arguments passed.
 * @returns {object} argv.
 */
async function parseProj( argv ) {
	//Bail if we've specified the 'all' option already.
	if ( argv.project === '.' ) {
		argv.scope = 'all';
		return;
	}

	// If we're cleaning all.
	if ( argv.project === 'all' ) {
		argv.scope = 'all';
		argv.project = '.';
		return;
	}

	// If we're passing a specific project
	const allProj = allProjects();
	for ( const proj of allProj ) {
		if ( argv.project === proj ) {
			argv.scope = 'project';
			argv.project = `projects/${ argv.project }`;
			return;
		}
	}

	// If we're passing a type.
	const types = [ 'github-actions', 'js-packages', 'packages', 'plugins' ];
	for ( const type of types ) {
		if ( argv.project === type ) {
			argv.scope = 'type';
			argv.project = `projects/${ type }`;
			return;
		}
	}

	// Default - if none of the above match, switch to interactive mode.
	console.log( chalk.red( 'Invalid project type, defaulting to interactive mode' ) );
	delete argv.project;
	await promptProj( argv );
	return;
}

/**
 * Parse the included files we want to clean.
 *
 * @param {object} argv - the arguments passed.
 * @returns {object} argv.
 */
async function parseToClean( argv ) {
	argv.include = { toClean: argv.include };
	if ( argv.include.toClean === 'ignored' ) {
		argv.include.ignored = [ 'vendor', 'node_modules' ];
	}
	return argv;
}

/**
 * Compiles options depending on the command we need to run.
 *
 * @param {object} argv - arguments passed.
 * @returns {object} argv.
 */
export async function makeOptions( argv ) {
	if (
		argv.include.toClean === 'vendor' ||
		argv.include.toClean === 'node_modules' ||
		argv.include.toClean === 'composer.lock'
	) {
		argv.options = [ '-rf' ];
		argv.cmd = 'find'; // For dry run first.
		argv = await makeRemove( argv );
	} else {
		argv.options = [ 'clean' ];
		argv.cmd = 'git';
		argv = await makeClean( argv );
	}
	return argv;
}

/**
 * For running git clean to remove untracked files.
 *
 * @param {object} argv - arguments passed.
 * @returns {object} argv.
 */
async function makeClean( argv ) {
	if ( argv.scope === 'project' ) {
		argv.project = `projects/${ argv.project }`;
	}
	argv.options.push( argv.project );

	// If we're running in root, we need to flag we want to remove files in subdirectories.
	if ( argv.project === '.' ) {
		argv.options.push( '-d' );
	}

	if ( argv.include.toClean === 'ignored' || argv.include.toClean === 'both' ) {
		argv.options.push( '-X' );
		await checkExclude( argv.include.ignored, argv.options );
	}

	// Add any ignored files that we want to delete.
	if ( ! argv.include.ignored ) {
		argv.include.ignored = [];
	}

	return argv;
}

/**
 * For running rm -rf to remove specific tracked files.
 *
 * @param {object} argv - arguments passed.
 * @returns {object} argv.
 */
async function makeRemove( argv ) {
	const toClean = argv.include.toClean;
	if ( argv.cmd === 'find' ) {
		if ( argv.scope === 'project' ) {
			argv.project = `projects/${ argv.project }`;
		}
		argv.dryOptions = [ argv.project, '-name', toClean, '-prune' ];
		return argv;
	}

	if ( argv.cmd === 'rm' ) {
		switch ( argv.scope ) {
			case 'project':
				argv.options.push( `projects/${ argv.project }/${ toClean }` );
				break;
			case 'type':
				argv.options.push( `${ argv.project }/*/${ toClean }` );
				break;
			case 'all':
				argv.cmd = 'find';
				argv.options = [
					'.',
					'-name',
					`"${ toClean }"`,
					'-prune',
					'-print',
					'-exec',
					'rm',
					'-rf',
					'{}',
					'+',
				];
		}
	}
	return argv;
}

/**
 * Excludes files that we don't want to delete.
 *
 * @param {Array} toDelete - files that are gitignored that we want to delete.
 * @param {Array} options - the git clean options.
 * @returns {Array} options.
 */
async function checkExclude( toDelete, options ) {
	const defaultIgnored = [ 'vendor', 'composer.lock', 'node_modules' ];
	for ( const fileFolder of defaultIgnored ) {
		if ( ! toDelete.includes( fileFolder ) ) {
			options.push( `-e` );
			options.push( `!${ fileFolder }` );
		}
	}
	return options;
}

/**
 * Prompts for the scope, project and type if none were given.
 *
 * @param {object} argv - the arguments passed.
 */
async function promptProj( argv ) {
	argv = await promptForScope( argv );
	switch ( argv.scope ) {
		case 'project':
			argv = await promptForProject( argv );
			break;
		case 'type':
			argv = await promptForType( argv );
			argv.project = 'projects/' + argv.type;
			break;
		case 'all':
			argv.project = '.';
			break;
	}
	return;
}
/**
 * Confirm that we want to remove the listed files.
 *
 * @param {object} argv - the arguments passed.
 * @returns {object} response - response data.
 */
async function confirmRemove( argv ) {
	let confirmMessage = 'Okay to delete the above files/folders?';
	if ( argv.dist ) {
		confirmMessage = 'Okay to delete all built files (node_modules and vendor)?';
	}
	if ( argv.all && ! argv.cmd ) {
		confirmMessage =
			'You want to clean absolutely everything from the monorepo? (working files, node_modules, vendor, and git-ignored files?)';
	}
	const response = await inquirer.prompt( {
		type: 'confirm',
		name: 'confirm',
		message: chalk.green( confirmMessage ),
	} );

	return response;
}

/**
 * Prompts for the scope of what we want to clean.
 *
 * @param {argv}  argv - the arguments passed.
 *
 * @returns {object} argv
 */
export async function promptForScope( argv ) {
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'scope',
			message: 'What are you trying to clean?',
			choices: [
				{
					name: '[Project] - Specific project (plugins/jetpack, etc)',
					value: 'project',
				},
				{
					name: '[Type   ] - Everything in a project type (plugins, packages, etc)',
					value: 'type',
				},
				{
					name: '[All    ] - Everything in the monorepo',
					value: 'all',
				},
			],
		},
	] );
	argv.scope = response.scope;
	return argv;
}

/**
 * Prompts for what we're trying to clean (files, folder, gitignored, etc).
 *
 * @param {argv}  argv - the arguments passed.
 *
 * @returns {argv} argv
 */
export async function promptForClean( argv ) {
	let promptProject = argv.project;
	if ( argv.project === '.' || argv.project === 'all' ) {
		promptProject = 'the monorepo root';
	}
	const response = await inquirer.prompt( [
		{
			type: 'checkbox',
			name: 'toClean',
			message: `What untracked files and folders are you looking to delete for ${ promptProject }?`,
			choices: [
				{
					name: 'Untracked Files',
					value: 'untracked',
				},
				{
					name: 'Other Ignored Files',
					value: 'ignored',
				},
				{
					name: 'Docker Environment',
					value: 'docker',
				},
				{
					name: 'node_modules',
					value: 'node_modules',
				},
				{
					name: 'composer.lock',
					value: 'composer.lock',
				},
				{
					name: 'vendor',
					value: 'vendor',
				},
			],
		},
	] );
	argv.toClean = response.toClean;
	return argv;
}
// Choose which directory we want
// Choose what to delete
// Get a list of files that could be chosen for deletion
// Filter those files based on what we chose
// Display the files that would be deleted.
// Remove them.