/**
 * Stuff to do to this!!!
 *
 * Add a `jetpack docker` command to do all of the Docker stuff to it.
 * Add a `jetpack new` command to setup a new package, new editor-extension, new plugin.
 * Add a `jetpack deploy` command or something like it to handle our release branch deploying, svn, etc.
 * May want to look at a `jetpack.yml` file or something like it to define the build, deploy, etc options for each project?
 */

/**
 * External dependencies
 */
import { cliFunctions } from './helpers/cliFunctions.mjs';

/**
 * The entrypoint to the script.
 */
export async function cli() {
	let cli = cliFunctions();
	cli.command( 'build', 'Builds Jetpack projects.' );

	const flags = cli.parse( process.argv, { version: false } );
}
