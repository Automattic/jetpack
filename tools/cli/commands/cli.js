import path from 'path';
import { fileURLToPath } from 'url';
import execa from 'execa';
import Listr from 'listr';
import UpdateRenderer from 'listr-update-renderer';
import VerboseRenderer from 'listr-verbose-renderer';
import PATH from 'path-name';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Show us the status of the cli, such as the currenet linked directory.
 */
function cliStatus() {
	if ( process.env.JETPACK_CLI_DID_REEXEC ) {
		console.log(
			chalkJetpackGreen(
				'Jetpack CLI is apparently linked to ' + process.env.JETPACK_CLI_DID_REEXEC
			)
		);
	} else {
		console.log(
			chalkJetpackGreen(
				'Jetpack CLI is currently linked to ' +
					fileURLToPath( new URL( `../../../`, import.meta.url ) )
			)
		);
	}
	console.log( 'To change the linked directory of the CLI, run `pnpm jetpack cli link` ' );
}
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
								task: () => command( 'pnpm link --global', options.v, path.resolve( 'tools/cli' ) ),
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
								title: chalkJetpackGreen( `Removing global access to the CLI` ),
								task: () => command( 'pnpm unlink', options.v, path.resolve( 'tools/cli' ) ),
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
			)
			.command(
				'status',
				'Get the status of the CLI',
				() => {},
				argv => {
					cliStatus( argv );
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
 * @returns {object} - The execa command to run.
 */
function command( cmd, verbose, cwd ) {
	// If this is being run via the cli-link script from the monorepo root package.json, pnpm may
	// have prepended node-gyp-bin and node_modules/.bin directories. Remove them so pnpm doesn't
	// try to link the CLI into one of those.
	const env = { ...process.env };
	if ( env[ PATH ] ) {
		const d = path.delimiter.replace( /[-[\]{}()*+?.\\^$|]/g, '\\$&' );
		const s = path.sep.replace( /[-[\]{}()*+?.\\^$|]/g, '\\$&' );
		env[ PATH ] = env[ PATH ].replace(
			new RegExp(
				`^(?:[^${ d }]*${ s }node-gyp-bin${ d })?(?:[^${ d }]*${ s }node_modules${ s }\\.bin${ d })+`
			),
			''
		);
	}

	return verbose
		? execa.commandSync( `${ cmd }`, { cwd: cwd, env: env, stdio: 'inherit' } )
		: execa.command( `${ cmd }`, { cwd: cwd, env: env } );
}
