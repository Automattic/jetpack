import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import chalk from 'chalk';
import Configstore from 'configstore';
import { execa } from 'execa';
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
	// Append plugin slug if we got a "plugins" directory, otherwise just make sure it ends in a slash.
	let finalDest;
	if ( argv.dest.match( /\/(?:mu-)?plugins\/?$/ ) ) {
		// Pull the actual plugin slug from composer.json.
		const pluginComposerJson = await fs.readFile(
			projectDir( `plugins/${ argv.plugin }/composer.json` )
		);
		const wpPluginSlug = JSON.parse( pluginComposerJson ).extra[ 'wp-plugin-slug' ];
		finalDest = path.join( argv.dest, wpPluginSlug + '/' );
	} else {
		finalDest = path.join( argv.dest, '/' );
	}

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
		choices: [ 'list', 'add', 'remove' ],
	} );
	if ( configManage.manageConfig === 'list' ) {
		console.log( "Here's what you have saved:" );
		console.log( rsyncConfigStore.all );
	}
	if ( configManage.manageConfig === 'add' ) {
		const aliasDest = await promptNewDest();
		if ( aliasDest ) {
			await promptForSetAlias( aliasDest );
		}
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
 * Rsync differentiates literal strings vs patterns by looking for `[`, `*`, and `?`.
 * Only patterns use backslash escapes, literal strings do not.
 *
 * @param {string} file - File to add.
 * @param {Set} filters - Set to add filter rules into.
 * @returns {void}
 */
async function addFileToFilter( file, filters ) {
	// Rsync requires we also list all the directories containing the file.
	let prev;
	do {
		filters.add( '+ /' + ( file.match( /[[*?]/ ) ? file.replace( /[[*?\\]/g, '\\$&' ) : file ) );
		prev = file;
		file = path.dirname( file ) + '/';
	} while ( file !== '/' && file !== './' && file !== prev );
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
		const file = path.join( prefix, rfile );

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
			if (
				target.startsWith( 'projects/' ) &&
				( await fs.access( target ).then(
					() => true,
					() => false
				) )
			) {
				await buildFilterRules( target, file, filters );
				continue;
			}
		}

		await addFileToFilter( file, filters );
	}
}

/**
 * Explicitly add any /vendor files that are otherwise not symlinked.
 * Necessary when rsyncing development builds.
 *
 * @param {string} source - Source path.
 * @param {Set} filters - Set to add filter rules into.
 * @returns {void}
 */
async function addVendorFilesToFilter( source, filters ) {
	const dirents = await fs.readdir( source, { withFileTypes: true } );
	const files = await Promise.all(
		dirents.map( dirent => {
			const fileSource = path.resolve( source, dirent.name );
			return dirent.isDirectory() ? addVendorFilesToFilter( fileSource, filters ) : fileSource;
		} )
	);

	for ( const file of files ) {
		if (
			await fs.lstat( file ).then(
				dirent => dirent.isSymbolicLink(),
				() => false
			)
		) {
			// Skip the symlinks.
			continue;
		}
		if ( file ) {
			// Relative file path to the project dir.
			const relativeFilePath = file.substring( file.indexOf( '/vendor' ) + 1 );
			if ( relativeFilePath.startsWith( 'vendor' ) ) {
				await addFileToFilter( relativeFilePath, filters );
			}
		}
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
	// To catch files required in dev builds.
	await addVendorFilesToFilter( `${ source }/vendor/`, filters );
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

		console.log( '\n' );
		console.log(
			chalk.black.bgYellow(
				'*************************************************************************************'
			)
		);
		console.log(
			chalk.black.bgYellow(
				'**  Make sure you have set ' +
					chalk.bold( "define( 'JETPACK_AUTOLOAD_DEV', true );" ) +
					' in a mu-plugin  **'
			)
		);
		console.log(
			chalk.black.bgYellow(
				'**  on the remote site. Otherwise the wrong versions of packages may be loaded!    **'
			)
		);
		console.log(
			chalk.black.bgYellow(
				'*************************************************************************************'
			)
		);
		console.log( '\n' );

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
	if ( rsyncConfigStore.has( escapeKey( alias ) ) ) {
		const alreadyFound = await inquirer.prompt( {
			name: 'overwrite',
			type: 'confirm',
			message: `This alias already exists for dest: ${ rsyncConfigStore.get(
				escapeKey( alias )
			) }. Overwrite it?`,
		} );
		if ( ! alreadyFound.overwrite ) {
			console.log( 'Okay!' );
			return;
		}
	}
	await setRsyncDest( pluginDestPath, alias );
	console.log( `Alias '${ alias }' saved for ${ pluginDestPath }` );
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
	const response = await inquirer.prompt( {
		name: 'dest',
		type: 'list',
		message: 'Choose destination:',
		choices: savedDests,
	} );
	if ( 'Create new' === response.dest ) {
		argv.dest = await promptNewDest();
	} else {
		argv.dest = rsyncConfigStore.get( escapeKey( response.dest ) );
	}
	return argv;
}

/**
 * Prompts for the destination.
 *
 * @returns {Promise<*|string>} - Destination path
 */
async function promptNewDest() {
	const response = await inquirer.prompt( {
		name: 'dest',
		type: 'input',
		message: "Input destination host:path to the plugin's dir or the /plugins or /mu-plugins dir: ",
		validate: v => ( v === '' ? 'Please enter a host:path' : true ),
	} );
	return response.dest;
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
					describe: 'List, add, or remove saved destinations in the config.',
					type: 'boolean',
				} );
		},
		async argv => {
			await rsyncInit( argv );
		}
	);

	return yargs;
}
