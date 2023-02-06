import child_process from 'child_process';
import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { normalizeCleanArgv } from '../helpers/normalizeArgv.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject, { promptForType } from '../helpers/promptForProject.js';

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function cleanDefine( yargs ) {
	yargs.command(
		'clean [project] [include]',
		'Removes unversioned files and folder from a specific project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe:
						'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins, or "all"',
					type: 'string',
				} )
				.array( 'include' )
				.positional( 'include', {
					alias: 'i',
					describe: 'Files/folders to include for deletion',
					type: 'Array',
					choices: [ 'untracked', 'ignored', 'docker', 'node_modules', 'composer.lock', 'vendor' ],
				} )
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Clean all types of files everywhere in the monorepo',
				} )
				.option( 'dist', {
					type: 'boolean',
					description: 'Remove package manager directories (vendor, node_modules)',
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
	argv = await normalizeCleanArgv( argv );

	if ( argv.all ) {
		argv.project = '.';
		argv.include = [ 'untracked', 'ignored', 'docker', 'node_modules', 'composer.lock', 'vendor' ];
	}

	if ( argv.dist ) {
		argv.project = '.';
		argv.include = [ 'node_modules', 'vendor' ];
	}

	if ( argv.project ) {
		argv = await parseProj( argv );
	} else {
		argv = await promptProj( argv );
	}

	if ( argv.include ) {
		await parseToClean( argv );
	} else {
		await promptForClean( argv );
	}

	// Collect the files we want to clean.
	const allFiles = await collectAllFiles( argv.toClean, argv );
	const toCleanFiles = await collectCleanFiles( allFiles, argv.toClean );

	// Bail if there are no files to delete.
	if ( ! toCleanFiles.length ) {
		console.log( chalk.green( 'No files to delete!' ) );
		return;
	}

	// Confirm the deletion.
	const runConfirm = await confirmRemove( argv, toCleanFiles );
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
	console.error( chalk.green( 'Cleaning files! This may take awhile...' ) );
	for ( const file of toCleanFiles ) {
		console.log( `Cleaning ${ file }` );
		try {
			fs.rmSync( file, { recursive: true, force: true } );
		} catch ( e ) {
			// Although it looks like rmSync doesn't do any error reporting, it probably should.
			console.error( chalk.red( e.message ) );
			process.exit( 1 );
		}
	}

	// The `esm` module has an 'exit' handler that will re-create some node_modules dirs to save its cached data.
	// Register our own 'exit' handler to re-delete them after esm re-creates them, when applicable.
	const nodeModulesDirs = toCleanFiles.filter( file => file.match( /(^|\/)node_modules\/$/ ) );
	if ( nodeModulesDirs.length ) {
		process.on( 'exit', () => {
			for ( const file of nodeModulesDirs ) {
				fs.rmSync( file, { recursive: true, force: true } );
			}
		} );
	}

	console.log(
		chalk.green(
			`Clean completed! ${
				argv.project === '.' ? 'Everything' : argv.project
			} cleans up so nicely, doesn't it?`
		)
	);
}

/**
 * Returns list of files that we want to delete.
 *
 * @param {Array} allFiles - a list of all possible deletable files.
 * @param {Array} toClean - what kind of files we want to delete.
 * @returns {Array} deleteQueue - files that we want to delete.
 */
async function collectCleanFiles( allFiles, toClean ) {
	let deleteQueue = [];
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
			case 'ignored':
				deleteQueue.push( ...allFiles.other );
				break;
		}
	}

	// Remove any empty elements
	deleteQueue = deleteQueue.filter( file => {
		return file !== '';
	} );

	return deleteQueue;
}

/**
 * Gets list of files that could be deleted.
 *
 * @param {Array} toClean - files that we want to clean.
 * @param {object} argv - the arguments passed.
 * @returns {object} allFiles.
 */
async function collectAllFiles( toClean, argv ) {
	const allFiles = {
		untracked: [],
		docker: [],
		node_modules: [],
		vendor: [],
		composerLock: [],
		other: [],
		combined: [],
	};

	// Collect list of untracked files.
	if ( toClean.includes( 'untracked' ) ) {
		allFiles.untracked = child_process.execSync(
			`git -c core.quotepath=off ls-files ${ argv.project } --exclude-standard --directory --other`
		);
		allFiles.untracked = allFiles.untracked.toString().trim().split( '\n' );
	}

	// Collect list of all other gitignored files we may want to clean.
	allFiles.combined = child_process.execSync(
		`git -c core.quotepath=off ls-files ${ argv.project } --exclude-standard --directory --ignored --other`
	);

	allFiles.combined = allFiles.combined.toString().trim().split( '\n' );

	// If we want to clean up a checked in composer.lock file, ls-files won't work and we have to filter the files manually.
	if ( toClean.includes( 'composer.lock' ) && argv.project.startsWith( 'projects/plugins' ) ) {
		console.log(
			chalk.black.bgYellow(
				' Deleting a checked-in composer.lock file is probably not what you want to do! '
			)
		);
		console.log(
			chalk.yellow(
				`It's likely you want to use \`tools/composer-update-monorepo.sh --root-reqs ${
					argv.project === 'projects/plugins' ? argv.project + '/[name]' : argv.project
				}\` instead.`
			)
		);
		const response = await inquirer.prompt( {
			type: 'confirm',
			name: 'confirm',
			message: 'Delete checked in composer.lock files anyway?',
			default: false,
		} );
		if ( response.confirm ) {
			let composerLockFiles = child_process.execSync(
				`git -c core.quotepath=off ls-files projects/plugins/*/composer.lock`
			);
			composerLockFiles = composerLockFiles.toString().trim().split( '\n' );

			if ( argv.project !== 'projects/plugins' ) {
				composerLockFiles = composerLockFiles.filter( file => {
					return file === `${ argv.project }/composer.lock`;
				} );
			}

			allFiles.composerLock.push( ...composerLockFiles );
		}
	}

	for ( const file of allFiles.combined ) {
		if ( file.match( /^\.env$|^tools\/docker\// ) ) {
			allFiles.docker.push( file );
		} else if ( file.match( /(^|\/)node_modules\/$/ ) ) {
			allFiles.node_modules.push( file );
		} else if ( file.match( /(^|\/)vendor\/$/ ) ) {
			allFiles.vendor.push( file );
		} else if ( file.match( /(^|\/)composer\.lock$/ ) ) {
			allFiles.composerLock.push( file );
		} else {
			allFiles.other.push( file );
		}
	}

	return allFiles;
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
		return argv;
	}

	// If we're cleaning all.
	if ( argv.project === 'all' ) {
		argv.scope = 'all';
		argv.project = '.';
		return argv;
	}

	// If we're passing a specific project
	const allProj = allProjects();
	for ( const proj of allProj ) {
		if ( argv.project === proj ) {
			argv.scope = 'project';
			argv.project = `projects/${ argv.project }`;
			return argv;
		}
	}

	// If we're passing a type.
	const types = [ 'github-actions', 'js-packages', 'packages', 'plugins' ];
	for ( const type of types ) {
		if ( argv.project === type ) {
			argv.scope = 'type';
			argv.project = `projects/${ type }`;
			return argv;
		}
	}

	// Default - if none of the above match, switch to interactive mode.
	console.log( chalk.red( 'Invalid project type, defaulting to interactive mode' ) );
	delete argv.project;
	await promptProj( argv );
	return argv;
}

/**
 * Parse the included files we want to clean.
 *
 * @param {object} argv - the arguments passed.
 * @returns {object} argv.
 */
async function parseToClean( argv ) {
	argv.toClean = argv.include;
	return argv;
}

/**
 * Prompts for the scope, project and type if none were given.
 *
 * @param {object} argv - the arguments passed.
 * @returns {object} argv.
 */
async function promptProj( argv ) {
	argv = await promptForScope( argv );
	switch ( argv.scope ) {
		case 'project':
			argv = await promptForProject( argv );
			argv.project = `projects/${ argv.project }`;
			break;
		case 'type':
			argv = await promptForType( argv );
			argv.project = 'projects/' + argv.type;
			break;
		case 'all':
			argv.project = '.';
			break;
	}
	return argv;
}
/**
 * Confirm that we want to remove the listed files.
 *
 * @param {object} argv - the arguments passed.
 * @param {Array} toCleanFiles - files we want to clean.
 * @returns {object} response - response data.
 */
async function confirmRemove( argv, toCleanFiles ) {
	for ( const file of toCleanFiles ) {
		console.log( file );
	}

	let confirmMessage = 'Okay to delete the above files/folders?';
	if ( argv.dist ) {
		confirmMessage = 'Okay to delete all package manager directories (vendor and node_modules)?';
	}
	if ( argv.all && ! argv.cmd ) {
		confirmMessage =
			'You want to clean absolutely everything from the monorepo? (untracked files, node_modules, vendor, and git-ignored files?)';
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
 * @returns {argv} argv
 */
export async function promptForClean( argv ) {
	let promptProject = argv.project;
	if ( argv.project === '.' || argv.project === 'all' ) {
		promptProject = 'everywhere in the monorepo';
	}
	const response = await inquirer.prompt( [
		{
			type: 'checkbox',
			name: 'toClean',
			message: `What files and folders are you looking to delete for ${ promptProject }?`,
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
