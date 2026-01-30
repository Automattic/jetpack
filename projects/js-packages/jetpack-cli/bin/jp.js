#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import fs, { readFileSync, readdirSync } from 'fs';
import net from 'net';
import os from 'os';
import { dirname, resolve } from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import prompts from 'prompts';
import { parse as shellParse } from 'shell-quote';
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
 * Read saved rsync destinations from the config store.
 * Checks both the Docker volume location and the standard configstore location.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @return {object} Object mapping alias names to destination paths
 */
const readRsyncConfig = monorepoRoot => {
	// Possible config locations (Docker volume first, then standard configstore)
	const configPaths = [
		resolve(
			monorepoRoot,
			'tools/docker/data/monorepo/.config/configstore/automattic/jetpack-cli/rsync.json'
		),
		resolve(
			process.env.XDG_CONFIG_HOME || resolve( os.homedir(), '.config', 'configstore' ),
			'automattic',
			'jetpack-cli',
			'rsync.json'
		),
	];

	for ( const configPath of configPaths ) {
		try {
			if ( fs.existsSync( configPath ) ) {
				return JSON.parse( readFileSync( configPath, 'utf8' ) );
			}
		} catch {
			// Ignore errors, try next path
		}
	}
	return {};
};

/**
 * List available plugins in the monorepo.
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @return {Array} Array of plugin directory names
 */
const listPlugins = monorepoRoot => {
	const pluginsDir = resolve( monorepoRoot, 'projects/plugins' );
	try {
		return readdirSync( pluginsDir, { withFileTypes: true } )
			.filter( dirent => dirent.isDirectory() )
			.map( dirent => dirent.name )
			.sort();
	} catch {
		return [];
	}
};

/**
 * Parse rsync command args to extract plugin and dest values.
 *
 * @param {Array} args - Command line arguments
 * @return {object} Object with plugin, dest, and other parsed values
 */
const parseRsyncArgs = args => {
	const result = { plugin: null, dest: null, watch: false, remainingArgs: [] };

	for ( let i = 0; i < args.length; i++ ) {
		const arg = args[ i ];
		if ( arg === '--plugin' || arg === '-p' ) {
			result.plugin = args[ ++i ];
		} else if ( arg.startsWith( '--plugin=' ) ) {
			result.plugin = arg.split( '=' )[ 1 ];
		} else if ( arg === '--dest' || arg === '-d' ) {
			result.dest = args[ ++i ];
		} else if ( arg.startsWith( '--dest=' ) ) {
			result.dest = arg.split( '=' )[ 1 ];
		} else if ( arg === '--watch' || arg === '-w' ) {
			result.watch = true;
			result.remainingArgs.push( arg );
		} else if ( arg !== 'rsync' ) {
			result.remainingArgs.push( arg );
		}
	}

	return result;
};

/**
 * Prompt for plugin selection if not already specified.
 *
 * @param {string}      monorepoRoot - Path to the monorepo root
 * @param {string|null} currentValue - Current plugin value from args
 * @return {Promise<string>} Selected plugin name
 */
const promptForPlugin = async ( monorepoRoot, currentValue ) => {
	if ( currentValue ) {
		return currentValue;
	}

	const plugins = listPlugins( monorepoRoot );
	if ( plugins.length === 0 ) {
		throw new Error( 'No plugins found in projects/plugins/' );
	}

	const choices = plugins.map( p => ( { title: p, value: p } ) );

	const response = await prompts( {
		type: 'autocomplete',
		name: 'plugin',
		message: 'Which plugin?',
		choices,
		suggest: ( input, choices_ ) => {
			const inputLower = input.toLowerCase();
			return Promise.resolve(
				choices_.filter( choice => choice.title.toLowerCase().includes( inputLower ) )
			);
		},
	} );

	if ( ! response.plugin ) {
		throw new Error( 'Plugin selection cancelled' );
	}

	return response.plugin;
};

/**
 * Prompt for destination selection if not already specified.
 *
 * @param {string}      monorepoRoot - Path to the monorepo root
 * @param {string|null} currentValue - Current dest value from args
 * @return {Promise<string>} Selected destination path or alias
 */
const promptForDest = async ( monorepoRoot, currentValue ) => {
	const config = readRsyncConfig( monorepoRoot );

	// If current value is an alias, resolve it
	if ( currentValue ) {
		// Configstore escapes dots in keys by replacing . with \.
		// We need to check both the original key and the escaped version
		// Use split/join for safe string replacement (no regex special char issues)
		const escapedKey = currentValue.split( '.' ).join( '\\.' );
		if ( config[ escapedKey ] ) {
			console.log( `Alias found, using dest: ${ config[ escapedKey ] }` );
			return config[ escapedKey ];
		}
		if ( config[ currentValue ] ) {
			console.log( `Alias found, using dest: ${ config[ currentValue ] }` );
			return config[ currentValue ];
		}
		// Not an alias, use as-is
		return currentValue;
	}

	const savedDests = Object.keys( config );

	if ( savedDests.length === 0 ) {
		// No saved destinations, prompt for new one
		const response = await prompts( {
			type: 'text',
			name: 'dest',
			message:
				"Input destination host:path to the plugin's dir or the /plugins or /mu-plugins dir:",
			validate: v => ( v === '' ? 'Please enter a host:path' : true ),
		} );

		if ( ! response.dest ) {
			throw new Error( 'Destination input cancelled' );
		}

		return response.dest;
	}

	// Show saved destinations with option to create new
	const choices = [
		{ title: 'Create new destination', value: '__new__' },
		...savedDests.map( key => ( {
			title: `${ key } → ${ config[ key ] }`,
			value: config[ key ],
		} ) ),
	];

	const response = await prompts( {
		type: 'select',
		name: 'dest',
		message: 'Choose destination:',
		choices,
	} );

	if ( response.dest === undefined ) {
		throw new Error( 'Destination selection cancelled' );
	}

	if ( response.dest === '__new__' ) {
		const newResponse = await prompts( {
			type: 'text',
			name: 'dest',
			message:
				"Input destination host:path to the plugin's dir or the /plugins or /mu-plugins dir:",
			validate: v => ( v === '' ? 'Please enter a host:path' : true ),
		} );

		if ( ! newResponse.dest ) {
			throw new Error( 'Destination input cancelled' );
		}

		return newResponse.dest;
	}

	return response.dest;
};

/**
 * Run rsync command with SSH TCP proxy.
 * This allows rsync to run inside Docker while SSH connections are handled by the host,
 * enabling support for Secure Enclave SSH keys (like AutoProxxy) that can't be forwarded into Docker.
 *
 * Architecture:
 * 1. Host creates a TCP server on a random port
 * 2. Run rsync in Docker with RSYNC_PROXY_PORT set
 * 3. When rsync needs SSH, the rsh-proxy script connects to host.docker.internal:port
 * 4. rsh-proxy sends the SSH command as the first line, then proxies data
 * 5. Host reads the command, spawns SSH, and proxies data bidirectionally
 * 6. Data flows: rsync <-> TCP <-> host SSH <-> remote
 *
 * @param {string} monorepoRoot - Path to the monorepo root
 * @param {Array}  args         - Command arguments (starting with 'rsync')
 * @throws {Error} If rsync fails
 */
const runRsyncWithProxy = async ( monorepoRoot, args ) => {
	let tcpServer = null;
	let dockerProcess = null;
	let cleanedUp = false;

	/**
	 * Clean up the TCP server.
	 */
	const cleanup = () => {
		if ( cleanedUp ) {
			return;
		}
		cleanedUp = true;

		if ( tcpServer ) {
			tcpServer.close();
			tcpServer = null;
		}
	};

	/**
	 * Handle an incoming TCP connection from the rsh-proxy script.
	 * Protocol: first line is the SSH command, then bidirectional data proxy.
	 *
	 * @param {net.Socket} socket - The incoming TCP connection
	 */
	const handleConnection = socket => {
		let sshCommand = '';
		let sshProcess = null;
		let commandReceived = false;

		socket.on( 'data', data => {
			if ( ! commandReceived ) {
				// Accumulate data until we see a newline (end of command)
				sshCommand += data.toString();
				const newlineIndex = sshCommand.indexOf( '\n' );

				if ( newlineIndex !== -1 ) {
					// Extract the command and any remaining data
					const command = sshCommand.substring( 0, newlineIndex ).trim();
					const remainingData = sshCommand.substring( newlineIndex + 1 );
					commandReceived = true;

					// Parse the command safely using shell-quote
					// The command comes from our rsync-rsh-proxy.sh and should be "ssh <args>"
					const parsedArgs = shellParse( command );

					// Validate that this is an SSH command (security check)
					if ( parsedArgs.length === 0 || parsedArgs[ 0 ] !== 'ssh' ) {
						console.error( chalk.red( 'Invalid command received: expected ssh command' ) );
						socket.destroy();
						return;
					}

					// Spawn SSH directly with parsed arguments (safer than bash -c)
					const sshArgs = parsedArgs.slice( 1 );
					sshProcess = spawn( 'ssh', sshArgs, {
						stdio: [ 'pipe', 'pipe', 'inherit' ],
					} );

					// Proxy stdout from SSH to socket
					sshProcess.stdout.on( 'data', chunk => {
						socket.write( chunk );
					} );

					sshProcess.on( 'close', () => {
						// Signal end of writing but keep socket readable
						// This allows the container to close the connection when ready
						socket.end();
					} );

					sshProcess.on( 'error', err => {
						console.error( chalk.yellow( `SSH process error: ${ err.message }` ) );
						socket.destroy();
					} );

					// Send any data that came after the command
					if ( remainingData.length > 0 ) {
						sshProcess.stdin.write( remainingData );
					}
				}
			} else if ( sshProcess ) {
				// Command already received, proxy data to SSH stdin
				sshProcess.stdin.write( data );
			}
		} );

		socket.on( 'end', () => {
			if ( sshProcess ) {
				sshProcess.stdin.end();
			}
		} );

		socket.on( 'error', err => {
			// Connection errors are expected when rsync closes the connection
			if ( err.code !== 'ECONNRESET' ) {
				console.error( chalk.yellow( `Socket error: ${ err.message }` ) );
			}
			if ( sshProcess ) {
				sshProcess.kill();
			}
		} );
	};

	// Set up cleanup handlers
	const onSignal = signal => {
		cleanup();
		if ( dockerProcess ) {
			dockerProcess.kill( signal );
		}
	};

	process.on( 'SIGINT', () => {
		onSignal( 'SIGINT' );
		process.exit( 130 );
	} );

	process.on( 'SIGTERM', () => {
		onSignal( 'SIGTERM' );
		process.exit( 143 );
	} );

	process.on( 'exit', cleanup );

	try {
		// Create TCP server and wait for it to start listening
		const port = await new Promise( ( resolvePort, rejectPort ) => {
			tcpServer = net.createServer( handleConnection );

			tcpServer.on( 'error', err => {
				rejectPort( err );
			} );

			// Listen on a random port (0 = OS assigns a free port)
			tcpServer.listen( 0, '0.0.0.0', () => {
				const addr = tcpServer.address();
				resolvePort( addr.port );
			} );
		} );

		// Build the command args, adding --non-interactive if not already present
		// This is necessary because interactive prompts don't work properly when stdin
		// is being proxied through the TCP connection
		const rsyncArgs = [ ...args ];
		if ( ! rsyncArgs.includes( '--non-interactive' ) && ! rsyncArgs.includes( '-n' ) ) {
			rsyncArgs.push( '--non-interactive' );
		}

		// Run the monorepo script with RSYNC_PROXY_PORT set
		const result = await new Promise( ( resolvePromise, rejectPromise ) => {
			dockerProcess = spawn(
				resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
				[ 'pnpm', 'jetpack', ...rsyncArgs ],
				{
					stdio: 'inherit',
					cwd: monorepoRoot,
					env: {
						...process.env,
						RSYNC_PROXY_PORT: String( port ),
					},
				}
			);

			dockerProcess.on( 'close', code => {
				resolvePromise( { status: code } );
			} );

			dockerProcess.on( 'error', err => {
				rejectPromise( err );
			} );
		} );

		cleanup();

		if ( result.status !== 0 ) {
			throw new Error( `Command failed with status ${ result.status }` );
		}
	} catch ( err ) {
		cleanup();
		throw err;
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

		// Handle rsync command with SSH proxy for Secure Enclave keys
		// This allows rsync to run inside Docker while using host SSH authentication
		if (
			args[ 0 ] === 'rsync' &&
			! args.includes( '--config' ) &&
			! args.includes( '--help' ) &&
			! args.includes( '-h' )
		) {
			// Parse args to check if plugin and dest are provided
			const parsed = parseRsyncArgs( args );

			// Prompt for missing values on the host side (before starting Docker)
			// This is necessary because interactive prompts don't work when stdin
			// is being proxied through the TCP connection
			const plugin = await promptForPlugin( monorepoRoot, parsed.plugin );
			const dest = await promptForDest( monorepoRoot, parsed.dest );

			// Build the final args with the selected/provided values
			const finalArgs = [ 'rsync', '--plugin', plugin, '--dest', dest, ...parsed.remainingArgs ];

			await runRsyncWithProxy( monorepoRoot, finalArgs );
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
