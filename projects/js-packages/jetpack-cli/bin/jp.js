#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import fs, { readFileSync } from 'fs';
import os from 'os';
import { dirname, resolve } from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import prompts from 'prompts';
import updateNotifier from 'update-notifier';

// Get package.json path relative to this file
const __dirname = dirname( fileURLToPath( import.meta.url ) );
const packageJson = JSON.parse( readFileSync( resolve( __dirname, '../package.json' ), 'utf8' ) );

// Check for updates
const notifier = updateNotifier( {
	pkg: packageJson,
	updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
} );

// Show update notification
notifier.notify( {
	message:
		'Update available for Jetpack CLI: {currentVersion} → {latestVersion}\n' +
		'Run {updateCommand} to update',
	isGlobal: true,
} );

/**
 * Check if a directory is the monorepo root.
 *
 * @param {string} dir - Directory to check
 * @return {boolean} True if this is the monorepo root
 */
const isMonorepoRoot = dir => {
	try {
		return fs.existsSync( resolve( dir, 'tools/docker/bin/monorepo' ) );
	} catch {
		return false;
	}
};

/**
 * Check if the CLI is running from monorepo source (vs npm installed).
 *
 * @return {boolean} True if running from source
 */
const isRunningFromSource = () => {
	let dir = __dirname;
	let prevDir;
	while ( dir !== prevDir ) {
		if ( isMonorepoRoot( dir ) ) {
			return true;
		}
		prevDir = dir;
		dir = dirname( dir );
	}
	return false;
};

/**
 * Compute development version by incrementing patch number.
 *
 * @return {string} Development version string (e.g., "1.0.3-alpha" for released "1.0.2")
 */
const computeDevVersion = () => {
	const [ major, minor, patch ] = packageJson.version.split( '.' ).map( Number );
	return `${ major }.${ minor }.${ patch + 1 }-alpha`;
};

// Version to display - dev version when running from source, package version otherwise
const displayVersion = isRunningFromSource() ? computeDevVersion() : packageJson.version;

/**
 * Find monorepo root from a starting directory.
 *
 * @param {string} startDir - Directory to start searching from
 * @return {string|null} Path to monorepo root, or null if not found
 */
const findMonorepoRoot = startDir => {
	let dir = startDir;
	let prevDir;
	while ( dir !== prevDir ) {
		// Keep going until dirname() stops changing the path
		if ( isMonorepoRoot( dir ) ) {
			return dir;
		}
		prevDir = dir;
		dir = dirname( dir );
	}
	return null;
};

/**
 * Clone the monorepo.
 *
 * @param {string} targetDir - Directory to clone into
 * @throws {Error} If clone fails
 */
const cloneMonorepo = async targetDir => {
	console.log( chalk.blue( 'Cloning Jetpack monorepo...' ) );
	const result = spawnSync(
		'git',
		[ 'clone', 'https://github.com/Automattic/jetpack.git', targetDir ],
		{ stdio: 'inherit' }
	);

	if ( result.status !== 0 ) {
		throw new Error( 'Failed to clone repository' );
	}
};

/**
 * Get list of git hooks from the .husky directory.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @return {Array<string>} List of hook names
 */
const getHuskyHooks = monorepoRoot => {
	const huskyDir = resolve( monorepoRoot, '.husky' );
	if ( ! fs.existsSync( huskyDir ) ) {
		return [];
	}

	// Filter for valid git hook names (lowercase letters and hyphens)
	const hookPattern = /^[a-z][a-z-]*$/;
	return fs.readdirSync( huskyDir ).filter( name => {
		const fullPath = resolve( huskyDir, name );
		return hookPattern.test( name ) && fs.statSync( fullPath ).isFile();
	} );
};

/**
 * Check if a husky hook file exists.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @param {string} hookName     - Name of the hook
 * @return {boolean} True if the hook exists
 */
const huskyHookExists = ( monorepoRoot, hookName ) => {
	return fs.existsSync( resolve( monorepoRoot, '.husky', hookName ) );
};

/**
 * Initialize git hooks that work with Docker.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @throws {Error} If hook installation fails
 */
const initHooks = monorepoRoot => {
	const hooksDir = resolve( monorepoRoot, '.git/hooks' );

	if ( ! fs.existsSync( hooksDir ) ) {
		throw new Error( 'Git hooks directory not found. Is this a git repository?' );
	}

	console.log( chalk.blue( 'Setting up jp git hooks...' ) );

	// Check if git is configured to use a custom hooks path (e.g., husky)
	const hooksPathResult = spawnSync( 'git', [ 'config', 'core.hooksPath' ], {
		cwd: monorepoRoot,
		encoding: 'utf8',
	} );

	if ( hooksPathResult.stdout && hooksPathResult.stdout.trim() ) {
		const currentHooksPath = hooksPathResult.stdout.trim();
		console.log( chalk.yellow( `  Detected custom git hooks path: ${ currentHooksPath }` ) );
		console.log( chalk.yellow( '  Resetting to use .git/hooks/ for jp hooks' ) );

		const unsetResult = spawnSync( 'git', [ 'config', '--unset', 'core.hooksPath' ], {
			cwd: monorepoRoot,
		} );

		if ( unsetResult.status !== 0 ) {
			throw new Error( 'Failed to unset core.hooksPath git configuration' );
		}
	}

	const hooks = getHuskyHooks( monorepoRoot );
	if ( hooks.length === 0 ) {
		console.log( chalk.yellow( '  No hooks found in .husky/' ) );
		return;
	}

	for ( const hookName of hooks ) {
		const hookPath = resolve( hooksDir, hookName );
		const hookContent = `#!/bin/sh
# Jetpack CLI git hook
# Runs the .husky hook in Docker to ensure consistent environment

# Exit gracefully if the .husky hook was removed
if [ ! -f .husky/${ hookName } ]; then
	exit 0
fi

# Check if we're already in the Docker container
if [ -n "$JETPACK_MONOREPO_ENV" ]; then
	echo "✓ Using jp hooks (running in Docker)"
	sh .husky/${ hookName } "$@"
	exit $?
fi

# Not in Docker - delegate to jp to run in Docker
echo "✓ Using jp hooks (delegating to Docker)"
jp git-hook ${ hookName } "$@"
exit $?
`;

		fs.writeFileSync( hookPath, hookContent, { mode: 0o755 } );
		console.log( chalk.green( `  Created ${ hookName } hook` ) );
	}

	console.log(
		chalk.green( '\n✓ Git hooks installed! Hooks will run automatically in Docker.\n' )
	);
};

/**
 * Run a git hook inside the Docker container.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @param {string} hookName     - Name of the hook to run
 * @param {Array}  hookArgs     - Arguments to pass to the hook
 * @throws {Error} If hook execution fails
 */
const runGitHook = ( monorepoRoot, hookName, hookArgs ) => {
	console.log( chalk.blue( `Running ${ hookName } hook in Docker...` ) );

	if ( ! huskyHookExists( monorepoRoot, hookName ) ) {
		throw new Error( `Unknown git hook: ${ hookName }` );
	}

	// Run the .husky hook directly through the monorepo script
	// TTY detection is handled by the monorepo script itself (reconnects to /dev/tty if available)
	const result = spawnSync(
		resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
		[ 'sh', `.husky/${ hookName }`, ...hookArgs ],
		{
			stdio: 'inherit',
			cwd: monorepoRoot,
		}
	);

	if ( result.status !== 0 ) {
		throw new Error( `Git hook ${ hookName } failed with status ${ result.status }` );
	}
};

/**
 * Initialize a new Jetpack development environment.
 *
 * @throws {Error} If initialization fails
 */
const initJetpack = async () => {
	const response = await prompts( {
		type: 'text',
		name: 'directory',
		message: 'Where would you like to clone the Jetpack monorepo?',
		initial: './jetpack',
	} );

	if ( ! response.directory ) {
		throw new Error( 'Setup cancelled' );
	}

	const targetDir = resolve( process.cwd(), response.directory );

	if ( fs.existsSync( targetDir ) ) {
		throw new Error( `Directory ${ targetDir } already exists` );
	}

	try {
		await cloneMonorepo( targetDir );

		console.log( chalk.green( '\nJetpack monorepo has been cloned successfully!' ) );

		// Initialize git hooks
		initHooks( targetDir );

		console.log( '\nNext steps:' );

		console.log( '1. cd', response.directory );

		console.log( '2. jp docker up' );

		console.log( '3. jp docker install' );
	} catch ( error ) {
		throw new Error( `Failed to initialize Jetpack: ${ error.message }` );
	}
};

/**
 * Detect whether the host rsync is Apple's openrsync fork.
 *
 * @return {{ isOpenrsync: boolean, copyLinksOpt: string }} Detection result.
 */
const detectOpenrsync = () => {
	if ( os.platform() !== 'darwin' ) {
		return { isOpenrsync: false, copyLinksOpt: '--copy-links' };
	}
	const versionResult = spawnSync( 'rsync', [ '--version' ], { encoding: 'utf8' } );
	const detected =
		versionResult.status === 0 && ( versionResult.stdout || '' ).includes( 'openrsync' );
	return {
		isOpenrsync: detected,
		copyLinksOpt: detected ? '--copy-unsafe-links' : '--copy-links',
	};
};

/**
 * Print the AUTOLOAD_DEV warning banner.
 */
const printAutoloadWarning = () => {
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
};

/**
 * Clean up the rsync data directory.
 *
 * @param {string} monorepoRoot - Path to the monorepo root.
 */
const cleanupRsyncData = monorepoRoot => {
	try {
		fs.rmSync( resolve( monorepoRoot, 'tools/docker/data/rsync' ), {
			recursive: true,
			force: true,
		} );
	} catch {
		// Ignore cleanup errors.
	}
};

/**
 * Run the host-side rsync command using metadata from the Docker phase.
 *
 * @param {string} monorepoRoot - Path to the monorepo root.
 * @param {string} copyLinksOpt - The --copy-links or --copy-unsafe-links flag.
 * @return {number} Exit code from rsync.
 */
const runHostRsync = ( monorepoRoot, copyLinksOpt ) => {
	const metadataPath = resolve( monorepoRoot, 'tools/docker/data/rsync/metadata.json' );
	if ( ! fs.existsSync( metadataPath ) ) {
		console.error( chalk.red( 'Error: rsync metadata not found after Docker phase.' ) );
		console.error( chalk.red( `Expected: ${ metadataPath }` ) );
		return 1;
	}

	let metadata;
	try {
		metadata = JSON.parse( fs.readFileSync( metadataPath, 'utf8' ) );
	} catch ( e ) {
		console.error( chalk.red( `Error: failed to parse rsync metadata: ${ e.message }` ) );
		return 1;
	}
	if ( metadata.version !== 1 ) {
		console.error(
			chalk.red(
				`Error: unsupported rsync metadata version ${ metadata.version }. ` +
					'Try updating the Jetpack CLI.'
			)
		);
		return 1;
	}
	const filterFile = resolve( monorepoRoot, metadata.filterFile );
	const source = resolve( monorepoRoot, metadata.source );
	// Ensure source ends with / for rsync directory semantics.
	const sourceArg = source.endsWith( '/' ) ? source : source + '/';

	const rsyncResult = spawnSync(
		'rsync',
		[
			'-azKPv',
			'--prune-empty-dirs',
			'--delete',
			'--delete-after',
			'--delete-excluded',
			copyLinksOpt,
			`--include-from=${ filterFile }`,
			sourceArg,
			metadata.dest,
		],
		{
			stdio: 'inherit',
			cwd: monorepoRoot,
		}
	);

	return rsyncResult.status ?? 1;
};

/**
 * Handle rsync in split mode: Docker for file collection, host for rsync binary.
 *
 * This allows rsync to use the host's native SSH, which is required for
 * Secure Enclave keys (AutoProxxy) that cannot be forwarded into Docker.
 *
 * @param {string} monorepoRoot - Path to the monorepo root.
 * @param {Array}  args         - Original CLI arguments (starting with 'rsync').
 */
const handleRsyncSplit = async ( monorepoRoot, args ) => {
	// Clean up stale data from previous runs.
	cleanupRsyncData( monorepoRoot );

	// Detect openrsync on the host (where rsync will actually run).
	// This mirrors the checks in rsync.js rsyncInit(), which are skipped in --prepare-filters mode.
	const { isOpenrsync: hostIsOpenrsync, copyLinksOpt } = detectOpenrsync();
	if ( hostIsOpenrsync ) {
		const versionResult = spawnSync( 'sw_vers', [ '--productVersion' ], { encoding: 'utf8' } );
		const macVersion = ( versionResult.stdout || '' ).trim();
		if ( macVersion === '15.4' ) {
			console.error(
				chalk.red(
					'The implementation of rsync in macOS 15.4 is unable to properly sync symlinks.'
				)
			);
			console.error( chalk.red( 'Please install standard rsync (e.g. `brew install rsync`).' ) );
			process.exitCode = 1;
			return;
		}
		console.error(
			chalk.yellow( 'The implementation of rsync in macOS is unable to properly sync symlinks.' )
		);
		console.error(
			chalk.yellow( 'Installing standard rsync (e.g. `brew install rsync`) is recommended.' )
		);
		if ( args.includes( '--non-interactive' ) ) {
			process.exitCode = 1;
			return;
		}
		console.error();
		const response = await prompts( {
			type: 'confirm',
			name: 'proceed',
			message:
				'Continuing will not break anything, but will copy many unneeded files.\nProceed to sync files?',
			initial: false,
		} );
		if ( ! response.proceed ) {
			return;
		}
	}

	const isWatch = args.includes( '--watch' );
	// Build the Docker command: inject --prepare-filters before any other args.
	const dockerArgs = [ ...args ];
	// Insert --prepare-filters after 'rsync'.
	const rsyncIdx = dockerArgs.indexOf( 'rsync' );
	dockerArgs.splice( rsyncIdx + 1, 0, '--prepare-filters' );

	const monorepoScript = resolve( monorepoRoot, 'tools/docker/bin/monorepo' );

	if ( ! isWatch ) {
		// === Single mode ===
		const dockerResult = spawnSync( monorepoScript, [ 'pnpm', 'jetpack', ...dockerArgs ], {
			stdio: 'inherit',
			cwd: monorepoRoot,
		} );

		if ( dockerResult.status !== 0 ) {
			cleanupRsyncData( monorepoRoot );
			throw new Error( `Docker phase failed with status ${ dockerResult.status }` );
		}

		const rsyncStatus = runHostRsync( monorepoRoot, copyLinksOpt );
		if ( rsyncStatus !== 0 ) {
			cleanupRsyncData( monorepoRoot );
			throw new Error( `rsync failed with status ${ rsyncStatus }` );
		}

		printAutoloadWarning();
		cleanupRsyncData( monorepoRoot );
	} else {
		// === Watch mode ===
		const triggerPath = resolve( monorepoRoot, 'tools/docker/data/rsync/trigger' );
		let firstSync = true;

		// Watch for trigger file changes (polling — works across filesystems).
		// Registered before spawning Docker to avoid missing the initial trigger.
		const onTriggerChange = () => {
			if ( ! fs.existsSync( triggerPath ) ) {
				return;
			}
			const status = runHostRsync( monorepoRoot, copyLinksOpt );
			if ( status !== 0 ) {
				console.error( chalk.red( `rsync exited with status ${ status }` ) );
			} else if ( firstSync ) {
				firstSync = false;
				printAutoloadWarning();
			}
		};

		fs.watchFile( triggerPath, { interval: 500 }, onTriggerChange );

		const dockerChild = spawn( monorepoScript, [ 'pnpm', 'jetpack', ...dockerArgs ], {
			stdio: 'inherit',
			cwd: monorepoRoot,
		} );

		const cleanup = () => {
			fs.unwatchFile( triggerPath, onTriggerChange );
			cleanupRsyncData( monorepoRoot );
		};

		// Forward termination signals to the Docker child.
		const onSignal = signal => {
			dockerChild.kill( signal );
			// The 'exit' handler below will clean up.
		};
		process.on( 'SIGINT', onSignal );
		process.on( 'SIGTERM', onSignal );

		dockerChild.on( 'exit', code => {
			cleanup();
			process.removeListener( 'SIGINT', onSignal );
			process.removeListener( 'SIGTERM', onSignal );
			process.exit( code ?? 0 );
		} );
	}
};

// Main execution
const main = async () => {
	try {
		const args = process.argv.slice( 2 );

		// Handle version flag
		if ( args[ 0 ] === '--version' || args[ 0 ] === '-v' ) {
			console.log( chalk.green( displayVersion ) );
			return;
		}

		// Handle 'init' command specially
		if ( args[ 0 ] === 'init' ) {
			await initJetpack();
			return;
		}

		// Try to find monorepo root from current directory
		const monorepoRoot = findMonorepoRoot( process.cwd() );

		if ( ! monorepoRoot ) {
			console.error( chalk.red( 'Could not find Jetpack monorepo.' ) );

			console.log( '\nTo get started:' );

			console.log( '1. Run', chalk.blue( 'jp init' ), 'to clone the repository' );

			console.log( '   OR' );

			console.log( '2. Navigate to an existing Jetpack monorepo directory' );
			throw new Error( 'Monorepo not found' );
		}

		// Handle 'init-hooks' command
		if ( args[ 0 ] === 'init-hooks' ) {
			initHooks( monorepoRoot );
			return;
		}

		// Handle 'git-hook' command
		if ( args[ 0 ] === 'git-hook' ) {
			const hookName = args[ 1 ];
			const hookArgs = args.slice( 2 );

			if ( ! hookName ) {
				console.error( chalk.red( 'Error: git-hook command requires a hook name' ) );
				console.log( 'Usage: jp git-hook <hook-name> [args...]' );
				throw new Error( 'Missing hook name' );
			}

			runGitHook( monorepoRoot, hookName, hookArgs );
			return;
		}

		// Handle docker commands that must run on the host machine
		if ( args[ 0 ] === 'docker' ) {
			const hostCommands = [ 'up', 'down', 'stop', 'clean' ];
			if ( hostCommands.includes( args[ 1 ] ) ) {
				// Handle command-specific setup/cleanup
				if ( args[ 1 ] === 'up' ) {
					// Create required directories
					fs.mkdirSync( resolve( monorepoRoot, 'tools/docker/data/jetpack_dev_mysql' ), {
						recursive: true,
					} );
					fs.mkdirSync( resolve( monorepoRoot, 'tools/docker/data/ssh.keys' ), {
						recursive: true,
					} );
					fs.mkdirSync( resolve( monorepoRoot, 'tools/docker/wordpress' ), { recursive: true } );

					// Create empty .env file
					fs.closeSync( fs.openSync( resolve( monorepoRoot, 'tools/docker/.env' ), 'a' ) );

					const configResult = spawnSync(
						resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
						[ 'pnpm', 'jetpack', 'docker', 'config' ],
						{
							stdio: 'inherit',
							shell: true,
							cwd: monorepoRoot,
						}
					);

					if ( configResult.status !== 0 ) {
						throw new Error( 'Failed to generate Docker config' );
					}
				} else if ( args[ 1 ] === 'clean' ) {
					// After docker-compose down -v, also remove local files
					const projectName = args.includes( '--type=e2e' ) ? 'jetpack_e2e' : 'jetpack_dev';
					const cleanupPaths = [
						resolve( monorepoRoot, 'tools/docker/wordpress/' ),
						resolve( monorepoRoot, 'tools/docker/wordpress-develop/*' ),
						resolve( monorepoRoot, 'tools/docker/logs/', projectName ),
						resolve( monorepoRoot, 'tools/docker/data/', `${ projectName }_mysql` ),
					];

					// Function to clean up after docker-compose down
					const cleanupFiles = () => {
						for ( const path of cleanupPaths ) {
							try {
								fs.rmSync( path, { recursive: true, force: true } );
							} catch ( error ) {
								console.warn(
									chalk.yellow( `Warning: Could not remove ${ path }: ${ error.message }` )
								);
							}
						}
					};

					// Add cleanup to process events to ensure it runs after docker-compose
					process.once( 'beforeExit', cleanupFiles );

					// Replace 'clean' with 'down -v' in the arguments
					args.splice( 1, 1, 'down', '-v' );
				}

				// Get project name (from docker.js)
				const projectName = args.includes( '--type=e2e' ) ? 'jetpack_e2e' : 'jetpack_dev';

				// Build environment variables (from docker.js)
				const envVars = {
					...process.env, // Start with process.env
				};

				// Add default env vars if they exist
				if ( fs.existsSync( resolve( monorepoRoot, 'tools/docker/default.env' ) ) ) {
					Object.assign(
						envVars,
						dotenv.parse( fs.readFileSync( resolve( monorepoRoot, 'tools/docker/default.env' ) ) )
					);
				}

				// Add user overrides from .env if they exist
				if ( fs.existsSync( resolve( monorepoRoot, 'tools/docker/.env' ) ) ) {
					Object.assign(
						envVars,
						dotenv.parse( fs.readFileSync( resolve( monorepoRoot, 'tools/docker/.env' ) ) )
					);
				}

				// Only set these specific vars if they're not already set in .env
				if ( ! envVars.COMPOSE_PROJECT_NAME ) {
					envVars.COMPOSE_PROJECT_NAME = projectName;
				}
				if ( ! envVars.PORT_WORDPRESS ) {
					envVars.PORT_WORDPRESS = args.includes( '--type=e2e' ) ? '8889' : '80';
				}

				// Load versions from .github/versions.sh if not already set
				if (
					! (
						envVars.PHP_VERSION &&
						envVars.COMPOSER_VERSION &&
						envVars.NODE_VERSION &&
						envVars.PNPM_VERSION
					)
				) {
					const versionsPath = resolve( monorepoRoot, '.github/versions.sh' );
					const versions = fs.readFileSync( versionsPath, 'utf8' );
					const versionVars = {};
					versions.split( '\n' ).forEach( line => {
						const match = line.match( /^([A-Z_]+)=(.+)$/ );
						if ( match ) {
							versionVars[ match[ 1 ] ] = match[ 2 ].replace( /['"]/g, '' );
						}
					} );

					// Only set version vars if they're not already set
					if ( ! envVars.PHP_VERSION ) envVars.PHP_VERSION = versionVars.PHP_VERSION;
					if ( ! envVars.COMPOSER_VERSION ) envVars.COMPOSER_VERSION = versionVars.COMPOSER_VERSION;
					if ( ! envVars.NODE_VERSION ) envVars.NODE_VERSION = versionVars.NODE_VERSION;
					if ( ! envVars.PNPM_VERSION ) envVars.PNPM_VERSION = versionVars.PNPM_VERSION;
				}

				// Always set HOST_CWD as it's required for Docker context
				envVars.HOST_CWD = monorepoRoot;

				// Build the list of compose files to use
				const composeFiles =
					args[ 0 ] === 'docker' && [ 'build-image', 'install' ].includes( args[ 1 ] )
						? [ '-f', resolve( monorepoRoot, 'tools/docker/docker-compose-monorepo.yml' ) ]
						: [
								'-f',
								resolve( monorepoRoot, 'tools/docker/docker-compose.yml' ),
								'-f',
								resolve( monorepoRoot, 'tools/docker/compose-mappings.built.yml' ),
								'-f',
								resolve( monorepoRoot, 'tools/docker/compose-extras.built.yml' ),
						  ];

				// Add dev profile for monorepo service
				const composeArgs = [ 'compose', '--profile', 'dev', ...composeFiles, ...args.slice( 1 ) ];

				const result = spawnSync( 'docker', composeArgs, {
					stdio: 'inherit',
					shell: true,
					cwd: resolve( monorepoRoot, 'tools/docker' ),
					env: envVars,
				} );

				if ( result.status !== 0 ) {
					throw new Error( `Docker command failed with status ${ result.status }` );
				}
				return;
			}
		}

		// Handle rsync in split mode: Docker collects files, host runs rsync with native SSH.
		// The --config flag falls through to all-in-Docker (no SSH needed).
		if ( args[ 0 ] === 'rsync' && ! args.includes( '--config' ) ) {
			await handleRsyncSplit( monorepoRoot, args );
			return;
		}

		// Run the monorepo script with the original arguments
		const result = spawnSync(
			resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
			[ 'pnpm', 'jetpack', ...args ],
			{
				stdio: 'inherit',
				cwd: monorepoRoot,
			}
		);

		if ( result.status !== 0 ) {
			throw new Error( `Command failed with status ${ result.status }` );
		}
	} catch ( error ) {
		console.error( chalk.red( error.message ) );
		process.exitCode = 1;
	}
};

main();
