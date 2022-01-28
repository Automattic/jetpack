/**
 * External dependencies
 */
import chalk from 'chalk';
import execa from 'execa';
import fs from 'fs/promises';
import Listr from 'listr';
import SilentRenderer from 'listr-silent-renderer';
import UpdateRenderer from 'listr-update-renderer';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import formatDuration from '../helpers/format-duration.js';
import promptForProject from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/json.js';
import { getInstallArgs, projectDir } from '../helpers/install.js';
import { allProjects, allProjectsByType } from '../helpers/projectHelpers.js';
import PrefixTransformStream from '../helpers/prefix-stream.js';

export const command = 'build [project...]';
export const describe = 'Builds one or more monorepo projects';

/**
 * Options definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'project', {
			describe: 'Project in the form of type/name, e.g. plugins/jetpack',
			type: 'string',
		} )
		.option( 'all', {
			type: 'boolean',
			description: 'Build all projects.',
		} )
		.option( 'production', {
			alias: 'p',
			type: 'boolean',
			description: 'Build for production.',
		} )
		.option( 'no-pnpm-install', {
			type: 'boolean',
			description: 'Skip execution of `pnpm install` before the build.',
		} )
		.option( 'timing', {
			type: 'boolean',
			description: 'Output timing information.',
		} );
}

/**
 * Handles the build command.
 *
 * @param {object} argv - the arguments passed.
 */
export async function handler( argv ) {
	if ( argv.project.length === 1 ) {
		if ( argv.project[ 0 ] === 'packages' ) {
			argv.project = allProjectsByType( 'packages' );
		} else if ( argv.project[ 0 ].indexOf( '/' ) < 0 ) {
			argv.type = argv.project[ 0 ];
			argv.project = [];
		}
	}

	if ( argv.all ) {
		argv.project = allProjects();
	}

	if ( argv.project.length === 0 ) {
		argv.project = '';
		argv = await promptForProject( argv );
		argv.project = [ argv.project ];
	}

	const listr = new Listr( [], {
		renderer: argv.v ? SilentRenderer : UpdateRenderer,
	} );

	// Add `pnpm install` task.
	if ( argv.pnpmInstall !== false ) {
		listr.add(
			createBuildTask( argv, `Install pnpm dependencies`, async t => {
				await t.setStatus( 'installing' );
				await t.execa( 'pnpm', await getInstallArgs( 'monorepo', 'pnpm', argv ), {
					cwd: process.cwd(),
				} );
			} )
		);
	}

	// Add build tasks.
	for ( const project of new Set( argv.project ) ) {
		// Does the project even exist?
		if (
			( await fs.access( `projects/${ project }/composer.json` ).catch( () => false ) ) === false
		) {
			console.error( chalk.red( `Project ${ project } does not exist!` ) );
			continue;
		}

		const cwd = projectDir( project );
		listr.add(
			createBuildTask( argv, `Build ${ project }`, async t => {
				await t.setStatus( 'installing' );
				await t.execa( 'composer', await getInstallArgs( project, 'composer', argv ), { cwd } );

				await t.setStatus( 'building' );
				// Determine the composer script to run.
				const composerJson = readComposerJson( project, false );
				const scripts = argv.production
					? [ 'build-production', 'build-development' ]
					: [ 'build-development', 'build-production' ];
				let script = null;
				for ( const s of scripts ) {
					if ( composerJson.scripts?.[ s ] ) {
						script = s;
						break;
					}
				}

				if ( script === null ) {
					await t.output( `No build scripts are defined for ${ project }\n` );
				} else {
					await t.execa( 'composer', [ 'run', '--timeout=0', script ], { cwd } );
				}
			} )
		);
	}

	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build!\n` +
				'Go ahead and sit back. Relax. This will take a few minutes.'
		)
	);
	await listr.run().catch( err => {
		console.error( err );
		process.exit( err.exitCode || 1 );
	} );
}

/**
 * Create a build task.
 *
 * @param {object} argv - Command line arguments.
 * @param {string} title - Task title.
 * @param {Function} build - Build function.
 * @returns {object} Listr task.
 */
function createBuildTask( argv, title, build ) {
	return {
		title: title,
		task: async ( ctx, task ) => {
			const t = {};
			if ( argv.v ) {
				const stdout = new PrefixTransformStream( { time: !! argv.timing } );
				const stderr = new PrefixTransformStream( { time: !! argv.timing } );
				stdout.pipe( process.stdout );
				stderr.pipe( process.stderr );

				t.execa = ( file, args, options ) => {
					const p = execa( file, args, {
						stdio: [ 'ignore', 'pipe', 'pipe' ],
						...options,
					} );
					p.stdout.pipe( stdout, { end: false } );
					p.stderr.pipe( stderr, { end: false } );
					return p;
				};
				t.output = m =>
					new Promise( resolve => {
						stdout.write( m, 'utf8', resolve );
					} );
				t.setStatus = s => t.output( '\n' + chalk.bold( `== ${ title } [${ s }] ==` ) + '\n\n' );
			} else {
				t.execa = ( file, args, options ) => execa( file, args, { stdio: 'ignore', ...options } );
				t.output = () => Promise.resolve();
				t.setStatus = async s => {
					task.title = `${ title } [${ s }]`;
				};
			}

			const t0 = Date.now();
			try {
				await build( t );
			} finally {
				await t.setStatus( argv.timing ? formatDuration( Date.now() - t0 ) + 's' : 'complete' );
			}
		},
	};
}
