/**
 * External dependencies
 */
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import { dockerFolder, setConfig } from '../helpers/docker-config';

/**
 * Sets default options that are common for most of the commands
 *
 * @param {object} yargs - Yargs
 * @returns {object} Modified Yargs object
 */
const defaultOpts = yargs =>
	yargs
		.option( 'type', {
			alias: 't',
			default: 'dev',
			describe: 'Container type',
		} )
		.option( 'name', {
			alias: 'n',
			describe: 'Project name',
		} )
		.option( 'port', {
			alias: 'p',
			describe: 'WP port',
		} )
		.option( 'ngrok', {
			type: 'bool',
			describe: 'Flag to launch ngrok process',
		} );

/**
 * Gets a project name from the passed arguments. Defaults to 'dev' if not specified.
 *
 * @param {object} argv - Yargs
 * @returns {string} Project name
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
 * @param {object} argv - Yargs
 * @returns {object} key-value pairs of ENV variables
 */
const buildEnv = argv => {
	const envOpts = {};
	if ( argv.type === 'e2e' ) {
		envOpts.PORT_WORDPRESS = argv.port ? argv.port : 8889;
	}

	envOpts.COMPOSE_PROJECT_NAME = 'jetpack_' + getProjectName( argv );
	return envOpts;
};

/**
 * Creates an .env file
 */
const setEnv = () => {
	fs.closeSync( fs.openSync( `${ dockerFolder }/.env`, 'a' ) );
};

/**
 * Checks whether the command should run in foreground
 *
 * @param {object} argv - argv
 * @returns {boolean} whether command is running in foreground
 */
const isInForeground = argv => ! argv.detached || argv.ngrok;

/**
 * Prints some contents before command execution
 *
 * @param {object} argv - argv
 */
const printPreCmdMsg = argv => {
	if ( argv.v ) {
		console.log( argv );
	}
};

/**
 * Prints some contents after command execution
 *
 * @param {object} argv - argv
 */
const printPostCmdMsg = argv => {
	if ( isInForeground( argv ) ) {
		return;
	}
	if ( argv._[ 1 ] === 'up' ) {
		const port = argv.port ? argv.port : '';
		const msg = chalk.green( `Open http://localhost${ port }/ to see your site!` );
		console.log( msg );
	}
};

/**
 * Default executor with error handler
 *
 * @param {object} argv - Yargs
 * @param {Function} fnc - Function to execute
 * @returns {any} resulting value from fnc
 */
const executor = ( argv, fnc ) => {
	try {
		return fnc( argv );
	} catch ( error ) {
		console.error( chalk.bgRed( `Failed to execute the function. Error:` ) );
		console.error( error );
		process.exit( 1 );
	}
};

const shellExecutor = ( argv, cmd, args, opts = {} ) => {
	if ( argv.v ) {
		console.log(
			chalk.green( 'Running command:' ),
			opts.env
				? Object.entries( opts.env )
						.map( a => `${ a[ 0 ] }=${ a[ 1 ] }` )
						.join( ' ' )
				: '',
			cmd,
			args.join( ' ' )
		);
	}
	return spawnSync( cmd, args, {
		stdio: 'inherit',
		...opts,
		env: { ...opts.env, ...process.env },
	} );
};

/**
 * Executor for `docker-compose` commands
 *
 * @param {object} argv - Yargs
 * @param {Array} opts - Array of arguments
 * @param {object} envOpts - key-value pairs of the ENV variables to set
 */
const composeExecutor = ( argv, opts, envOpts ) => {
	executor( argv, () => shellExecutor( argv, 'docker-compose', opts, { env: envOpts } ) );
};

/**
 * Builds an array of compose files matching configuration options.
 *
 * @returns {Array} Array of shell arguments
 */
const buildComposeFiles = () => {
	const defaultCompose = [ `-f${ dockerFolder }/docker-compose.yml` ];
	const extendFiles = [
		`-f${ dockerFolder }/compose-mappings.built.yml`,
		`-f${ dockerFolder }/compose-extras.built.yml`,
	];
	return defaultCompose.concat( extendFiles );
};

/**
 * Builds an array of opts that are required to run arbitrary compose command.
 *
 * @param {object} argv - Yargs
 * @returns {Array} Array of options required for specified command
 */
const buildDefaultCmd = argv => {
	const opts = buildComposeFiles();
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
 * Creates a tunnel using globally installed ngrok and it's configuration file
 *
 * @param {object} argv - argv
 */
const launchNgrok = argv => {
	const docsMessage = 'Please refer to Docker docs for details: tools/docker/README.md';
	const existCheck = executor( argv, () => shellExecutor( argv, 'command', [ '-v', 'ngrok' ] ) );
	if ( existCheck.status !== 0 ) {
		console.error( chalk.red( `'ngrok' is not installed globally. ${ docsMessage }` ) );
		process.exit( 1 );
	}

	const ngrokArgs = [ 'start', 'jetpack' ];
	if ( argv.ngrok === 'sftp' ) {
		ngrokArgs.push( 'jetpack-sftp' );
	}
	const startCheck = executor( argv, () => shellExecutor( argv, 'ngrok', ngrokArgs ) );
	if ( startCheck.status !== 0 ) {
		console.error(
			chalk.red(
				`Something is wrong with ngrok configuration. Examine ngrok errors above. ${ docsMessage }`
			)
		);
	}
};

/**
 * Performs the given action again and again until it does not throw an error.
 *
 * @param {Function} action - The action to perform.
 * @param {object} options - options object
 * @param {number} options.times - How many times to try before giving up.
 * @param {number} [options.delay=5000] - How long, in milliseconds, to wait between each try.
 * @returns {any} return value of action function
 */
async function retry( action, { times, delay = 5000 } ) {
	const sleep = ms => new Promise( resolve => setTimeout( resolve, ms ) );

	let tries = 0;
	while ( tries < times ) {
		try {
			return await action();
		} catch ( error ) {
			if ( ++tries >= times ) {
				throw error;
			}
			console.log( `Still waiting. Try: ${ tries }` );
			await sleep( delay );
		}
	}
}

/**
 * Default handler for the monorepo Docker commands.
 *
 * @param {object} argv - Arguments passed.
 */
const defaultDockerCmdHandler = async argv => {
	printPreCmdMsg( argv );

	executor( argv, setEnv );
	executor( argv, setConfig );

	const opts = buildDefaultCmd( argv );
	const envOpts = buildEnv( argv );
	composeExecutor( argv, opts, envOpts );
	if ( argv.type === 'dev' && argv.ngrok ) {
		executor( argv, launchNgrok );
	}

	// TODO: Make it work with all container types, not only e2e
	if ( argv.type === 'e2e' && argv._[ 1 ] === 'up' && argv.detached ) {
		console.log( 'Waiting for WordPress to be ready...' );
		const getContent = () =>
			new Promise( ( resolve, reject ) => {
				const https = require( 'http' );
				const request = https.get( `http://localhost:${ envOpts.PORT_WORDPRESS }/`, response => {
					// handle http errors

					if ( response.statusCode < 200 || response.statusCode > 399 ) {
						reject( new Error( 'Failed to load page, status code: ' + response.statusCode ) );
					}
					// temporary data holder
					const body = [];
					// on every content chunk, push it to the data array
					response.on( 'data', chunk => body.push( chunk ) );
					// we are done, resolve promise with those joined chunks
					response.on( 'end', () => resolve( body.join( '' ) ) );
				} );
				// handle connection errors of the request
				request.on( 'error', err => reject( err ) );
			} );

		await retry( getContent, { times: 24 } ); // 24 * 5000 = 120 sec
	}
	printPostCmdMsg( argv );
};

/**
 * Builds an array of opts that are required to execute specified command in wordpress container
 *
 * @param {object} argv - Yargs
 * @returns {Array} Array of options required for specified command
 */
const buildExecCmd = argv => {
	const opts = [ 'exec', 'wordpress' ];
	const cmd = argv._[ 1 ];

	if ( cmd === 'exec' ) {
		opts.push( ...argv._.slice( 2 ) );
	} else if ( cmd === 'exec-silent' ) {
		opts.splice( 1, 0, '-T' );
		opts.push( ...argv._.slice( 2 ) );
	} else if ( cmd === 'install' ) {
		// Adding -T to resolve an issue when running this command within node context (e2e)
		opts.splice( 1, 0, '-T' );
		opts.push( '/var/scripts/install.sh' );
	} else if ( cmd === 'sh' ) {
		opts.push( 'bash' );
	} else if ( cmd === 'db' ) {
		opts.push( 'mysql', '--defaults-group-suffix=docker' );
	} else if ( cmd === 'phpunit' ) {
		const unitArgs = argv._.slice( 2 );

		opts.push(
			'phpunit',
			'--configuration=/var/www/html/wp-content/plugins/jetpack/phpunit.xml.dist',
			...unitArgs
		);
	} else if ( cmd === 'phpunit-multisite' ) {
		const unitArgs = argv._.slice( 2 );
		opts.push(
			'phpunit',
			'--configuration=/var/www/html/wp-content/plugins/jetpack/tests/php.multisite.xml',
			...unitArgs
		);
	} else if ( cmd === 'wp' ) {
		const wpArgs = argv._.slice( 2 );
		// Ugly solution to allow interactive shell work in dev context
		// TODO: Look for prettier alternatives.
		if ( argv.type === 'e2e' ) {
			opts.splice( 1, 0, '-T' );
		}
		opts.push( 'wp', '--allow-root', '--path=/var/www/html/', ...wpArgs );
	} else if ( cmd === 'tail' ) {
		opts.push( '/var/scripts/tail.sh' );
	} else if ( cmd === 'uninstall' ) {
		opts.push( '/var/scripts/uninstall.sh' );
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

	return buildComposeFiles().concat( opts );
};

/**
 * Execution handler for `... exec wordpress` commands
 *
 * @param {object} argv - Yargs object
 */
const execDockerCmdHandler = argv => {
	printPreCmdMsg( argv );

	const envOpts = buildEnv( argv );
	const opts = buildExecCmd( argv );

	composeExecutor( argv, opts, envOpts );
};

/**
 * Execution handler for Jurassic Tube commands
 *
 * @param {object} argv - Yargs object
 */
const execJtCmdHandler = argv => {
	const jtConfigFile = `${ dockerFolder }/bin/jt/config.sh`;
	const jtTunnelFile = `${ dockerFolder }/bin/jt/tunnel.sh`;

	if ( ! fs.existsSync( jtConfigFile ) || ! fs.existsSync( jtTunnelFile ) ) {
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

	executor( argv, () => shellExecutor( argv, cmd, opts.concat( jtOpts ) ) );
};

/**
 * Definition for the Docker commands.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the Docker commands defined.
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
					handler: async argv => await defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'stop',
					description: 'Stop the containers',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: async argv => await defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'down',
					description: 'Down the containers',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: async argv => await defaultDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'clean',
					description: 'Remove docker volumes, MySql and WordPress data and logs.',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: async argv => {
						await defaultDockerCmdHandler( argv );
						const project = getProjectName( argv );
						executor( argv, () =>
							shellExecutor(
								argv,
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
								{ shell: true }
							)
						);
					},
				} )
				.command( {
					command: 'build-image',
					description: 'Builds local docker image',
					handler: argv => {
						executor( argv, () =>
							shellExecutor( argv, 'docker', [
								'build',
								'-t',
								'automattic/jetpack-wordpress-dev',
								dockerFolder,
							] )
						);
					},
				} )

				// Wordpress exec commands
				.command( {
					command: 'exec',
					description: 'Execute arbitrary shell command inside docker container',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'exec-silent',
					description:
						'Execute arbitrary shell command inside docker container with disabled pseudo-tty allocation. Used in E2E context',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
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
