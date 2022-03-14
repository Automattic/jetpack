/**
 * External dependencies
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import process from 'process';

/**
 * Internal dependencies
 */
import { allProjectsByType, dirs } from '../helpers/projectHelpers.js';
import { runCommand } from '../helpers/runCommand.js';

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function rsyncInit( argv ) {
	argv = await promptForDest( argv );
	argv = await promptForPlugin( argv );

	try {
		await runCommand( 'tools/rsync-plugins/rsync-plugins.sh', [
			`-p ${ argv.plugin } -d ${ argv.dest }`,
		] );
	} catch ( e ) {
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		console.log( argv );
		process.exit( 1 );
	}
}

/**
 * Prompts for the destination path. Should end in wp-content/plugins
 *
 * @param {object} argv - Passthrough of the argv object.
 * @returns {object} argv object with the project property.
 */
async function promptForDest( argv ) {
	if ( validateDest( argv.dest ) ) {
		return argv;
	}
	const response = await inquirer.prompt( {
		name: 'dest',
		message: 'Input destination path to the wp-content/plugins dir: ',
		validate: input => validateDest( input ),
	} );
	argv.dest = response.dest;
	return argv;
}

/**
 * The destination path for the rsync.
 *
 * @param {string} dest - Destination path ending with wp-content/plugins
 * @returns {boolean} - If it's valid.
 */
function validateDest( dest ) {
	if ( undefined === dest ) {
		return false;
	}

	if ( dest.length > 0 && ! dest.endsWith( 'wp-content/plugins' ) ) {
		console.log(
			chalk.yellow( 'Destination path is expected to end with wp-content/plugins. Got: ' + dest )
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
	}

	argv.plugin = whichPlugin.plugin;
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
		'rsync [--watch] [plugin] [dest]',
		'Will rsync a plugin from projects/plugins/ to a remote destination. Useful for developing against a live site.',
		yarg => {
			yarg
				.options( 'plugin', {
					alias: 'p',
					describe: 'Name of the plugin',
					type: 'string',
				} )
				.option( 'dest', {
					alias: 'd',
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
