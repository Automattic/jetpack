/**
 * External dependencies
 */
import { spawnSync } from 'child_process';
import chalk from 'chalk';

/**
 * Default handler for the monorepo Docker commands.
 *
 * @param {object} argv - Arguments passed.
 */
const defaultDockerCmdHandler = argv => {
	const args = process.argv.slice( 4 ); // node pnpm run docker <cmd> [args..]
	try {
		spawnSync( `pnpm`, [ 'run', `docker:${ argv._[ 1 ] }`, '--', ...args ], { stdio: 'inherit' } );
	} catch ( error ) {
		console.error( chalk.bgRed( `Failed to execute command docker:${ argv._[ 1 ] }. Error:` ) );
		console.log( error );
		process.exit( 1 );
	}

	if ( argv.v ) {
		console.log( argv );
	}
};

/**
 * Definition for the Docker commands.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the Docker commands defined.
 */
export function dockerDefine( yargs ) {
	yargs.command( {
		command: 'docker <cmd>',
		description: 'Run monorepo Docker commands',
		builder: builder => {
			return builder
				.command( {
					command: 'build',
					description: 'build jetpack within the docker env',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'build-image',
					description: 'build docker image',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'clean',
					description: 'remove docker images, mysql data, etc.',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'db',
					description: 'access mysql cli for the wp install',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'down',
					description: 'stop all docker containers',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'install',
					description: 'create a wp install',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-config',
					description: 'set jurassic tube config',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-up',
					description: 'start jurassic tube tunnel',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-down',
					description: 'stop jurassic tube tunnel',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'multisite-convert',
					description: 'convert wp install to multisite',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok',
					description: 'see tools/docker/README.md',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok-down',
					description: 'stop docker with ngrok',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok-up',
					description: 'start docker with ngrok',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'phpunit',
					description: 'run tests',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'phpunit:multisite',
					description: 'runs tests for wp multisite install',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'run-extras',
					description: 'see tools/docker/bin/run-extras.sh',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'sh',
					description: 'access shell for the wp install',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'stop',
					description: 'stop docker containers',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'tail',
					description: 'watch wp debug.log output in console',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'uninstall',
					description: 'remove current wordpress install',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'up',
					description: 'start docker containers',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'update-core-unit-tests',
					description: 'updates unit test dirs',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'wp',
					description: 'pass commands to wp-cli',
					handler: defaultDockerCmdHandler,
				} );
		},
	} );

	return yargs;
}
