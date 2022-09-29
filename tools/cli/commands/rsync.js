import fs from 'fs';
import path from 'path';
import process from 'process';
import chalk from 'chalk';
import Configstore from 'configstore';
import execa from 'execa';
import inquirer from 'inquirer';
import watch from 'node-watch';
import tmp from 'tmp';
import { projectDir } from '../helpers/install.js';
import { listProjectFiles } from '../helpers/list-project-files.js';
import { allProjectsByType, dirs } from '../helpers/projectHelpers.js';
import { runCommand } from '../helpers/runCommand.js';

const rsyncConfigStore = new Configstore( 'automattic/jetpack-cli/rsync' );

/**
 * Escapes dots in a string. Useful when saving destination as key in Configstore. Otherwise it tries strings with dots
 * as nested objects.
 *
 * @param { string } key - String of the destination key.
 * @returns { string } - Returns the key with escaped periods.
 */
function escapeKey( key ) {
	return key.replace( /\./g, '\\.' );
}

/**
 * Stores the destination in the configstore.
 * Takes an optional alias arg.
 *
 * @param { string } dest - Destination path.
 * @param { string|false } alias - Alias key, if set.
 */
function setRsyncDest( dest, alias = false ) {
	const key = alias || dest;
	rsyncConfigStore.set( escapeKey( key ), dest );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function rsyncInit( argv ) {
	argv = await promptForPlugin( argv );
	argv = await promptForDest( argv );
	const sourcePluginPath = projectDir( `plugins/${ argv.plugin }` ) + '/';
	argv.dest = path.join( argv.dest, argv.plugin + '/' );

	if ( true === argv.watch ) {
		console.log( chalk.yellow( `Watching for changes in ${ argv.plugin } to rsync` ) );
		watch( sourcePluginPath, { recursive: true }, ( eventType, fileName ) => {
			if ( fileName && 'update' === eventType ) {
				if ( argv.v ) {
					console.log( chalk.yellow( `Changed detected in ${ fileName }...` ) );
				}
				rsyncToDest( sourcePluginPath, argv.dest );
			}
		} );
	} else {
		await rsyncToDest( sourcePluginPath, argv.dest );
	}
}

/**
 * Function that does the actual work of rsync.
 *
 * @param {string} source - Source path.
 * @param {string} dest - Destination path.
 * @returns {Promise<void>}
 */
async function rsyncToDest( source, dest ) {
	const filters = new Set();

	// Include just the files that are published to the mirror.
	for await ( let file of listProjectFiles( source, execa ) ) {
		// Rsync requires we also list all the directories containing the file.
		let prev;
		do {
			// Rsync differentiates literal strings vs patterns by looking for `[`, `*`, and `?`.
			// Only patterns use backslash escapes, literal strings do not.
			filters.add( '+ /' + ( file.match( /[[*?]/ ) ? file.replace( /[[*?\\]/g, '\\$&' ) : file ) );
			prev = file;
			file = path.dirname( file ) + '/';
		} while ( file !== '/' && file !== './' && file !== prev );
	}

	// Exclude anything not included above.
	filters.add( '- *' );

	const tmpFileName = tmp.tmpNameSync();
	fs.writeFileSync( tmpFileName, [ ...filters ].join( '\r\n' ) );
	try {
		await runCommand( 'rsync', [
			'-azLKPv',
			'--prune-empty-dirs',
			'--delete',
			'--delete-after',
			'--delete-excluded',
			`--include-from=${ tmpFileName }`,
			source,
			dest,
		] );

		await promptForRsyncConfig( dest );
	} catch ( e ) {
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		process.exit( 1 );
	}
}

/**
 * Prompts for config file.
 *
 * @param { string } dest - Passthrough of the argv object.
 */
async function promptForRsyncConfig( dest ) {
	if ( rsyncConfigStore.has( escapeKey( dest ) ) ) {
		return;
	}
	const createPrompt = await inquirer.prompt( {
		name: 'createConfig',
		type: 'list',
		message: `No saved entries for ${ dest }. Create one for easier use later?`,
		choices: [ 'Hell yeah!', 'Nah' ],
	} );
	if ( createPrompt.createConfig === 'Hell yeah!' ) {
		await promptForSetAlias( dest );
	}
}

/**
 * Prompt to set the destination alias.
 *
 * @param { string } dest - String to destination path.
 */
async function promptForSetAlias( dest ) {
	const aliasSetPrompt = await inquirer.prompt( {
		name: 'alias',
		type: 'input',
		message: 'Enter an alias for easier reference? (Press enter to skip.)',
	} );
	const alias = aliasSetPrompt.alias || dest;
	setRsyncDest( dest, alias );
}

/**
 * Prompts for the destination path.
 *
 * @param {object} argv - Passthrough of the argv object.
 * @returns {object} argv object with the project property.
 */
async function promptForDest( argv ) {
	if ( validateDest( argv.dest ) ) {
		return argv;
	}
	const savedDests = Object.keys( rsyncConfigStore.all );
	savedDests.unshift( 'Create new' );
	console.log( savedDests );
	let response = await inquirer.prompt( {
		name: 'dest',
		type: 'list',
		message: 'Choose destination:',
		choices: savedDests,
		validate: input => validateDest( input ),
	} );
	if ( 'Create new' === response.dest ) {
		response = await inquirer.prompt( {
			name: 'dest',
			type: 'input',
			message: 'Input destination path to the plugins dir: ',
			validate: input => validateDest( input ),
		} );
		argv.dest = response.dest;
	} else {
		argv.dest = rsyncConfigStore.get( escapeKey( response.dest ) );
	}
	return argv;
}

/**
 * The destination path for the rsync.
 *
 * @param {string} dest - Destination path.
 * @returns {boolean} - If it's valid.
 */
function validateDest( dest ) {
	if ( undefined === dest ) {
		return false;
	}
	if ( rsyncConfigStore.has( dest ) ) {
		// eslint-disable-next-line
		console.log( `Alias found, using source: ${ rsyncConfigStore.get( dest ) }` );
		return true;
	}

	if (
		dest.length > 0 &&
		! (
			dest.endsWith( 'plugins' ) ||
			dest.endsWith( 'plugins/' ) ||
			dest.endsWith( 'jetpack-plugin/production' )
		)
	) {
		console.log(
			chalk.yellow( 'Destination path is expected to end in a /plugins dir. Got: ' + dest )
		);
		return false;
	}
	return true;
}

/**
 * Prompt for plugin.
 *
 * If no type is passed via `options`, then it will prompt for the plugin.
 *
 * @param {object} argv - Passthrough of an object, meant to accept argv.
 * @returns {object} object with the type property appended.
 */
export async function promptForPlugin( argv ) {
	let whichPlugin = argv.plugin;
	if (
		! whichPlugin ||
		whichPlugin.length === 0 ||
		( whichPlugin.length > 0 && ! validatePlugin( whichPlugin ) )
	) {
		whichPlugin = await inquirer.prompt( {
			type: 'list',
			name: 'plugin',
			message: 'Which plugin?',
			choices: dirs( './projects/plugins' ),
		} );
		argv.plugin = whichPlugin.plugin;
	}

	return argv;
}

/**
 * Make sure the plugin is actually here.
 *
 * @param {string} plugin - The plugin dirname in project/plugins/.
 * @returns {boolean} Whether it's found.
 */
function validatePlugin( plugin ) {
	if ( false === allProjectsByType( 'plugins' ).includes( `plugins/${ plugin }` ) ) {
		console.log( plugin + ' not found here!' );
		return false;
	}

	return true;
}

/**
 * Command definition for the rsync subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the rsync commands defined.
 */
export function rsyncDefine( yargs ) {
	yargs.command(
		'rsync [plugin] [dest]',
		'Will rsync a plugin from projects/plugins/ to a remote destination. Useful for developing against a live site.',
		yarg => {
			yarg
				.positional( 'plugin', {
					describe: 'Name of the plugin',
					type: 'string',
				} )
				.positional( 'dest', {
					describe: 'Destination path to plugins dir',
					type: 'string',
				} )
				.option( 'watch', {
					alias: 'w',
					describe: 'Watch a plugin for changes to auto-push.',
					type: 'boolean',
				} );
		},
		async argv => {
			await rsyncInit( argv );
		}
	);

	return yargs;
}
