/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import promptForProject, { promptForType } from '../helpers/promptForProject';
import { normalizeCleanArgv } from '../helpers/normalizeArgv';

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
				.option( 'ignored', {
					alias: 'i',
					type: 'boolean',
					description: 'Remove git ignored files',
				} )
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Remove all unversioned files from the entire monorepo ',
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
	if ( argv.all ) {
		argv.project = '.';
	}
	if ( ! argv.project ) {
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
	}
	await promptForClean( argv );
	await makeOptions( argv );
	console.log( argv );
	await runCommand( argv, '-n' ); // dry run
	const runConfirm = await confirmRemove();
	if ( runConfirm ) {
		console.log( `Doin' it live` );
		//await runCommand( argv, '-f' ); // do it live.
	}
	return;
}

/**
 * Compiles options for git clean.
 *
 * @param {object} argv - arguments passed.
 * @returns {object} argv.
 */
export async function makeOptions( argv ) {
	argv.options = [ 'clean' ];

	// If we're running in root, we need to flag we want to remove files in subdirectories.
	if ( argv.project === '.' ) {
		argv.options.push( '-d' );
	} else {
		argv.options.push( argv.project );
	}

	// Add option to remove git ignored files.
	if ( argv.clean.toClean !== 'working' ) {
		argv.options.push( argv.clean.toClean );
	}

	// Add any ignored files that we want to delete.
	if ( ! argv.clean.ignoreInclude ) {
		argv.clean.ignoreInclude = [];
	}
	await addIgnored( argv.clean.ignoreInclude, argv.options );

	return argv;
}

/**
 * Excludes files that we don't want to delete.
 *
 * @param {Array} ignoreInclude - files that are gitignored that we want to delete.
 * @param {Array} options - the git clean options.
 * @returns {Array} options.
 */
async function addIgnored( ignoreInclude, options ) {
	const defaultIgnored = [ 'vendor', 'composer.lock', 'node_modules' ];
	for ( const toDelete of defaultIgnored ) {
		if ( ! ignoreInclude.includes( toDelete ) ) {
			options.push( `-e "\!${ toDelete }"` ); //todo: add eslint ignore for backslash which prevents potential bash history substitution issues.
		}
	}
	return options;
}

/**
 * Runs the actual command.
 *
 * @param {object} argv - the arguments passed.
 * @param {string} mode - specifies dry run (-n) or force (-f).
 */
export async function runCommand( argv, mode ) {
	const data = child_process.spawnSync( `git`, [ ...argv.options, mode ], {
		stdio: 'inherit',
	} );

	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error( chalk.red( argv.error ) );
		process.exit( data.status );
	}
}

/**
 * Confirm that we want to remove the listed files.
 *
 * @returns {object} response - response data.
 */
async function confirmRemove() {
	const response = await inquirer.prompt( {
		type: 'confirm',
		name: 'confirm',
		message: 'Okay to delete the above files/folders?',
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
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'toClean',
			message: `What untracked files and folders are you looking to delete for ${
				argv.all ? 'the monorepo root' : argv.project
			}?`,
			choices: [
				{
					name: 'Only working files/folders.',
					value: 'working',
				},
				{
					name: 'Only git-ignored files/folders.',
					value: '-X',
				},
				{
					name: 'Both working files and git-ignored files/folders',
					value: '-x',
				},
			],
		},
		{
			type: 'confirm',
			name: 'folders',
			value: '-d',
			default: true,
			message: `Do you wish to delete folders/files within root subdirectories as well?`,
			when: argv.type === 'all',
		},
		{
			type: 'checkbox',
			name: 'ignoreInclude',
			message: `Delete any of the following? (you will need to run 'jetpack install ${ argv.project }' to reinstall them)`,
			choices: [
				{
					name: 'vendor',
					checked: false,
				},
				{
					name: 'node_modules',
					checked: false,
				},
				{
					name: 'composer.lock',
					checked: false,
				},
			],
			when: answers => answers.toClean !== 'working',
		},
	] );
	argv.clean = { ...response };
	return argv;
}
