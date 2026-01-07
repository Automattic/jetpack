import { spawnSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

/**
 * Path to wp-env binary.
 */
const wpEnvBin = path.resolve( 'node_modules/.bin/wp-env' );

/**
 * Path to monorepo root.
 */
const monorepoRoot = path.resolve( '.' );

/**
 * Execute wp-env command.
 *
 * @param {Array}  args    - Command arguments
 * @param {object} options - Spawn options
 * @return {object} Process result
 */
function runWpEnv( args, options = {} ) {
	const defaultOptions = {
		cwd: monorepoRoot,
		stdio: 'inherit',
		shell: true,
	};

	const result = spawnSync( wpEnvBin, args, { ...defaultOptions, ...options } );

	if ( result.status !== 0 && result.status !== null ) {
		process.exit( result.status );
	}

	return result;
}

/**
 * Command definition for wp-env.
 *
 * @param {object} yargs - Yargs instance
 * @return {object} Yargs instance
 */
export function wpEnvDefine( yargs ) {
	return yargs.command( {
		command: 'wp-env <cmd>',
		description:
			'WordPress development environment powered by @wordpress/env. Alternative to `jp docker` commands.',
		builder: yargCmd => {
			yargCmd
				.command( {
					command: 'start',
					description: 'Start the WordPress environment',
					builder: yargStart =>
						yargStart
							.option( 'xdebug', {
								describe: 'Enable Xdebug',
								type: 'string',
								default: false,
							} )
							.option( 'update', {
								describe: 'Update WordPress to the latest version',
								type: 'boolean',
								default: false,
							} ),
					handler: argv => {
						const args = [ 'start' ];
						if ( argv.xdebug ) {
							args.push( '--xdebug=' + argv.xdebug );
						}
						if ( argv.update ) {
							args.push( '--update' );
						}
						console.log( chalk.green( 'Starting wp-env...' ) );
						runWpEnv( args );
					},
				} )
				.command( {
					command: 'stop',
					description: 'Stop the WordPress environment',
					handler: () => {
						console.log( chalk.yellow( 'Stopping wp-env...' ) );
						runWpEnv( [ 'stop' ] );
					},
				} )
				.command( {
					command: 'destroy',
					description: 'Destroy the WordPress environment (removes all data)',
					handler: () => {
						console.log( chalk.red( 'Destroying wp-env environment...' ) );
						runWpEnv( [ 'destroy' ] );
					},
				} )
				.command( {
					command: 'clean [environment]',
					description: 'Clean the WordPress environment data',
					builder: yargClean =>
						yargClean.positional( 'environment', {
							describe: 'Which environment to clean (all, tests, development)',
							type: 'string',
							default: 'all',
						} ),
					handler: argv => {
						console.log( chalk.yellow( `Cleaning wp-env (${ argv.environment })...` ) );
						runWpEnv( [ 'clean', argv.environment ] );
					},
				} )
				.command( {
					command: 'run <container> <command...>',
					description: 'Run a command in a container (cli, wordpress, tests-cli, tests-wordpress)',
					builder: yargRun =>
						yargRun
							.positional( 'container', {
								describe: 'Container to run command in',
								type: 'string',
							} )
							.positional( 'command', {
								describe: 'Command to run',
								type: 'array',
							} ),
					handler: argv => {
						runWpEnv( [ 'run', argv.container, ...argv.command ] );
					},
				} )
				.command( {
					command: 'wp <command...>',
					description: 'Run WP-CLI command in the WordPress container',
					builder: yargWp =>
						yargWp.positional( 'command', {
							describe: 'WP-CLI command to run',
							type: 'array',
						} ),
					handler: argv => {
						runWpEnv( [ 'run', 'cli', 'wp', ...argv.command ] );
					},
				} )
				.command( {
					command: 'sh',
					description: 'Open a shell in the WordPress container',
					handler: () => {
						runWpEnv( [ 'run', 'wordpress', 'bash' ] );
					},
				} )
				.command( {
					command: 'logs [environment]',
					description: 'View logs from the WordPress environment',
					builder: yargLogs =>
						yargLogs
							.positional( 'environment', {
								describe: 'Which environment (development, tests)',
								type: 'string',
								default: 'development',
							} )
							.option( 'watch', {
								alias: 'f',
								describe: 'Follow logs',
								type: 'boolean',
								default: false,
							} ),
					handler: argv => {
						const args = [ 'logs' ];
						if ( argv.environment ) {
							args.push( argv.environment );
						}
						if ( argv.watch ) {
							args.push( '--watch' );
						}
						runWpEnv( args );
					},
				} )
				.command( {
					command: 'install-path',
					description: 'Get the path where wp-env stores WordPress files',
					handler: () => {
						runWpEnv( [ 'install-path' ] );
					},
				} )
				.command( {
					command: 'status',
					description: 'Check the status of the WordPress environment',
					handler: () => {
						// wp-env doesn't have a status command, so we check if containers are running
						const result = spawnSync(
							'docker',
							[ 'ps', '--filter', 'name=wp-env', '--format', '{{.Names}}\t{{.Status}}' ],
							{
								cwd: monorepoRoot,
								encoding: 'utf-8',
							}
						);

						if ( result.stdout && result.stdout.trim() ) {
							console.log( chalk.green( 'wp-env is running:' ) );
							console.log( result.stdout );
						} else {
							console.log( chalk.yellow( 'wp-env is not running. Start with: jp wp-env start' ) );
						}
					},
				} );
		},
	} );
}
