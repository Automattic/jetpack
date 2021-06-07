/**
 * External dependencies
 */
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import promptForProject, { promptForType } from '../helpers/promptForProject';
import { normalizeCleanArgv } from '../helpers/normalizeArgv';
import { runCommand } from '../helpers/runCommand';
import { allProjects } from '../helpers/projectHelpers';

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
	argv = normalizeCleanArgv( argv );

	// Handle cleaning everything.
	if ( argv.all ) {
		// Bail if we don't get confirmation.
		const runConfirm = await confirmRemove( argv );
		if ( ! runConfirm.confirm ) {
			return;
		}
		await cleanAll( argv );
		return;
	}

	// Handle cleaning build files (node_modules and vendor).
	if ( argv.dist ) {
		const runConfirm = await confirmRemove( argv );
		if ( ! runConfirm.confirm ) {
			return;
		}
		await distClean( argv );
		return;
	}

	// Handle the scope and project we want to work with
	if ( argv.project ) {
		await parseProj( argv );
	} else {
		await promptProj( argv );
	}

	// Handle what files we want to delete.
	if ( argv.include ) {
		await parseToClean( argv );
	} else {
		await promptForClean( argv );
	}
	await makeOptions( argv );
	await commandRoute( argv );

	return;
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
	const ignoreChoices = [
		{
			name: 'vendor',
			checked: false,
		},
		{
			name: 'node_modules',
			checked: false,
		},
	];
	// Composer.lock is checked in for root and plugins, so don't show option to remove for those cases.
	if ( argv.project !== 'projects/plugins' ) {
		ignoreChoices.push( {
			name: 'composer.lock',
			checked: false,
		} );
	}
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'toClean',
			message: `What untracked files and folders are you looking to delete for ${ promptProject }?`,
			choices: [
				{
					name: 'Working Files/Folders (Only).',
					value: 'working',
				},
				{
					name: 'Git-Ignored Files (Only).',
					value: 'ignored',
				},
				{
					name: 'Both Working/Git-Ignored',
					value: 'both',
				},
				...ignoreChoices,
			],
		},
		{
			type: 'checkbox',
			name: 'ignored',
			message: `Delete any of the following? (you will need to run 'jetpack install ${ argv.project }' to reinstall them)`,
			choices: ignoreChoices,
			when: answers => answers.toClean === 'both' || answers.toClean === 'ignored',
		},
	] );
	argv.include = { ...response };
	return argv;
}
