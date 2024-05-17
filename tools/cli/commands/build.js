import { constants as fsconstants, createReadStream } from 'fs';
import fs from 'fs/promises';
import { once } from 'node:events';
import { createInterface as rlcreateInterface } from 'node:readline';
import npath from 'path';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { execa } from 'execa';
import Listr from 'listr';
import ListrState from 'listr/lib/state.js';
import SilentRenderer from 'listr-silent-renderer';
import UpdateRenderer from 'listr-update-renderer';
import pLimit from 'p-limit';
import { getDependencies, filterDeps, getBuildOrder } from '../helpers/dependencyAnalysis.js';
import formatDuration from '../helpers/format-duration.js';
import { getInstallArgs, projectDir } from '../helpers/install.js';
import { listProjectFiles } from '../helpers/list-project-files.js';
import { coerceConcurrency } from '../helpers/normalizeArgv.js';
import PrefixStream from '../helpers/prefix-stream.js';
import { allProjects, allProjectsByType } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

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
		.option( 'for-mirrors', {
			type: 'string',
			normalize: true,
			description:
				'Build to an output directory for pushing to the mirrors. Value is the output directory.',
			hidden: true,
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
	try {
		if ( ! ( await setupForMirroring( argv ) ) ) {
			process.exit( 1 );
		}
	} catch ( e ) {
		console.error( e.message );
		process.exit( 1 );
	}

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

	// Check for unknown projects.
	let missing = new Set();
	argv.project = [ ...new Set( argv.project ) ];
	if ( argv.project.length > 0 ) {
		missing = new Set( argv.project.filter( p => ! dependencies.has( p ) ) );
		if ( missing.size > 0 ) {
			argv.project = argv.project.filter( p => dependencies.has( p ) );
			// If there are no projects left, print now (then the next block will prompt).
			// If run with `-v`, also print now in case the user wants to Ctrl+C. Without `-v`, rely on them paying attention to the listr list.
			if ( argv.project.length === 0 || argv.v ) {
				for ( const project of missing ) {
					console.error( chalk.red( `Project ${ project } does not exist!` ) );
				}
			}
		}
	}

	if ( argv.project.length === 0 ) {
		missing.clear();
		if ( argv.forMirrors ) {
			console.error( 'Please specify projects on the command line with --for-mirrors' );
			process.exit( 1 );
		}
		argv.project = '';
		argv = await promptForProject( argv );
		argv = await promptForDeps( argv );
		argv.project = [ argv.project ];
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
					stdio: [ 'ignore', 'inherit', 'inherit' ],
					buffer: false,
				} );
			} )
		);
	}

	// Add build tasks.
	for ( const project of buildOrder ) {
		listr.add( createBuildTask( project, argv, `Build ${ project }`, buildProject ) );
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
		mirrorMutex: pLimit( 1 ),
		versions: {},
	};
	await listr
		.run( ctx )
		.finally( () => {
			if ( missing.size ) {
				console.error( '' );
				const wrap = argv.v ? v => v : chalk.red;
				for ( const project of missing ) {
					console.error( wrap( `Project ${ project } was ignored as it does not exist.` ) );
				}
			}
		} )
		.catch( err => {
			if ( argv.v && ctx.concurrent ) {
				console.error( '\nThe following builds failed:' );
				for ( const pkg of Object.keys( ctx.promises ).sort() ) {
					if ( ctx.promises[ pkg ].status === 'rejected' && ctx.promises[ pkg ].buildStarted ) {
						console.error( ` - ${ pkg }` );
					}
				}
			}
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
					const t = {
						project,
						argv,
						ctx,
						cwd: projectDir( project ),
					};

					let stdout, stderr;
					if ( argv.v ) {
						const streamArgs = { prefix: ctx.concurrent ? project : null, time: !! argv.timing };
						stdout = new PrefixStream( streamArgs );
						stderr = new PrefixStream( streamArgs );
						stdout.pipe( process.stdout, { end: false } );
						stderr.pipe( process.stderr, { end: false } );

						t.output = m =>
							new Promise( resolve => {
								stdout.write( m, 'utf8', resolve );
							} );
						t.setStatus = s =>
							t.output( '\n' + chalk.bold( `== ${ title } [${ s }] ==` ) + '\n\n' );
					} else {
						t.output = () => Promise.resolve();
						t.setStatus = setStatus;
					}

					t.execa = ( file, args = [], options = {} ) => {
						// Match `child_process` default behavior.
						let stdio = options.stdio || [];
						if ( typeof stdio === 'string' ) {
							stdio = [ stdio, stdio, stdio ];
						}
						stdio[ 0 ] ||= 'pipe';
						stdio[ 1 ] ||= 'pipe';
						stdio[ 2 ] ||= 'pipe';

						// For actually passing to execa, though, map "inherit" to either piping to our PrefixStreams or ignoring.
						const estdio = [ ...stdio ];
						if ( stdio[ 1 ] === 'inherit' ) {
							estdio[ 1 ] = stdout ? 'pipe' : 'ignore';
						}
						if ( stdio[ 2 ] === 'inherit' ) {
							estdio[ 2 ] = stderr ? 'pipe' : 'ignore';
						}

						const p = execa( file, args, {
							...options,
							stdio: estdio,
						} );

						if ( stdout && stdio[ 1 ] === 'inherit' ) {
							p.stdout.pipe( stdout, { end: false } );
						}
						if ( stderr && stdio[ 2 ] === 'inherit' ) {
							p.stderr.pipe( stderr, { end: false } );
						}

						return p;
					};

					// Build!
					const t0 = Date.now();
					buildStarted = true;
					try {
						await build( t );
					} catch ( e ) {
						await t.output( `\nBuild failed: ${ e.stack }\n` );
						throw e;
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
			Object.defineProperty( promise, 'buildStarted', {
				get: () => buildStarted,
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

	const answers = await enquirer.prompt( [
		{
			type: 'confirm',
			name: 'deps',
			message: `Build dependencies of ${ options.project } too?`,
			initial: true,
		},
	] );
	return {
		...options,
		deps: answers.deps,
	};
}

/**
 * Set up the environment for building for mirrors.
 *
 * @param {object} argv - Arguments. Will be modified in place.
 * @returns {boolean} Whether to proceed.
 */
async function setupForMirroring( argv ) {
	if ( ! argv.forMirrors ) {
		return true;
	}

	if ( ! process.env.CI || process.env.CI === '' ) {
		try {
			await execa( 'git', [ 'diff', '--quiet' ], {
				stdio: [ 'ignore', 'inherit', 'inherit' ],
				buffer: false,
				cwd: process.cwd(),
			} );
		} catch {
			console.error( chalk.bgRed( 'The working tree has unstaged changes!' ) );
			console.error( 'Please stage, merge, or revert them before trying to use --for-mirrors.' );
			return false;
		}
		const answers = await enquirer.prompt( [
			{
				type: 'confirm',
				name: 'ok',
				message: `Build with --for-mirrors is intended for a CI environment and will leave changes in the working tree. Proceed anyway?`,
			},
		] );
		if ( ! answers.ok ) {
			console.error( 'Build cancelled!' );
			return false;
		}
	}

	if ( argv.forMirrors === '.' ) {
		throw new Error( `Cannot mirror to ${ argv.forMirrors }` );
	}
	const stats = await fs.stat( argv.forMirrors ).catch( async e => {
		if ( e.code !== 'ENOENT' ) {
			throw e;
		}
		await fs.mkdir( argv.forMirrors, { recursive: true } );
		return await fs.stat( argv.forMirrors );
	} );
	if ( ! stats.isDirectory() ) {
		throw new Error( `${ argv.forMirrors } is not a directory` );
	}
	await fs.access( argv.forMirrors, fsconstants.R_OK | fsconstants.W_OK | fsconstants.X_OK );
	if ( ( await fs.readdir( argv.forMirrors ).then( a => a.length ) ) > 0 ) {
		throw new Error( `Directory ${ argv.forMirrors } is not empty` );
	}

	argv.deps = true;
	argv.production = true;
	argv.p = true;
	argv.timing = true;
	process.env.COMPOSER_MIRROR_PATH_REPOS = '1';
	return true;
}

/**
 * Test if a given path exists.
 *
 * @param {string|Buffer|URL} path - Path to check.
 * @returns {boolean} Whether it exists.
 */
async function fsExists( path ) {
	return fs.access( path ).then(
		() => true,
		() => false
	);
}

/**
 * Copy directories recursively.
 *
 * @param {string} src - Directory to copy from.
 * @param {string} dest - Directory to copy to.
 */
async function copyDirectory( src, dest ) {
	await fs.mkdir( dest, { recursive: true } );
	for ( const dirent of await fs.readdir( src, { encoding: 'utf8', withFileTypes: true } ) ) {
		const s = npath.join( src, dirent.name );
		const d = npath.join( dest, dirent.name );
		if ( dirent.isDirectory() ) {
			await copyDirectory( s, d );
		} else {
			await fs.copyFile( s, d );
		}
	}
}

/**
 * Write a file atomically.
 *
 * Writes to a temporary file then renames, on the assumption that the latter is an atomic operation.
 *
 * @param {string} file - File name.
 * @param {string} data - Contents to write.
 * @param {object} options - Options.
 */
async function writeFileAtomic( file, data, options = {} ) {
	// Note there doesn't seem to be any need for managing ownership or flag 'wx' here,
	// if some attacker could take advantage they could do worse more directly.
	const tmpfile = npath.join( npath.dirname( file ), `.${ npath.basename( file ) }.tmp` );
	await fs.writeFile( tmpfile, data, options );
	try {
		await fs.rename( tmpfile, file );
	} catch ( e ) {
		await fs.rm( tmpfile ).catch( () => null );
		throw e;
	}
}

/**
 * Copy a file atomically.
 *
 * Copies to a temporary file then renames, on the assumption that the latter is an atomic operation.
 *
 * @param {string} src - Source file.
 * @param {string} dest - Dest file.
 */
async function copyFileAtomic( src, dest ) {
	// Note there doesn't seem to be any need for managing ownership or flag 'wx' here,
	// if some attacker could take advantage they could do worse more directly.
	const tmpfile = npath.join( npath.dirname( dest ), `.${ npath.basename( dest ) }.tmp` );
	await fs.copyFile( src, tmpfile );
	try {
		await fs.rename( tmpfile, dest );
	} catch ( e ) {
		await fs.rm( tmpfile ).catch( () => null );
		throw e;
	}
}

/**
 * Check for filename collisions.
 *
 * @param {string} basedir - Base directory.
 * @returns {string[]} Colliding file names.
 */
async function checkCollisions( basedir ) {
	// @todo Once we require Node 20.1+, use the new `recursive` option to `fs.readdir` instead of manually recursing here.
	// Doing `const files = await fs.readdir( basedir, { recursive: true } );` should suffice.
	const files = [];
	const ls = async dir => {
		for ( const file of await fs.readdir( dir, { withFileTypes: true } ) ) {
			const path = npath.join( dir, file.name );
			files.push( npath.relative( basedir, path ) );
			if ( file.isDirectory() ) {
				await ls( path );
			}
		}
	};
	await ls( basedir );

	const collisions = new Set();
	const compare = Intl.Collator( 'und', { sensitivity: 'accent' } ).compare;
	let prev = null;
	for ( const file of files.sort( compare ) ) {
		if ( prev !== null && compare( file, prev ) === 0 ) {
			collisions.add( prev );
			collisions.add( file );
		}
		prev = file;
	}
	return [ ...collisions ];
}

/**
 * Build a project.
 *
 * @param {object} t - Task object.
 */
async function buildProject( t ) {
	await t.setStatus( 'installing' );

	const composerJson = JSON.parse(
		await fs.readFile( `${ t.cwd }/composer.json`, { encoding: 'utf8' } )
	);

	// Determine the composer script to run.
	const scripts = t.argv.production
		? [ 'build-production', 'build-development' ]
		: [ 'build-development', 'build-production' ];
	let script = null;
	for ( const s of scripts ) {
		if ( composerJson.scripts?.[ s ] ) {
			script = s;
			if (
				t.argv.forMirrors &&
				composerJson.scripts[ script ] === "echo 'Add your build step to composer.json, please!'"
			) {
				script = null;
			}
			break;
		}
	}

	// We don't need to `composer install` if it's a CI build of a non-plugin with no build script. Except for changelogger.
	const skipInstall =
		t.argv.forMirrors &&
		script === null &&
		! t.project.startsWith( 'plugins/' ) &&
		t.project !== 'packages/changelogger';

	if ( t.argv.forMirrors && ! skipInstall ) {
		// Mirroring needs to munge the project's composer.json to point to the built files..
		const idx = composerJson.repositories?.findIndex( r => r.options?.monorepo );
		if ( typeof idx === 'number' && idx >= 0 ) {
			// Extract only the versions this project actually depends on, in a consistent order,
			// to avoid vendor/composer/installed.json changing randomly every build.
			const deps = new Set( t.ctx.dependencies.get( t.project ) );
			for ( const dep of deps ) {
				for ( const d of t.ctx.dependencies.get( dep ) ) {
					deps.add( d );
				}
			}
			const versions = {};
			for ( const dep of [ ...deps ].sort() ) {
				if ( t.ctx.versions[ dep ] ) {
					versions[ t.ctx.versions[ dep ].name ] = t.ctx.versions[ dep ].runversion;
				}
			}

			if ( Object.keys( versions ).length > 0 ) {
				t.output( `\n=== Munging composer.json to fetch built packages ===\n\n` );
				composerJson.repositories.splice( idx, 0, {
					type: 'path',
					url: t.argv.forMirrors + '/*/*',
					options: {
						monorepo: true,
						versions,
					},
				} );
				await writeFileAtomic(
					`${ t.cwd }/composer.json`,
					JSON.stringify( composerJson, null, '\t' ) + '\n',
					{ encoding: 'utf8' }
				);
				// Update composer.lock too, if any.
				if ( await fsExists( `${ t.cwd }/composer.lock` ) ) {
					await t.execa( 'composer', [ 'update', '--no-install', ...Object.keys( versions ) ], {
						cwd: t.cwd,
						stdio: [ 'ignore', 'inherit', 'inherit' ],
						buffer: false,
					} );
				}
			}
		}
	}

	// Install. Unless we skip it.
	if ( skipInstall ) {
		await t.output( `Skipping composer install for CI build of non-plugin with no build script\n` );
	} else {
		await t.execa( 'composer', await getInstallArgs( t.project, 'composer', t.argv ), {
			cwd: t.cwd,
			stdio: [ 'ignore', 'inherit', 'inherit' ],
			buffer: false,
		} );
	}

	// Build.
	await t.setStatus( 'building' );
	if ( script === null ) {
		await t.output( `No build scripts are defined for ${ t.project }\n` );
	} else {
		await t.execa( 'composer', [ 'run', '--timeout=0', script ], {
			cwd: t.cwd,
			stdio: [ 'ignore', 'inherit', 'inherit' ],
			buffer: false,
		} );
	}

	// If we're not mirroring, the build is done. Mirroring has a bunch of stuff to do yet.
	if ( ! t.argv.forMirrors ) {
		return;
	}

	// Update the changelog, if applicable.
	if (
		t.project === 'packages/changelogger' ||
		composerJson.require?.[ 'automattic/jetpack-changelogger' ] ||
		composerJson[ 'require-dev' ]?.[ 'automattic/jetpack-changelogger' ]
	) {
		const changelogger = npath.resolve( 'projects/packages/changelogger/bin/changelogger' );
		const changesDir = npath.resolve(
			t.cwd,
			composerJson.extra?.changelogger?.[ 'changes-dir' ] || 'changelog'
		);
		t.output( '\n=== Updating changelog ===\n\n' );
		if (
			await fs.readdir( changesDir ).then(
				a => a.filter( f => ! f.startsWith( '.' ) ).length > 0,
				() => false
			)
		) {
			let prerelease = 'alpha';
			if ( composerJson.extra?.[ 'dev-releases' ] ) {
				const m = (
					await t.execa( changelogger, [ 'version', 'current', '--default-first-version' ], {
						cwd: t.cwd,
						stdio: [ 'ignore', 'pipe', 'inherit' ],
					} )
				).stdout.match( /^.*-a\.(\d+)$/ );
				prerelease = 'a.' + ( m ? ( parseInt( m[ 1 ] ) & ~1 ) + 2 : 0 );
			}
			await t.execa(
				changelogger,
				[
					'write',
					'--prologue=This is an alpha version! The changes listed here are not final.',
					'--default-first-version',
					`--prerelease=${ prerelease }`,
					`--release-date=unreleased`,
					`--no-interaction`,
					`--yes`,
					`-vvv`,
				],
				{ cwd: t.cwd, stdio: [ 'ignore', 'inherit', 'inherit' ], buffer: false }
			);

			t.output( '\n=== Updating $$next-version$$ ===\n\n' );
			const ver = (
				await t.execa( changelogger, [ 'version', 'current' ], {
					cwd: t.cwd,
					stdio: [ 'ignore', 'pipe', 'inherit' ],
				} )
			).stdout;
			await t.execa(
				npath.resolve( 'tools/replace-next-version-tag.sh' ),
				[ '-v', t.project, ver ],
				{ stdio: [ 'ignore', 'inherit', 'inherit' ], buffer: false }
			);
		} else {
			t.output( 'Not updating changelog, there are no change files\n' );
		}
	}

	// Read mirror repo from composer.json.
	t.output( '\n=== Mirroring ===\n\n' );
	const gitSlug = composerJson.extra?.[ 'mirror-repo' ];
	if ( typeof gitSlug !== 'string' || gitSlug === '' ) {
		t.output( `No mirror repo is configured for ${ t.project }\n` );
		return;
	}
	t.output( `Repo name: ${ gitSlug }\n` );

	// Init build dir.
	const buildDir = npath.resolve( t.argv.forMirrors, gitSlug );
	t.output( `Build dir: ${ buildDir }\n` );
	await fs.mkdir( buildDir, { recursive: true } );

	// Copy standard .github.
	await copyDirectory( '.github/files/mirror-.github', npath.join( buildDir, '.github' ) );

	// Copy autotagger, autorelease, wp-svn-autopublish, and/or npmjs-autopublisher if enabled.
	if ( composerJson.extra?.autotagger ) {
		await copyDirectory( '.github/files/gh-autotagger', npath.join( buildDir, '.github' ) );
	}
	if ( composerJson.extra?.autorelease ) {
		await copyDirectory( '.github/files/gh-autorelease', npath.join( buildDir, '.github' ) );
	}
	if ( composerJson.extra?.[ 'wp-svn-autopublish' ] ) {
		await copyDirectory( '.github/files/gh-wp-svn-autopublish', npath.join( buildDir, '.github' ) );
	}
	if ( composerJson.extra?.[ 'npmjs-autopublish' ] ) {
		await copyDirectory(
			'.github/files/gh-npmjs-autopublisher',
			npath.join( buildDir, '.github' )
		);
	}

	// Copy e2e tests workflow if tests exist
	if ( await fsExists( `${ t.cwd }/tests/e2e` ) ) {
		await copyDirectory( '.github/files/gh-e2e', npath.join( buildDir, '.github' ) );
	}

	// Copy license.
	if ( composerJson.license ) {
		t.output( `License: ${ composerJson.license }\n` );
		try {
			await fs.copyFile(
				`.github/licenses/${ composerJson.license }.txt`,
				npath.join( buildDir, 'LICENSE.txt' )
			);
		} catch ( e ) {
			throw e.code === 'ENOENT' ? new Error( 'License value not approved.' ) : e;
		}
	} else {
		// @todo Make this an error?
		t.output( 'No license declared.\n' );
	}

	// Copy SECURITY.md.
	await fs.copyFile( `SECURITY.md`, npath.join( buildDir, 'SECURITY.md' ) );

	// Copy project files.
	for await ( const file of listProjectFiles( t.cwd, t.execa ) ) {
		const srcfile = npath.join( t.cwd, file );
		const destfile = npath.join( buildDir, file );
		await fs.mkdir( npath.dirname( destfile ), { recursive: true } );
		if ( destfile.endsWith( '/composer.json' ) || destfile.endsWith( '/package.json' ) ) {
			await copyFileAtomic( srcfile, destfile );
		} else {
			await fs.copyFile( srcfile, destfile );
		}
	}

	// HACK: Create stubs to avoid upgrade errors. See https://github.com/Automattic/jetpack/pull/22431.
	// Ideally we'll have fixed the upgrade errors by the time something else breaks, in which case this should be removed instead of extended.
	if ( t.project === 'plugins/jetpack' || t.project === 'plugins/backup' ) {
		t.output( '\n=== Stubbing old vendor files for backward compatibility ===\n\n' );
		const files = [
			'automattic/jetpack-roles/src/class-roles.php',
			'automattic/jetpack-backup/src/class-package-version.php',
			'automattic/jetpack-sync/src/class-package-version.php',
			'automattic/jetpack-connection/src/class-package-version.php',
			'automattic/jetpack-connection/src/class-urls.php',
			'automattic/jetpack-sync/src/class-functions.php',
			'automattic/jetpack-sync/src/class-queue-buffer.php',
			'automattic/jetpack-sync/src/class-utils.php',
			'automattic/jetpack-connection/legacy/class-jetpack-ixr-client.php',
			'automattic/jetpack-connection/src/class-client.php',
			'automattic/jetpack-connection/legacy/class-jetpack-signature.php',
		];
		for ( const file of files ) {
			const newfile = npath.join( buildDir, 'jetpack_vendor', file );
			if ( await fsExists( newfile ) ) {
				const oldfile = npath.join( buildDir, 'vendor', file );
				t.output( `Stubbing ${ oldfile } → ${ newfile }\n` );
				await fs.mkdir( npath.dirname( oldfile ), { recursive: true } );
				await fs.writeFile(
					oldfile,
					// prettier-ignore
					`<?php // Stub to avoid errors during upgrades\nrequire_once __DIR__ . '/${ npath.relative( npath.dirname( oldfile ), newfile ) }';\n`,
					{ encoding: 'utf8' }
				);
			}
		}
	}

	// Remove monorepo repos from composer.json.
	if ( composerJson.repositories && composerJson.repositories.some( r => r.options?.monorepo ) ) {
		composerJson.repositories = composerJson.repositories.filter( r => ! r.options?.monorepo );
		if ( composerJson.repositories.length === 0 ) {
			delete composerJson.repositories;
		}

		// Update '@dev' dependency version numbers in composer.json.
		const composerDepTyes = [ 'require', 'require-dev' ];
		for ( const key of composerDepTyes ) {
			if ( composerJson[ key ] ) {
				for ( const [ pkg, ver ] of Object.entries( composerJson[ key ] ) ) {
					if ( ver === '@dev' ) {
						for ( const ctxPkg of Object.values( t.ctx.versions ) ) {
							if ( ctxPkg.name === pkg ) {
								let massagedVer = ctxPkg.version;
								massagedVer = `^${ massagedVer }`;
								composerJson[ key ][ pkg ] = massagedVer;
								break;
							}
						}
					}
				}
			}
		}

		await writeFileAtomic(
			`${ buildDir }/composer.json`,
			JSON.stringify( composerJson, null, '\t' ) + '\n',
			{ encoding: 'utf8' }
		);
	}

	// Remove workspace refs and jetpack:src from package.json.
	let packageJson;
	if ( await fsExists( `${ buildDir }/package.json` ) ) {
		packageJson = JSON.parse(
			await fs.readFile( `${ buildDir }/package.json`, { encoding: 'utf8' } )
		);

		const depTypes = [
			'dependencies',
			'devDependencies',
			'peerDependencies',
			'optionalDependencies',
		];
		for ( const key of depTypes ) {
			if ( packageJson[ key ] ) {
				for ( const [ pkg, ver ] of Object.entries( packageJson[ key ] ) ) {
					if ( ver === 'workspace:*' ) {
						for ( const ctxPkg of Object.values( t.ctx.versions ) ) {
							if ( ctxPkg.jsName === pkg ) {
								let massagedVer = ctxPkg.version;
								massagedVer = `^${ massagedVer }`;
								packageJson[ key ][ pkg ] = massagedVer;
								break;
							}
						}
					}
				}
			}
		}

		if ( packageJson.exports ) {
			const filterJetpackSrc = obj => {
				if ( typeof obj !== 'object' ) {
					return obj;
				}
				let ret = { ...obj };
				delete ret[ 'jetpack:src' ];
				const keys = Object.keys( ret );
				if ( keys.length === 0 ) {
					ret = undefined;
				} else if ( keys.length === 1 && keys[ 0 ] === 'default' ) {
					ret = filterJetpackSrc( ret.default );
				} else {
					for ( const key of keys ) {
						ret[ key ] = filterJetpackSrc( ret[ key ] );
					}
				}
				return ret;
			};
			packageJson.exports = filterJetpackSrc( packageJson.exports );
		}

		await writeFileAtomic(
			`${ buildDir }/package.json`,
			JSON.stringify( packageJson, null, '\t' ) + '\n',
			{ encoding: 'utf8' }
		);
	}

	// If npmjs-autopublish is active, default to ignoring .github and composer.json (and not ignoring anything else) in the publish.
	if ( composerJson.extra?.[ 'npmjs-autopublish' ] ) {
		let ignore =
			'# Automatically generated ignore rules.\n/.gitattributes\n/.github/\n/composer.json\n';
		if ( await fsExists( `${ buildDir }/.npmignore` ) ) {
			ignore +=
				'\n# Package ignore file.\n' +
				( await fs.readFile( `${ buildDir }/.npmignore`, { encoding: 'utf8' } ) );
		}
		await fs.writeFile( `${ buildDir }/.npmignore`, ignore, { encoding: 'utf8' } );
	}

	// If autorelease is active, flag .git files to be excluded from the archive.
	if ( composerJson.extra?.autorelease ) {
		let rules = '# Automatically generated rules.\n/.git*\texport-ignore\n';
		if ( await fsExists( `${ buildDir }/.gitattributes` ) ) {
			rules +=
				'\n# Package attributes file.\n' +
				( await fs.readFile( `${ buildDir }/.gitattributes`, { encoding: 'utf8' } ) );
		}
		await fs.writeFile( `${ buildDir }/.gitattributes`, rules, { encoding: 'utf8' } );
	}

	// Check directory for filenames that differ only in case, as this will likely break.
	const collisions = await checkCollisions( buildDir );
	if ( collisions.length > 0 ) {
		throw new Error(
			'Build output constains files that differ only in case. This will be a compatibility issue.\n- ' +
				collisions.join( '\n- ' )
		);
	}

	// Get the project version number from the changelog.md file.
	let projectVersionNumber = '',
		projectRunVersionNumber;
	const changelogFileName = composerJson.extra?.changelogger?.changelog || 'CHANGELOG.md';
	const rl = rlcreateInterface( {
		input: createReadStream( `${ t.cwd }/${ changelogFileName }`, {
			encoding: 'utf8',
		} ),
		crlfDelay: Infinity,
	} );

	rl.on( 'line', line => {
		const match = line.match( /^## +(\[?[^\] ]+\]?)/ );
		if ( match && match[ 1 ] ) {
			projectRunVersionNumber = projectVersionNumber = match[ 1 ].replace( /[[\]]/g, '' );
			rl.close();
			rl.removeAllListeners();
		}
	} );
	await once( rl, 'close' );

	if ( ! projectVersionNumber ) {
		const dir = npath.relative(
			process.cwd(),
			npath.resolve( t.cwd, composerJson.extra?.changelogger?.[ 'changes-dir' ] || 'changelog' )
		);
		throw new Error(
			`\nFailed to fetch latest version number from ${ changelogFileName }\n\nIf this is the initial commit of a new project, be sure there's a change entry in ${ dir }/\n`
		);
	}

	if ( t.project.startsWith( 'packages/' ) && projectVersionNumber.endsWith( 'alpha' ) ) {
		const ts = (
			await t.execa( 'git', [ 'log', '-1', '--format=%ct', '.' ], {
				cwd: t.cwd,
				stdio: [ 'ignore', 'pipe', 'inherit' ],
			} )
		).stdout;
		if ( ts.match( /^\d+$/ ) ) {
			projectRunVersionNumber += '.' + ts;
		}
	}

	// Build succeeded! Now do some bookkeeping.
	t.ctx.versions[ t.project ] = {
		name: composerJson.name,
		jsName: packageJson?.name,
		version: projectVersionNumber,
		runversion: projectRunVersionNumber,
	};
	await t.ctx.mirrorMutex( async () => {
		// prettier-ignore
		await fs.appendFile( `${ t.argv.forMirrors }/mirrors.txt`, `${ gitSlug }\n`, { encoding: 'utf8' } );
	} );
}
