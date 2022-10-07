import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import chalk from 'chalk';
import Configstore from 'configstore';
import execa from 'execa';
import inquirer from 'inquirer';
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
 * @param { string } pluginDestPath - Destination path to plugins.
 * @param { string|false } alias - Alias key, if set.
 */
function setRsyncDest( pluginDestPath, alias = false ) {
	const key = alias || pluginDestPath;
	rsyncConfigStore.set( escapeKey( key ), pluginDestPath );
}

/**
 * Entry point for the CLI.
 * Prompts for the plugin.
 * Prompts for the destination.
 * Finds and uses the real wp plugin slug for dest.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function rsyncInit( argv ) {
	if ( argv.config ) {
		await promptToManageConfig();
		return;
	}
	argv = await maybePromptForPlugin( argv );
	argv = await maybePromptForDest( argv );
	const sourcePluginPath = projectDir( `plugins/${ argv.plugin }` ) + '/';
	// Pull the actual plugin slug from composer.json.
	const pluginComposerJson = await fs.readFile(
		projectDir( `plugins/${ argv.plugin }` + '/composer.json' )
	);
	const wpPluginSlug = JSON.parse( pluginComposerJson ).extra[ 'wp-plugin-slug' ];
	const finalDest = path.join( argv.dest, wpPluginSlug + '/' );

	await rsyncToDest( sourcePluginPath, finalDest, argv.dest );
}

/**
 * Promots to delete, clear or list out the stored destinations.
 */
async function promptToManageConfig() {
	const promptClearAll = async () => {
		console.log( rsyncConfigStore.all );
		await inquirer
			.prompt( {
				type: 'confirm',
				name: 'clearAll',
				message: 'are you sure you want to clear them all?',
			} )
			.then( answer => {
				if ( answer.clearAll ) {
					rsyncConfigStore.clear();
					console.log( 'Empty! Cleared them all.' );
				}
			} );
	};
	const clearOne = key => rsyncConfigStore.delete( escapeKey( key ) );
	const configManage = await inquirer.prompt( {
		type: 'list',
		name: 'manageConfig',
		message: 'Manage saved destination paths.',
		choices: [ 'list', 'clear all', 'remove' ],
	} );
	if ( configManage.manageConfig === 'list' ) {
		console.log( "Here's what you have saved:" );
		console.log( rsyncConfigStore.all );
	}
	if ( configManage.manageConfig === 'clear' ) {
		await promptClearAll();
	}
	if ( configManage.manageConfig === 'remove' ) {
		const configKeys = Object.keys( rsyncConfigStore.all );
		configKeys.push( 'All of them!' );
		const removeDest = await inquirer.prompt( {
			type: 'list',
			name: 'removeKey',
			message: 'which would you like to remove?',
			choices: configKeys,
		} );
		if ( removeDest.removeKey === 'All of them!' ) {
			await promptClearAll();
		} else {
			clearOne( removeDest.removeKey );
			console.log( `Done! Removed ${ removeDest.removeKey }` );
		}
	}
}

/**
 * Collect rsync filter rules based on files at a path.
 *
 * @param {string} source - Source path.
 * @param {string} prefix - Source path prefix.
 * @param {Set} filters - Set to add filter rules into.
 * @returns {Promise<void>}
 */
async function buildFilterRules( source, prefix, filters ) {
	// Include just the files that are published to the mirror.
	for await ( const rfile of listProjectFiles( source, execa ) ) {
		let file = path.join( prefix, rfile );

		// If the file is a monorepo vendor symlink, we need to follow it.
		const fullpath = path.join( source, file );
		if (
			await fs.lstat( fullpath ).then(
				dirent => dirent.isSymbolicLink(),
				() => false
			)
		) {
			const target = path.relative(
				process.cwd(),
				path.join( path.dirname( fullpath ), await fs.readlink( fullpath ) )
			);
			if ( target.startsWith( 'projects/' ) ) {
				await buildFilterRules( target, file, filters );
				continue;
			}
		}

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
}

/**
 * Function that does the actual work of rsync.
 *
 * @param {string} source - Source path.
 * @param {string} dest - Final destination path, including plugin slug.
 * @param {string} pluginDestPath - Destination path.
 * @returns {Promise<void>}
 */
async function rsyncToDest( source, dest, pluginDestPath ) {
	const filters = new Set();

	await buildFilterRules( source, '', filters );

	// Exclude anything not included above.
	filters.add( '- *' );

	const tmpFileName = tmp.tmpNameSync();
	await fs.writeFile( tmpFileName, [ ...filters ].join( '\r\n' ) );
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

		await promptForRsyncConfig( pluginDestPath );
	} catch ( e ) {
		console.log( e );
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		process.exit( 1 );
	}
}

/**
 * Prompts for config file.
 *
 * @param { string } pluginDestPath - Passthrough of the argv object.
 */
async function promptForRsyncConfig( pluginDestPath ) {
	const foundValue = Object.keys( rsyncConfigStore.all ).find(
		key => rsyncConfigStore.all[ key ] === pluginDestPath
	);
	if ( foundValue ) {
		return;
	}
	const createPrompt = await inquirer.prompt( {
		name: 'createConfig',
		type: 'list',
		message: `No saved entries for ${ pluginDestPath }. Create one for easier use later?`,
		choices: [ 'Hell yeah!', 'Nah' ],
	} );
	if ( createPrompt.createConfig === 'Hell yeah!' ) {
		await promptForSetAlias( pluginDestPath );
	}
}

/**
 * Prompt to set the destination alias.
 *
 * @param { string } pluginDestPath - String to destination path.
 */
async function promptForSetAlias( pluginDestPath ) {
	const aliasSetPrompt = await inquirer.prompt( {
		name: 'alias',
		type: 'input',
		message: 'Enter an alias for easier reference? (Press enter to skip.)',
	} );
	const alias = aliasSetPrompt.alias || pluginDestPath;
	setRsyncDest( pluginDestPath, alias );
}

/**
 * Maybe prompts for the destination path if not already set or found a saved alias.
 *
 * @param {object} argv - Passthrough of the argv object.
 * @returns {object} argv object with the project property.
 */
async function maybePromptForDest( argv ) {
	if ( rsyncConfigStore.has( argv.dest ) ) {
		console.log( `Alias found, using dest: ${ rsyncConfigStore.get( argv.dest ) }` );
		argv.dest = rsyncConfigStore.get( argv.dest );
		return argv;
	}
	if ( argv.dest ) {
		return argv;
	}
	const savedDests = Object.keys( rsyncConfigStore.all );
	savedDests.unshift( 'Create new' );
	let response = await inquirer.prompt( {
		name: 'dest',
		type: 'list',
		message: 'Choose destination:',
		choices: savedDests,
	} );
	if ( 'Create new' === response.dest ) {
		response = await inquirer.prompt( {
			name: 'dest',
			type: 'input',
			message: 'Input destination path to the /plugins dir: ',
		} );
		argv.dest = response.dest;
	} else {
		argv.dest = rsyncConfigStore.get( escapeKey( response.dest ) );
	}
	return argv;
}

/**
 * Maybe prompt for plugin.
 *
 * If no type is passed via `options`, then it will prompt for the plugin.
 *
 * @param {object} argv - Passthrough of an object, meant to accept argv.
 * @returns {object} object with the type property appended.
 */
export async function maybePromptForPlugin( argv ) {
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
				.option( 'config', {
					describe: 'Remove or list saved destinations in the config.',
					type: 'boolean',
				} );
		},
		async argv => {
			await rsyncInit( argv );
		}
	);

	return yargs;
}
