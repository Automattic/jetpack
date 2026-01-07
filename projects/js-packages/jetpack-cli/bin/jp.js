#!/usr/bin/env node

import { spawnSync } from 'child_process';
import fs, { readFileSync } from 'fs';
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

		console.log( '\nNext steps:' );

		console.log( '1. cd', response.directory );

		console.log( '2. jp docker up' );

		console.log( '3. jp docker install' );
	} catch ( error ) {
		throw new Error( `Failed to initialize Jetpack: ${ error.message }` );
	}
};

// Main execution
const main = async () => {
	try {
		const args = process.argv.slice( 2 );

		// Handle version flag
		if ( args[ 0 ] === '--version' || args[ 0 ] === '-v' ) {
			console.log( chalk.green( packageJson.version ) );
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

		// Handle wp-env commands that must run on the host machine
		if ( args[ 0 ] === 'wp-env' ) {
			// Use local wp-env if available, otherwise use npx
			const localWpEnv = resolve( monorepoRoot, 'node_modules/.bin/wp-env' );
			const wpEnvBin = fs.existsSync( localWpEnv ) ? localWpEnv : 'npx';
			const useNpx = ! fs.existsSync( localWpEnv );

			// Map jp wp-env commands to wp-env commands
			const wpEnvArgs = args.slice( 1 );
			let wpEnvCommand = [];

			switch ( wpEnvArgs[ 0 ] ) {
				case 'start':
				case 'stop':
				case 'destroy':
				case 'clean':
				case 'logs':
				case 'install-path':
					wpEnvCommand = wpEnvArgs;
					break;
				case 'run':
					wpEnvCommand = wpEnvArgs;
					break;
				case 'wp':
					// jp wp-env wp <command> -> wp-env run cli wp <command>
					wpEnvCommand = [ 'run', 'cli', 'wp', ...wpEnvArgs.slice( 1 ) ];
					break;
				case 'sh':
					// jp wp-env sh -> wp-env run wordpress bash
					wpEnvCommand = [ 'run', 'wordpress', 'bash' ];
					break;
				case 'status': {
					// Check if wp-env containers are running (they have hash prefixes like fd645e64...)
					const statusResult = spawnSync(
						'docker',
						[
							'ps',
							'--filter',
							'name=wordpress-1',
							'--filter',
							'name=mysql-1',
							'--format',
							'{{.Names}}\t{{.Status}}',
						],
						{
							cwd: monorepoRoot,
							encoding: 'utf-8',
						}
					);

					if ( statusResult.stdout && statusResult.stdout.trim() ) {
						console.log( chalk.green( 'wp-env is running:' ) );
						console.log( statusResult.stdout );
					} else {
						console.log( chalk.yellow( 'wp-env is not running. Start with: jp wp-env start' ) );
					}
					return;
				}
				default:
					// Pass through any unknown commands
					wpEnvCommand = wpEnvArgs;
			}

			// If using npx, prepend @wordpress/env to the command
			const finalCommand = useNpx ? [ '@wordpress/env', ...wpEnvCommand ] : wpEnvCommand;

			const result = spawnSync( wpEnvBin, finalCommand, {
				stdio: 'inherit',
				shell: true,
				cwd: monorepoRoot,
			} );

			if ( result.status !== 0 && result.status !== null ) {
				throw new Error( `wp-env command failed with status ${ result.status }` );
			}
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

		// Run the monorepo script with the original arguments
		const result = spawnSync(
			resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
			[ 'pnpm', 'jetpack', ...args ],
			{
				stdio: 'inherit',
				shell: true,
				cwd: monorepoRoot, // Ensure we're in the monorepo root when running commands
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
