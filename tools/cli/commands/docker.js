/**
 * External dependencies
 */
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { createWriteStream, existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';

const dockerFolder = `tools/docker`;

/**
 * Sets default options that are common for most of the commands
 *
 * @param {Object} yargs Yargs
 * @return {Object} Modified Yargs object
 */
const defaultOpts = yargs =>
	yargs
		.option( 'type', {
			alias: 't',
			describe: 'Container type',
		} )
		.option( 'name', {
			alias: 'n',
			describe: 'Project name',
		} )
		.option( 'port', {
			alias: 'p',
			describe: 'WP port',
		} );

/**
 * Gets a project name from the passed aguments. Defaults to 'dev' if not specified.
 *
 * @param {Object} argv Yargs
 * @return {string} Project name
 */
const getProjectName = argv => {
	let project = 'dev';
	if ( argv.type === 'e2e' ) {
		project = argv.name ? argv.name : 'e2e';
	}

	return project;
};

/**
 * Builds a map of ENV variables for specified configuration
 *
 * @param {Object} argv Yargs
 * @return {Object} key-value pairs of ENV variables
 */
const buildEnv = argv => {
	const envOpts = { PORT: 80 };
	if ( argv.type === 'e2e' ) {
		envOpts.PORT_WORDPRESS = argv.port ? argv.port : 8889;
	}

	envOpts.COMPOSE_PROJECT_NAME = getProjectName( argv );
	return envOpts;
};

/**
 * Creates an .env file
 */
const setEnv = () => {
	createWriteStream( `${ dockerFolder }/.env`, {
		flags: 'a',
	} );
};

/**
 * Creates a default extras file if needed.
 */
const setExtras = () => {
	const extrasFile = `${ dockerFolder }/compose-extras.yml`;
	const extrasSampleFile = `${ dockerFolder }/compose-extras.yml.sample`;

	if ( ! existsSync( extrasFile ) ) {
		copyFileSync( extrasSampleFile, extrasFile );
	}
};

/**
 * Generates Volumes compose file
 *
 * @param {Object} argv Yargs
 */
const setVolumes = argv => {
	const volumesFile = `${ dockerFolder }/compose-volumes.yml`;
	const volumesBuiltFile = `${ dockerFolder }/compose-volumes.built.yml`;
	const sampleFile = `${ dockerFolder }/compose-volumes.yml.sample`;

	if ( ! existsSync( volumesFile ) ) {
		copyFileSync( sampleFile, volumesFile );
	}

	const volumesContents = readFileSync( volumesFile, 'utf8' );
	const indentedContents = volumesContents
		.split( '\n' )
		.map( l => '      ' + l )
		.join( '\n' );
	let header = `## FIXME: Built by \`jetpack docker\` CLI
## This file regenerates automatically every time up/down/stop command is called.

version: '3.3'
services:
  wordpress:
    volumes:
${ indentedContents }`;

	if ( argv.type === 'dev' ) {
		// Update the abs path to wordpress installation
		header += `
  sftp:
    volumes:
${ indentedContents.replace( /\/var\/www\/html/, '/home/wordpress/var/www/html' ) }`;
	}
	writeFileSync( volumesBuiltFile, header );
};

/**
 * Default executor with error handler
 *
 * @param {Object} argv Yargs
 * @param {Function} fnc Function to execute
 */
const executor = ( argv, fnc ) => {
	try {
		fnc( argv );
	} catch ( error ) {
		console.error( chalk.bgRed( `Failed to execute the function. Error:` ) );
		console.error( error );
		process.exit( 1 );
	}

	if ( argv.v ) {
		console.log( argv );
	}
};

/**
 * Executor for `docker-compose` commands
 *
 * @param {Object} argv Yargs
 * @param {Array} opts Array of arguments
 * @param {Object} envOpts key-value pairs of the ENV variables to set
 */
const composeExecutor = ( argv, opts, envOpts ) => {
	executor( argv, () => {
		if ( argv.v ) {
			console.log(
				'Running command: ',
				Object.entries( envOpts )
					.map( a => `${ a[ 0 ] }=${ a[ 1 ] }` )
					.join( ' ' ),
				'docker-compose',
				opts.join( ' ' )
			);
		}

		spawnSync( `docker-compose`, opts, {
			env: { ...envOpts, ...process.env },
			stdio: 'inherit',
		} );
	} );
};

/**
 * Builds an array of compose files matching configuration options.
 *
 * @param {Object} argv Yargs
 * @return {Array} Array of shell arguments
 */
const buildComposeFiles = argv => {
	const defaultCompose = [ `-f${ dockerFolder }/docker-compose.yml` ];
	const extendFiles = [
		`-f${ dockerFolder }/compose-volumes.built.yml`,
		`-f${ dockerFolder }/compose-extras.yml`,
	];
	const compose = defaultCompose;
	if ( argv.type !== 'e2e' ) {
		compose.push( `-f${ dockerFolder }/docker-compose.dev.yml` );
	}
	return compose.concat( extendFiles );
};

/**
 * Builds an array of opts that are required to run arbitrary compose command.
 *
 * @param {Object} argv Yargs
 * @return {Array} Array of options required for specified command
 */
const buildDefaultCmd = argv => {
	const opts = buildComposeFiles( argv );
	if ( argv._[ 1 ] === 'up' ) {
		opts.push( 'up' );
		if ( argv.detached ) {
			opts.push( '-d' );
		}
	} else if ( argv._[ 1 ] === 'down' ) {
		opts.push( 'down' );
	} else if ( argv._[ 1 ] === 'stop' ) {
		opts.push( 'stop' );
	} else if ( argv._[ 1 ] === 'clean' ) {
		opts.push( 'down', '-v' );
	}

	return opts;
};

/**
 * Default handler for the monorepo Docker commands.
 *
 * @param {Object} argv - Arguments passed.
 */
const defaultDockerCmdHandler = argv => {
	executor( argv, setEnv );
	executor( argv, setVolumes );
	executor( argv, setExtras );

	const opts = buildDefaultCmd( argv );
	const envOpts = buildEnv( argv );
	composeExecutor( argv, opts, envOpts );
};

/**
 * Builds an array of opts that are required to execute specified command in wordpress container
 *
 * @param {Object} argv Yargs
 * @return {Array} Array of options required for specified command
 */
const buildExecCmd = argv => {
	const opts = buildComposeFiles( argv );
	opts.push( 'exec', 'wordpress' );
	const cmd = argv._[ 1 ];

	if ( cmd === 'install' ) {
		opts.push( '/var/scripts/install.sh' );
	} else if ( cmd === 'sh' ) {
		opts.push( 'bash' );
	} else if ( cmd === 'db' ) {
		opts.push( 'mysql', '--defaults-group-suffix=docker' );
	} else if ( cmd === 'phpunit' ) {
		opts.push(
			'phpunit',
			'--configuration=/var/www/html/wp-content/plugins/jetpack/phpunit.xml.dist'
		);
	} else if ( cmd === 'wp' ) {
		const wpArgs = argv._.slice( 2 );
		opts.push( 'wp', '--allow-root', '--path=/var/www/html/', ...wpArgs );
	} else if ( cmd === 'tail' ) {
		opts.push( '/var/scripts/tail.sh' );
	} else if ( cmd === 'uninstall' ) {
		opts.push( '/var/scripts/uninstall.sh' );
	} else if ( cmd === 'phpunit-multisite' ) {
		opts.push(
			'phpunit',
			'--configuration=/var/www/html/wp-content/plugins/jetpack/tests/php.multisite.xml'
		);
	} else if ( cmd === 'multisite-convert' ) {
		opts.push( '/var/scripts/multisite-convert.sh' );
	} else if ( cmd === 'update-core-unit-tests' ) {
		opts.push(
			'svn',
			'up',
			'/tmp/wordpress-develop/tests/phpunit/data/',
			'/tmp/wordpress-develop/tests/phpunit/includes'
		);
	} else if ( cmd === 'run-extras' ) {
		opts.push( '/var/scripts/run-extras.sh' );
	}

	return opts;
};

/**
 * Execution handler for `... exec wordpress` commands
 *
 * @param {Object} argv Yargs object
 */
const execDockerCmdHandler = argv => {
	const envOpts = buildEnv( argv );
	const opts = buildExecCmd( argv );

	composeExecutor( argv, opts, envOpts );
};

/**
 * Execution handler for Jurassic Tube commands
 *
 * @param {Object} argv Yargs object
 */
const execJtCmdHandler = argv => {
	const jtConfigFile = `${ dockerFolder }/bin/jt/config.sh`;
	const jtTunnelFile = `${ dockerFolder }/bin/jt/tunnel.sh`;

	if ( ! existsSync( jtConfigFile ) || ! existsSync( jtTunnelFile ) ) {
		console.log(
			'Tunneling scripts are not installed. See the section "Jurassic Tube Tunneling Service" in tools/docker/README.md.'
		);
		process.exit( 1 );
	}
	const jtOpts = argv._.slice( 2 ); // docker jt-* [args..]
	const opts = [];
	const arg = argv._[ 1 ];
	let cmd;
	if ( arg === 'jt-config' ) {
		cmd = jtConfigFile;
	} else if ( arg === 'jt-down' ) {
		cmd = jtTunnelFile;
		opts.push( 'break' );
	} else if ( arg === 'jt-up' ) {
		cmd = jtTunnelFile;
	}

	executor( argv, () => {
		spawnSync( cmd, opts.concat( jtOpts ), {
			env: { ...process.env },
			stdio: 'inherit',
		} );
	} );
};

/**
 * Definition for the Docker commands.
 *
 * @param {Object} yargs - The Yargs dependency.
 *
 * @return {Object} Yargs with the Docker commands defined.
 */
export function dockerDefine( yargs ) {
	yargs.command( {
		command: 'docker <cmd>',
		description: 'Docker stuff',
		builder: yarg => {
			yarg
				// Compose commands
				.command( {
					command: 'up',
					description: 'Start Docker containers',
					builder: yargCmd =>
						defaultOpts( yargCmd ).option( 'detached', {
							alias: 'd',
							describe: 'Launch in detached mode',
							type: 'bool',
						} ),
					handler: argv => defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'stop',
					description: 'Stop the containers',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: argv => defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'down',
					description: 'Down the containers',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: argv => defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'clean',
					description: 'Remove docker volumes, MySql and WordPress data and logs.',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: argv => {
						defaultDockerCmdHandler( argv );
						const project = getProjectName( argv );
						executor( argv, () => {
							spawnSync(
								'rm',
								[
									'-rf',
									`${ dockerFolder }/wordpress/*`,
									`${ dockerFolder }/wordpress/.htaccess`,
									`${ dockerFolder }/wordpress-develop/*`,
									`${ dockerFolder }/logs/${ project }/`,
									`${ dockerFolder }/logs/${ project }_mysql/`,
									`${ dockerFolder }/data/${ project }_mysql/*`,
								],
								{ stdio: 'inherit', env: { ...process.env }, shell: true }
							);
						} );
					},
				} )
				.command( {
					command: 'build-image',
					description: 'Builds local docker image',
					handler: argv => {
						console.log( '!! BUILD IMAGE HANDLER', argv );
						executor( argv, () =>
							spawnSync(
								`docker`,
								[ 'build', '-t', 'automattic/jetpack-wordpress-dev', `${ dockerFolder }` ],
								{
									stdio: 'inherit',
								}
							)
						);
					},
				} )
				// Wordpress exec commands
				.command( {
					command: 'install',
					description: 'Install WP for running container',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'db',
					description: 'Access MySql CLI',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'sh',
					description: 'Access shell on Wordpress container',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'phpunit',
					description: 'Run PHPUNIT tests inside container',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'wp',
					description: 'Execute WP-CLI command',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'tail',
					description: 'Watch WP debug.log',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'uninstall',
					description: 'Uninstall WP installation',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'phpunit-multisite',
					alias: 'phpunit:multisite',
					description: 'Run multisite PHPUNIT tests inside container ',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'multisite-convert',
					description: 'Convert WP into a multisite',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'update-core-unit-tests',
					description: 'Pulls latest Core unit tests files from SVN',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'run-extras',
					description: 'Run run-extras.sh bin script',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				// JT commands
				.command( {
					command: 'jt-up',
					description: 'Start jurassic tube tunnel',
					handler: argv => execJtCmdHandler( argv ),
				} )
				.command( {
					command: 'jt-down',
					description: 'Stop jurassic tube tunnel',
					handler: argv => execJtCmdHandler( argv ),
				} )
				.command( {
					command: 'jt-config',
					description: 'Set jurassic tube config',
					handler: argv => execJtCmdHandler( argv ),
				} );
		},
	} );

	return yargs;
}
