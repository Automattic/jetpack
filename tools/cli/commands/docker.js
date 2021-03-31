/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';

/**
 * Default handler for the monorepo Docker commands.
 *
 * @param {object} argv - Arguments passed.
 */
const defaultDockerCmdHandler = argv => {
	try {
		child_process.spawnSync( `yarn`, [ `docker:${ argv._[ 1 ] }` ], {
			stdio: 'inherit',
		} );
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
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'build-image',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'clean',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'compose',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'compose-extras',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'compose-volumes',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'db',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'down',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'env',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'install',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-config',
					description: 'set Jurassic Tube config',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-up',
					description: 'start Jurassic Tube tunnel',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'jt-down',
					description: 'stop Jurassic Tube tunnel',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'multisite-convert',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok-down',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'ngrok-up',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'phpunit',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'phpunit:multisite',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'run-extras',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'sh',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'stop',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'tail',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'uninstall',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'up',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'update-core-unit-tests',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} )
				.command( {
					command: 'wp',
					description: 'todo',
					handler: defaultDockerCmdHandler,
				} );
		},
		handler: argv => {
			yargs.showHelp();
			console.error( chalk.bgRed( '\nUnknown command:' ), argv.cmd );
			if ( argv.v ) {
				console.log( argv );
			}
		},
	} );

	return yargs;
}
