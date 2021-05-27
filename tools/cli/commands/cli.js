/**
 * External dependencies
 */
import path from 'path';
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';
import execa from 'execa';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling';

/**
 * CLI link.
 *
 * @param {object} options - The argv options.
 */
function cliLink( options ) {
	const opts = {
		renderer: options.v ? VerboseRenderer : UpdateRenderer,
	};
	const linker = new Listr(
		[
			{
				title: `Linking the CLI`,
				task: () => {
					return new Listr(
						[
							{
								title: chalkJetpackGreen( `Enabling global access to the CLI` ),
								task: () => command( 'yarn link', options.v, path.resolve( 'tools/cli' ) ),
							},
							{
								title: chalkJetpackGreen( `Setting the monorepo to use the CLI` ),
								task: () => command( 'yarn link jetpack-cli', options.v, process.cwd() ),
							},
						],
						opts
					);
				},
			},
		],
		opts
	);

	linker.run().catch( err => {
		console.error( err );
		process.exit( err.exitCode || 1 );
	} );
}

/**
 * CLI unlink.
 *
 * @param {object} options - The argv options.
 */
function cliUnlink( options ) {
	const opts = {
		renderer: options.v ? VerboseRenderer : UpdateRenderer,
	};
	const unlinker = new Listr(
		[
			{
				title: `Unlinking the CLI`,
				task: () => {
					return new Listr(
						[
							{
								title: chalkJetpackGreen( `Disconnecting the CLI from the monorepo` ),
								task: () => command( 'yarn unlink jetpack-cli', options.v, process.cwd() ),
							},
							{
								title: chalkJetpackGreen( `Removing global access to the CLI` ),
								task: () => command( 'yarn unlink', options.v, path.resolve( 'tools/cli' ) ),
							},
						],
						opts
					);
				},
			},
		],
		opts
	);

	unlinker.run().catch( err => {
		console.error( err );
		process.exit( err.exitCode || 1 );
	} );
}

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the CLI commands defined.
 */
export function cliDefine( yargs ) {
	yargs.command( 'cli <cmd>', 'Tools for the CLI tool. Meta, eh?', yarg => {
		yarg
			.command(
				'link',
				'Symlink the CLI for global use or development.',
				() => {},
				argv => {
					cliLink( argv );
					if ( argv.v ) {
						console.log( argv );
					}
				}
			)
			.command(
				'unlink',
				'Unlink the CLI.',
				() => {},
				argv => {
					cliUnlink( argv );
					if ( argv.v ) {
						console.log( argv );
					}
				}
			);
	} );

	return yargs;
}

/**
 * Returns the command, normalized for verbosity.
 *
 * @param {string} cmd - The command to normalize.
 * @param {boolean} verbose - If verbose is enabled or not.
 * @param {string} cwd - Current working directory.
 *
 * @returns {object} - The execa command to run.
 */
function command( cmd, verbose, cwd ) {
	return verbose
		? execa.commandSync( `${ cmd }`, { cwd: cwd, stdio: 'inherit' } )
		: execa.command( `${ cmd }`, { cwd: cwd } );
}
