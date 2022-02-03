/**
 * External dependencies
 */
import chalk from 'chalk';
import execa from 'execa';
import inquirer from 'inquirer';
import Listr from 'listr';
import ListrState from 'listr/lib/state.js';
import SilentRenderer from 'listr-silent-renderer';
import UpdateRenderer from 'listr-update-renderer';
import pLimit from 'p-limit';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { coerceConcurrency } from '../helpers/normalizeArgv.js';
import formatDuration from '../helpers/format-duration.js';
import { getDependencies, filterDeps, getBuildOrder } from '../helpers/dependencyAnalysis.js';
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
		.option( 'concurrency', {
			type: 'number',
			description: 'Maximum number of build tasks to run at once.',
			default: Infinity,
			coerce: coerceConcurrency,
		} )
		.option( 'deps', {
			type: 'boolean',
			description: 'Build dependencies of the specified projects too.',
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
	let dependencies = await getDependencies( process.cwd(), 'build' );
	const listr = new Listr( [], {
		renderer: argv.v ? SilentRenderer : UpdateRenderer,
		concurrent: argv.concurrency > 1,
		exitOnError: argv.concurrency === 1,
	} );

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
		argv = await promptForDeps( argv );
		argv.project = [ argv.project ];
	}

	// Check for unknown projects.
	argv.project = [ ...new Set( argv.project ) ];
	const missing = new Set( argv.project.filter( p => ! dependencies.has( p ) ) );
	if ( missing.size ) {
		for ( const project of missing ) {
			console.error( chalk.red( `Project ${ project } does not exist!` ) );
		}
		argv.project = argv.project.filter( p => dependencies.has( p ) );
	}

	// Filter to just what we want to build.
	dependencies = filterDeps( dependencies, argv.project, { dependencies: argv.deps } );

	// Calculate build order, with a cloned map so as to keep the original map for later.
	const bodeps = new Map();
	for ( const [ k, v ] of dependencies ) {
		bodeps.set( k, new Set( v ) );
	}
	const buildOrder = getBuildOrder( bodeps ).flat();

	// Avoid a node warning about too many event listeners.
	if ( argv.v ) {
		process.stdout.setMaxListeners( buildOrder.length + 10 );
		process.stderr.setMaxListeners( buildOrder.length + 10 );
	}

	// Add `pnpm install` task, if one is necessary.
	if ( argv.pnpmInstall !== false ) {
		for ( const v of dependencies.values() ) {
			v.add( 'pnpm install' );
		}
		dependencies.set( 'pnpm install', new Set() );
		listr.add(
			createBuildTask( 'pnpm install', argv, `Install pnpm dependencies`, async t => {
				await t.setStatus( 'installing' );
				await t.execa( 'pnpm', await getInstallArgs( 'monorepo', 'pnpm', argv ), {
					cwd: process.cwd(),
				} );
			} )
		);
	}

	// Add build tasks.
	for ( const project of buildOrder ) {
		const cwd = projectDir( project );
		listr.add(
			createBuildTask( project, argv, `Build ${ project }`, async t => {
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

	// Run it!
	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build!\n` +
				'Go ahead and sit back. Relax. This will take a few minutes.'
		)
	);
	const ctx = {
		concurrent: argv.concurrency > 1,
		limit: pLimit( argv.concurrency ),
		dependencies,
		promises: {},
	};
	await listr.run( ctx ).catch( err => {
		process.exit( err.exitCode || 1 );
	} );
}

/**
 * Create a build task.
 *
 * @param {string} project - Project slug.
 * @param {object} argv - Command line arguments.
 * @param {string} title - Task title.
 * @param {Function} build - Build function.
 * @returns {object} Listr task.
 */
function createBuildTask( project, argv, title, build ) {
	return {
		title: title,
		task: async ( ctx, task ) => {
			const setStatus = s => {
				task.title = title + chalk.grey( ` [${ s }]` );
			};

			// Hack listr's wrapper to expose the state.
			if (
				task._task &&
				typeof task._task.state !== 'undefined' &&
				typeof task.state === 'undefined'
			) {
				Object.defineProperty( task, 'state', {
					get: () => task._task.state,
					set: v => {
						task._task.state = v;
					},
				} );
			}

			// Create a promise (by executing an async function), add a "status" property, store it in `ctx.promises`, and return it.
			let status = 'pending';
			let buildStarted = false;
			const promise = ( async () => {
				task.state = undefined;

				// First, wait for dependencies.
				// If any dependency failed, reject.
				// If any are pending, wait.
				const deps = ctx.dependencies.get( project );
				while ( ctx.concurrent ) {
					const mydeps = [];
					for ( const dep of deps ) {
						const dp = ctx.promises[ dep ];
						if ( ! dp ) {
							// Task hasn't started yet. This will make Promise.race return next tick to re-loop.
							mydeps.push( dep );
						} else if ( dp.status === 'rejected' ) {
							// Something failed, so throw.
							setStatus( 'dependencies failed' );
							throw new Error( `Dependency ${ dep } failed` );
						} else if ( dp.status === 'pending' ) {
							mydeps.push( dp );
						}
					}

					// Nothing pending, so break the loop.
					if ( mydeps.length === 0 ) {
						break;
					}

					// At least one task is pending, so wait for it. Catch any errors here,
					// we'll handle them on the next time around the loop.
					setStatus( 'waiting on dependencies' );
					await Promise.race( mydeps ).catch( () => {} );
				}

				// Wait for a concurrency slot.
				setStatus( 'pending' );
				await ctx.limit( async () => {
					task.state = ListrState.PENDING;

					// Create the task-functions object to pass to the builder.
					const t = {};
					if ( argv.v ) {
						const streamArgs = { prefix: ctx.concurrent ? project : null, time: !! argv.timing };
						const stdout = new PrefixTransformStream( streamArgs );
						const stderr = new PrefixTransformStream( streamArgs );
						stdout.pipe( process.stdout, { end: false } );
						stderr.pipe( process.stderr, { end: false } );

						t.execa = ( file, args, options ) => {
							const stdio = options.stdio || [];
							stdio[ 0 ] ||= 'ignore';
							const p = execa( file, args, {
								...options,
								stdio,
							} );
							if ( ! stdio[ 1 ] ) {
								p.stdout.pipe( stdout, { end: false } );
							}
							if ( ! stdio[ 2 ] ) {
								p.stderr.pipe( stderr, { end: false } );
							}
							return p;
						};
						t.output = m =>
							new Promise( resolve => {
								stdout.write( m, 'utf8', resolve );
							} );
						t.setStatus = s =>
							t.output( '\n' + chalk.bold( `== ${ title } [${ s }] ==` ) + '\n\n' );
					} else {
						t.execa = ( file, args, options ) => {
							const stdio = options.stdio || [];
							stdio[ 0 ] ||= 'ignore';
							stdio[ 1 ] ||= 'ignore';
							stdio[ 2 ] ||= 'ignore';
							const p = execa( file, args, {
								...options,
								stdio,
							} );
							return p;
						};
						t.output = () => Promise.resolve();
						t.setStatus = setStatus;
					}

					// Build!
					const t0 = Date.now();
					buildStarted = true;
					try {
						await build( t );
					} finally {
						await t.setStatus( argv.timing ? formatDuration( Date.now() - t0 ) + 's' : 'complete' );
					}
				} );
			} )().then(
				v => {
					status = 'resolved';
					return v;
				},
				async e => {
					if ( argv.v && ! buildStarted ) {
						await new Promise( resolve => {
							const prefix = argv.timing ? `[${ project } 0.000] ` : `[${ project }] `;
							process.stdout.write(
								`\nBuild aborted: ${ e.message }\n`.replace( /^/gm, prefix ) + '\n',
								'utf8',
								resolve
							);
						} );
					}
					status = 'rejected';
					throw e;
				}
			);
			Object.defineProperty( promise, 'status', {
				get: () => status,
			} );
			ctx.promises[ project ] = promise;
			return promise;
		},
	};
}

/**
 * Prompt for whether dependencies should be built too.
 *
 * @param {object} options - Passthrough of the argv object.
 * @returns {object} argv object with the project property.
 */
async function promptForDeps( options ) {
	if ( typeof options.deps !== 'undefined' ) {
		return options;
	}

	const answers = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'deps',
			message: `Build dependencies of ${ options.project } too?`,
		},
	] );
	return {
		...options,
		deps: answers.deps,
	};
}
