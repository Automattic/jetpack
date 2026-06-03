import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';
import * as envfile from 'envfile';
import { dockerFolder, setConfig } from '../helpers/docker-config.js';

/**
 * How to run Docker compose.
 */
let dockerComposeCmd = null;

/**
 * Normalize and validate a short project name to match Docker Compose rules.
 *
 * Compose requires project names to consist of lowercase alphanumeric characters, hyphens,
 * and underscores, starting with a letter or digit. Uppercase input is auto-lowercased so
 * `--name Feature` "just works"; anything else throws a clear error early, before compose.
 *
 * @param {string} name - User-supplied short name (e.g. from --name or --clone-from).
 * @return {string} Normalized (lowercased) short name.
 */
export const normalizeProjectShortName = name => {
	const original = String( name );
	const normalized = original.toLowerCase();
	if ( ! /^[a-z0-9][a-z0-9_-]*$/.test( normalized ) ) {
		throw new Error(
			`Invalid project name '${ original }'. Use only lowercase letters, digits, '-' and '_' (must start with a letter or digit).`
		);
	}
	return normalized;
};

/**
 * Build a yargs `coerce` handler that normalizes a project short-name option and prints
 * a friendly note when it had to lowercase the input.
 *
 * @param {string} flag - The user-facing flag label (e.g. '--name').
 * @return {Function} yargs coerce function.
 */
const coerceProjectShortName = flag => value => {
	if ( value === undefined || value === null || value === '' ) {
		return value;
	}
	const normalized = normalizeProjectShortName( value );
	if ( normalized !== String( value ) ) {
		console.warn(
			chalk.yellow(
				`Note: ${ flag } '${ value }' was normalized to '${ normalized }' (compose project names must be lowercase).`
			)
		);
	}
	return normalized;
};

/**
 * Sets default options that are common for most of the commands
 *
 * @param {object} yargs - Yargs
 * @return {object} Modified Yargs object
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
			coerce: coerceProjectShortName( '--name' ),
		} )
		.option( 'port', {
			alias: 'p',
			describe: 'WP port',
		} )
		.option( 'port-phpmy', {
			describe: 'phpMyAdmin port',
		} )
		.option( 'port-inbox', {
			describe: 'Mailpit web UI port',
		} )
		.option( 'port-smtp', {
			describe: 'Mailpit SMTP port',
		} )
		.option( 'port-sftp', {
			describe: 'SFTP port',
		} )
		.option( 'clone-from', {
			type: 'string',
			describe:
				'Clone the database from an existing running instance (short name, e.g. --clone-from dev). When omitted but --name is set, the default jetpack_dev instance is used automatically if running.',
			coerce: coerceProjectShortName( '--clone-from' ),
		} )
		.option( 'clone', {
			type: 'boolean',
			default: true,
			describe:
				'Auto-clone the database from jetpack_dev when spinning up a parallel instance with --name. Use --no-clone to opt out and get a fresh install instead.',
		} )
		.option( 'update-env', {
			type: 'boolean',
			default: false,
			describe:
				"When `up` flag values conflict with the worktree's tools/docker/.env, rewrite the conflicting keys in .env to match the flags. Without this, the flag wins for the current run and a warning is printed; .env is left untouched.",
		} )
		.option( 'ngrok', {
			type: 'boolean',
			describe: 'Flag to launch ngrok process',
		} );

/**
 * Gets a project name from the passed arguments. Defaults to 'dev' if not specified.
 *
 * @param {object} argv - Yargs
 * @return {string} Project name
 */
export const getProjectName = argv => {
	let project = argv.type === 'e2e' ? 'e2e' : 'dev';
	if ( argv.name ) {
		project = argv.name;
	}

	return 'jetpack_' + project;
};

/**
 * Builds a map of ENV variables for specified configuration
 *
 * @param {object} argv - Yargs
 * @return {object} key-value pairs of ENV variables
 */
export const buildEnv = argv => {
	const envOpts = {};
	if ( argv.port ) {
		envOpts.PORT_WORDPRESS = argv.port;
	} else if ( argv.type === 'e2e' ) {
		envOpts.PORT_WORDPRESS = 8889;
	}

	if ( argv.portPhpmy ) {
		envOpts.PORT_PHPMY = argv.portPhpmy;
	}
	if ( argv.portInbox ) {
		envOpts.PORT_INBOX = argv.portInbox;
	}
	if ( argv.portSmtp ) {
		envOpts.PORT_SMTP = argv.portSmtp;
	}
	if ( argv.portSftp ) {
		envOpts.PORT_SFTP = argv.portSftp;
	}

	envOpts.COMPOSE_PROJECT_NAME = getProjectName( argv );

	// Add versions from versions.sh
	const versions = envfile.parse(
		fs.readFileSync( `${ dockerFolder }/../../.github/versions.sh`, 'utf8' )
	);
	Object.assign( envOpts, versions );

	return envOpts;
};

/**
 * Creates an .env file
 */
const setEnv = () => {
	fs.closeSync( fs.openSync( `${ dockerFolder }/.env`, 'a' ) );
};

/**
 * Keys the CLI manages in tools/docker/.env when spinning up a parallel instance.
 * The CLI reads them as a base layer (flags still override) and may append the missing
 * ones on `up --name <slug>`. Lines outside this set are never modified.
 */
export const PARALLEL_ENV_KEYS = [
	'COMPOSE_PROJECT_NAME',
	'PORT_WORDPRESS',
	'PORT_PHPMY',
	'PORT_INBOX',
	'PORT_SMTP',
	'PORT_SFTP',
];

const parallelEnvPath = () => `${ dockerFolder }/.env`;

/**
 * Read and parse the worktree's tools/docker/.env file.
 *
 * @param {string} [filePath] - Override path (mostly for tests).
 * @return {object} Parsed key→value map. Empty object when the file is missing.
 */
export const readEnvFile = ( filePath = parallelEnvPath() ) => {
	if ( ! fs.existsSync( filePath ) ) {
		return {};
	}
	return envfile.parse( fs.readFileSync( filePath, 'utf8' ) );
};

/**
 * Snapshot the parallel-instance argv values that came from CLI flags, so a later
 * conflict check can distinguish flag-given values from .env-fill-in values.
 *
 * @param {object} argv - Yargs argv (post coerce, pre-augment).
 * @return {object} Plain snapshot of parallel-relevant flag values.
 */
export const snapshotFlagArgv = argv => ( {
	name: argv.name,
	port: argv.port,
	portPhpmy: argv.portPhpmy,
	portInbox: argv.portInbox,
	portSmtp: argv.portSmtp,
	portSftp: argv.portSftp,
} );

/**
 * Fill in argv defaults from the parsed .env file, but only for fields the user
 * did not pass via flags. This lets a worktree configured by a previous
 * `up --name foo --port 8080` "just work" with bare `jp docker up` afterwards.
 *
 * COMPOSE_PROJECT_NAME → argv.name only when it parses as `jetpack_<x>` and
 * <x> is neither 'dev' nor 'e2e' — guards against the main checkout's .env
 * silently redirecting the dev container.
 *
 * @param {object} argv    - Yargs argv (mutated in place).
 * @param {object} fileEnv - Parsed .env contents (use readEnvFile()).
 */
export const augmentArgvFromEnvFile = ( argv, fileEnv ) => {
	if ( ! argv.name && typeof fileEnv.COMPOSE_PROJECT_NAME === 'string' ) {
		const match = fileEnv.COMPOSE_PROJECT_NAME.match( /^jetpack_(.+)$/ );
		if ( match && match[ 1 ] !== 'dev' && match[ 1 ] !== 'e2e' ) {
			argv.name = match[ 1 ];
		}
	}
	if ( argv.port === undefined && fileEnv.PORT_WORDPRESS ) {
		argv.port = Number( fileEnv.PORT_WORDPRESS );
	}
	if ( argv.portPhpmy === undefined && fileEnv.PORT_PHPMY ) {
		argv.portPhpmy = Number( fileEnv.PORT_PHPMY );
	}
	if ( argv.portInbox === undefined && fileEnv.PORT_INBOX ) {
		argv.portInbox = Number( fileEnv.PORT_INBOX );
	}
	if ( argv.portSmtp === undefined && fileEnv.PORT_SMTP ) {
		argv.portSmtp = Number( fileEnv.PORT_SMTP );
	}
	if ( argv.portSftp === undefined && fileEnv.PORT_SFTP ) {
		argv.portSftp = Number( fileEnv.PORT_SFTP );
	}
};

/**
 * Identify keys where the user passed a flag value that contradicts an existing
 * .env entry. The flag wins for the current invocation; .env is left untouched
 * unless --update-env was passed.
 *
 * @param {object} flagArgv - Snapshot of pre-augment flag values (from snapshotFlagArgv).
 * @param {object} fileEnv  - Parsed .env contents.
 * @return {Array<{key: string, fileValue: string, flagValue: string}>} Conflicting keys.
 */
export const detectEnvConflicts = ( flagArgv, fileEnv ) => {
	const conflicts = [];
	const check = ( key, flagValue ) => {
		if ( flagValue === undefined || flagValue === null || flagValue === '' ) return;
		const fileValue = fileEnv[ key ];
		if ( fileValue === undefined ) return;
		if ( String( fileValue ) !== String( flagValue ) ) {
			conflicts.push( {
				key,
				fileValue: String( fileValue ),
				flagValue: String( flagValue ),
			} );
		}
	};
	if ( flagArgv.name !== undefined ) {
		check( 'COMPOSE_PROJECT_NAME', `jetpack_${ flagArgv.name }` );
	}
	check( 'PORT_WORDPRESS', flagArgv.port );
	check( 'PORT_PHPMY', flagArgv.portPhpmy );
	check( 'PORT_INBOX', flagArgv.portInbox );
	check( 'PORT_SMTP', flagArgv.portSmtp );
	check( 'PORT_SFTP', flagArgv.portSftp );
	return conflicts;
};

/**
 * Append the parallel-instance keys to .env when they are not already there.
 * Strategy B: never modify lines that already exist; only append the keys we own
 * that are missing. Idempotent — safe to run on every `up`.
 *
 * @param {object} envOpts    - Built env (from buildEnv) — provides the values to write.
 * @param {string} [filePath] - Target .env path (mostly for tests).
 * @return {string[]} Keys that were written. Empty when no-op.
 */
export const persistParallelEnv = ( envOpts, filePath = parallelEnvPath() ) => {
	const existing = fs.existsSync( filePath )
		? envfile.parse( fs.readFileSync( filePath, 'utf8' ) )
		: {};
	const toWrite = [];
	for ( const key of PARALLEL_ENV_KEYS ) {
		if ( envOpts[ key ] === undefined || envOpts[ key ] === '' ) continue;
		if ( existing[ key ] !== undefined ) continue;
		toWrite.push( key );
	}
	if ( toWrite.length === 0 ) return [];
	const header =
		"\n# Parallel-instance config (managed by `jp docker up --name`). Edit by hand at any\n# time; the CLI only appends keys that don't already exist.\n";
	const block = toWrite.map( key => `${ key }=${ envOpts[ key ] }` ).join( '\n' ) + '\n';
	fs.appendFileSync( filePath, header + block );
	return toWrite;
};

/**
 * Replace specific keys in .env in place, preserving every other line verbatim.
 * Used by --update-env to reconcile flags with the persisted file.
 *
 * @param {string}                                  filePath  - Target .env path.
 * @param {Array<{key: string, flagValue: string}>} conflicts - Conflicts from detectEnvConflicts.
 * @return {string[]} Keys that were updated.
 */
export const applyUpdateEnv = ( filePath, conflicts ) => {
	if ( conflicts.length === 0 ) return [];
	const text = fs.existsSync( filePath ) ? fs.readFileSync( filePath, 'utf8' ) : '';
	const lines = text.split( /\r?\n/ );
	const updated = [];
	for ( const { key, flagValue } of conflicts ) {
		let replaced = false;
		for ( let i = 0; i < lines.length; i++ ) {
			const m = lines[ i ].match( /^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=/ );
			if ( m && m[ 2 ] === key ) {
				lines[ i ] = `${ m[ 1 ] }${ key }=${ flagValue }`;
				replaced = true;
				break;
			}
		}
		if ( ! replaced ) {
			lines.push( `${ key }=${ flagValue }` );
		}
		updated.push( key );
	}
	fs.writeFileSync( filePath, lines.join( '\n' ) );
	return updated;
};

/**
 * Whether the hybrid tools/docker/.env parallel-instance machinery (reading keys as a base
 * layer, conflict warnings, append-on-`up --name` persistence) applies to this invocation.
 *
 * Scoped to `up` on `type === 'dev'`. The e2e flow runs `docker --type e2e --name t1 up`,
 * which sets argv.name but manages its own fixed ports and project name — it must neither
 * read parallel keys from nor write them to the shared .env. Keeping the gate here (rather
 * than only inline at the call sites) mirrors resolveDevCloneSource being "correct on its
 * own terms" and makes the e2e exclusion unit-testable.
 *
 * @param {object} argv - Yargs argv.
 * @return {boolean} true when parallel-env reads/writes should run.
 */
export const shouldManageParallelEnv = argv => argv.type === 'dev' && argv._[ 1 ] === 'up';

/**
 * Decides which source instance to clone the DB from when bringing up a dev container, if any.
 *
 * Purely argv-driven; whether the chosen source is actually running is checked by the caller.
 * Always returns null for non-dev container types — the e2e framework manages its own DB.
 *
 * @param {object} argv - Yargs
 * @return {{source: string, explicit: boolean} | null} Source compose project name and whether the user asked for it by name, or null to skip cloning.
 */
export const resolveDevCloneSource = argv => {
	if ( argv.type !== 'dev' ) {
		return null;
	}
	if ( argv.cloneFrom ) {
		return { source: 'jetpack_' + argv.cloneFrom, explicit: true };
	}
	if ( argv.clone === false ) {
		return null;
	}
	// Auto-clone only makes sense when the user is spinning up a parallel instance.
	if ( ! argv.name ) {
		return null;
	}
	const source = 'jetpack_dev';
	if ( getProjectName( argv ) === source ) {
		return null;
	}
	return { source, explicit: false };
};

/**
 * Check whether a given compose project has at least one running container.
 *
 * @param {string} project - Compose project name (e.g. 'jetpack_dev').
 * @return {boolean} true when any container for the project is currently running.
 */
const isProjectRunning = project => {
	const res = spawnSync(
		'docker',
		[ 'ps', '-q', '--filter', `label=com.docker.compose.project=${ project }` ],
		{ encoding: 'utf8' }
	);
	return res.status === 0 && res.stdout.trim().length > 0;
};

/**
 * Pipe `wp db export` from a source container into `wp db import` on a target container,
 * surfacing failures from either side independently.
 *
 * Replaces an earlier `bash -c '… | …'` invocation that masked source-side failures: with
 * default bash, the pipe's exit status is the importer's only, so a broken `wp db export`
 * could go unnoticed while the importer happily consumed partial/empty bytes and exited 0.
 * Going node-native gives each side its own exit code.
 *
 * @param {string} sourceContainer - Source WP container name (e.g. 'jetpack_dev-wordpress-1').
 * @param {string} targetContainer - Target WP container name (e.g. 'jetpack_foo-wordpress-1').
 * @param {string} wpPath          - WP install path inside both containers (e.g. '/var/www/html').
 * @return {Promise<void>} Resolves only when both processes exit 0; rejects with attribution otherwise.
 */
export const pipeDbDump = async ( sourceContainer, targetContainer, wpPath ) => {
	const source = spawn(
		'docker',
		[ 'exec', sourceContainer, 'wp', 'db', 'export', '-', `--path=${ wpPath }` ],
		{ stdio: [ 'ignore', 'pipe', 'inherit' ] }
	);
	const target = spawn(
		'docker',
		[ 'exec', '-i', targetContainer, 'wp', 'db', 'import', '-', `--path=${ wpPath }` ],
		{ stdio: [ 'pipe', 'inherit', 'inherit' ] }
	);
	source.stdout.pipe( target.stdin );

	const exitOf = proc =>
		new Promise( ( resolve, reject ) => {
			proc.on( 'exit', code => resolve( code ) );
			proc.on( 'error', err => reject( err ) );
		} );

	const [ sourceCode, targetCode ] = await Promise.all( [ exitOf( source ), exitOf( target ) ] );

	if ( sourceCode !== 0 && targetCode !== 0 ) {
		throw new Error(
			`db dump pipeline failed: source 'wp db export' exit ${ sourceCode }; target 'wp db import' exit ${ targetCode }.`
		);
	}
	if ( sourceCode !== 0 ) {
		throw new Error(
			`source 'wp db export' failed (exit ${ sourceCode }). Target import is unreliable; aborting clone.`
		);
	}
	if ( targetCode !== 0 ) {
		throw new Error( `target 'wp db import' failed (exit ${ targetCode }).` );
	}
};

/**
 * Clone the database of a running source instance into a freshly-started target instance.
 *
 * Waits for the target's WordPress container to be ready, then skips if the target is already
 * installed, resets the target DB, pipes `wp db export` from source → `wp db import` into
 * target, and runs `wp search-replace` to rewrite the source siteurl to the target URL.
 *
 * @param {object} argv      - Yargs
 * @param {string} source    - Source compose project name (e.g. 'jetpack_dev').
 * @param {string} target    - Target compose project name (e.g. 'jetpack_feature').
 * @param {object} targetEnv - ENV map for the target (used to compute target port).
 */
const cloneDatabase = async ( argv, source, target, targetEnv ) => {
	const sourceWp = `${ source }-wordpress-1`;
	const targetWp = `${ target }-wordpress-1`;
	const wpPath = '/var/www/html';

	console.log( chalk.cyan( `Cloning database: ${ source } → ${ target }` ) );

	// Wait for the target's WP container + DB to be reachable via wp-cli.
	try {
		await retry(
			async () => {
				const res = spawnSync(
					'docker',
					[ 'exec', targetWp, 'wp', 'db', 'check', `--path=${ wpPath }` ],
					{
						stdio: 'ignore',
					}
				);
				if ( res.status !== 0 ) {
					throw new Error( 'target not ready' );
				}
			},
			{ times: 24, delay: 5000 }
		);
	} catch {
		console.error(
			chalk.red( `Target ${ target } did not become ready in time. Aborting clone.` )
		);
		process.exit( 1 );
	}

	// If the target is already installed (e.g. the user re-ran `up` on a working instance), do nothing.
	const installedCheck = spawnSync(
		'docker',
		[ 'exec', targetWp, 'wp', 'core', 'is-installed', `--path=${ wpPath }` ],
		{ stdio: 'ignore' }
	);
	if ( installedCheck.status === 0 ) {
		console.log(
			chalk.yellow( `Target ${ target } already has an installed WordPress — skipping clone.` )
		);
		return;
	}

	// Read the source siteurl so search-replace can rewrite it afterwards.
	const siteurlRes = spawnSync(
		'docker',
		[ 'exec', sourceWp, 'wp', 'option', 'get', 'siteurl', `--path=${ wpPath }` ],
		{ encoding: 'utf8' }
	);
	if ( siteurlRes.status !== 0 ) {
		console.error(
			chalk.red(
				`Could not read siteurl from source ${ source }. Is it installed? (try \`jetpack docker install\` there first)`
			)
		);
		process.exit( 1 );
	}
	const sourceSiteUrl = siteurlRes.stdout.trim();

	const targetPort = String( targetEnv.PORT_WORDPRESS || 80 );
	const targetSiteUrl =
		targetPort === '80' ? 'http://localhost' : `http://localhost:${ targetPort }`;

	// Reset the target DB so import doesn't collide with the minimal tables compose may have created.
	checkProcessResult(
		spawnSync( 'docker', [ 'exec', targetWp, 'wp', 'db', 'reset', '--yes', `--path=${ wpPath }` ], {
			stdio: 'inherit',
		} )
	);

	console.log( chalk.cyan( 'Dumping source DB and importing into target…' ) );
	try {
		await pipeDbDump( sourceWp, targetWp, wpPath );
	} catch ( err ) {
		console.error( chalk.red( err.message ) );
		process.exit( 1 );
	}

	if ( sourceSiteUrl !== targetSiteUrl ) {
		console.log( chalk.cyan( `Rewriting URLs: ${ sourceSiteUrl } → ${ targetSiteUrl }` ) );
		const sr = spawnSync(
			'docker',
			[
				'exec',
				targetWp,
				'wp',
				'search-replace',
				sourceSiteUrl,
				targetSiteUrl,
				'--all-tables',
				'--skip-columns=guid',
				`--path=${ wpPath }`,
			],
			{ stdio: 'inherit' }
		);
		checkProcessResult( sr );
	}

	console.log( chalk.green( `Clone complete. Target site ready at ${ targetSiteUrl }/` ) );
};

/**
 * Checks whether the command should run in foreground
 *
 * @param {object} argv - argv
 * @return {boolean} whether command is running in foreground
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
		const port = argv.port ? `:${ argv.port }` : '';
		const msg = chalk.green( `Open http://localhost${ port }/ to see your site!` );
		console.log( msg );
	}
};

/**
 * Default executor with error handler
 *
 * @param {object}   argv - Yargs
 * @param {Function} fnc  - Function to execute
 * @return {any} resulting value from fnc
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
 * Check command status, exit if it failed.
 *
 * @param {object} res - child_process object.
 */
const checkProcessResult = res => {
	if ( res.status !== 0 ) {
		console.error( chalk.red( `Command exited with status ${ res.status }` ) );
		process.exit( res.status );
	}
};

/**
 * Executor for `docker compose` commands
 *
 * @param {object} argv    - Yargs
 * @param {Array}  opts    - Array of arguments
 * @param {object} envOpts - key-value pairs of the ENV variables to set
 */
const composeExecutor = ( argv, opts, envOpts ) => {
	if ( dockerComposeCmd === null ) {
		if ( argv.v ) {
			console.log( chalk.green( 'Checking how to run Docker compose' ) );
		}
		if ( spawnSync( 'docker', [ 'compose', 'version' ], { stdio: 'ignore' } ).status === 0 ) {
			dockerComposeCmd = [ 'docker', 'compose' ];
		} else if ( spawnSync( 'docker-compose', [ '--version' ], { stdio: 'ignore' } ).status === 0 ) {
			dockerComposeCmd = [ 'docker-compose' ];
		} else {
			console.error( chalk.red( `Neither 'docker compose' nor 'docker-compose' is available.` ) );
			process.exit( 1 );
		}
	}
	const [ cmd, ...args ] = dockerComposeCmd.concat( opts );
	const res = executor( argv, () => shellExecutor( argv, cmd, args, { env: envOpts } ) );
	checkProcessResult( res );
};

/**
 * Builds an array of compose files matching configuration options.
 *
 * @return {Array} Array of shell arguments
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
 * @return {Array} Array of options required for specified command
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
 * Builds the command options for running PHPUnit tests inside a Docker container.
 *
 * @param {object}        argv                       - Command line args.
 * @param {Array}         opts                       - Options for the Docker command.
 * @param {object}        unitTestArgs               - Unit test args.
 * @param {string}        unitTestArgs.plugin        - The name of the plugin we're running tests against.
 * @param {string}        [unitTestArgs.configFile]  - The PHPUnit configuration file to use. Defaults to 'phpunit.#.xml.dist'.
 * @param {Array<string>} [unitTestArgs.envVars]     - Environment variables to set in the Docker container.
 * @param {string}        [unitTestArgs.prependFile] - PHP file to auto-prepend (sets -d auto_prepend_file). Ignored when --php is used.
 * @return {Array} Modified opts array.
 */
const buildPhpUnitTestCmd = ( argv, opts, unitTestArgs ) => {
	const passthruArgs = argv._.slice( 2 );
	const configFile = unitTestArgs.configFile ?? 'phpunit.#.xml.dist';

	opts.splice( 1, 0, '-w', '/var/www/html/wp-content/plugins/' + unitTestArgs.plugin ); // Need to add this option to `exec` before the container name.
	if ( unitTestArgs.envVars ) {
		for ( let i = 0; i < unitTestArgs.envVars.length; i++ ) {
			opts.splice( 3, 0, '-e', unitTestArgs.envVars[ i ] );
		}
	}

	let phpunitCmd;
	if ( argv.php ) {
		phpunitCmd = [ '/var/scripts/phpunit-version-wrapper.sh', argv.php ];
	} else if ( unitTestArgs.prependFile ) {
		phpunitCmd = [
			'php',
			'-d',
			`auto_prepend_file=${ unitTestArgs.prependFile }`,
			'vendor/bin/phpunit-select-config',
		];
	} else {
		phpunitCmd = [ 'vendor/bin/phpunit-select-config' ];
	}

	opts.push(
		...phpunitCmd,
		'/var/www/html/wp-content/plugins/' + unitTestArgs.plugin + '/' + configFile,
		...passthruArgs
	);
	return opts;
};

/**
 * Performs the given action again and again until it does not throw an error.
 *
 * @param {Function} action               - The action to perform.
 * @param {object}   options              - options object
 * @param {number}   options.times        - How many times to try before giving up.
 * @param {number}   [options.delay=5000] - How long, in milliseconds, to wait between each try.
 * @return {any} return value of action function
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

	// Hybrid .env handling for `up`: read .env as a base layer (flags still win),
	// surface conflicts as warnings (or rewrite when --update-env is set), and persist
	// parallel-instance keys after a successful `up --name`. See tools/docker/README.md
	// § "Parallel development environments" for the full precedence + semantics.
	// Scoped via shouldManageParallelEnv (`up` + `type === 'dev'`): the e2e flow runs with a
	// fixed `--name t1` and manages its own ports, so it must neither read parallel keys from
	// nor write them to the shared tools/docker/.env.
	if ( shouldManageParallelEnv( argv ) ) {
		const flagSnapshot = snapshotFlagArgv( argv );
		const fileEnv = readEnvFile();
		augmentArgvFromEnvFile( argv, fileEnv );
		const conflicts = detectEnvConflicts( flagSnapshot, fileEnv );
		if ( conflicts.length ) {
			if ( argv.updateEnv ) {
				const updated = applyUpdateEnv( parallelEnvPath(), conflicts );
				console.log(
					chalk.cyan( `Updated tools/docker/.env keys to match flags: ${ updated.join( ', ' ) }.` )
				);
			} else {
				for ( const c of conflicts ) {
					console.warn(
						chalk.yellow(
							`⚠ ${ c.key }: flag value '${ c.flagValue }' differs from .env value '${ c.fileValue }'. Using flag for this run; pass --update-env to persist, or drop the flag to use .env.`
						)
					);
				}
			}
		}
	}

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
		const getContent = async () => {
			const https = await import( 'http' );
			return new Promise( ( resolve, reject ) => {
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
		};

		await retry( getContent, { times: 24 } ); // 24 * 5000 = 120 sec
	}

	// Auto-clone DB from a running source instance when spinning up a parallel one.
	// Gate on the target actually being up rather than on `--detached`: in foreground
	// mode `composeExecutor` blocks until the user exits compose, at which point the
	// target is stopped and there's nothing to clone into. Skipping silently in that
	// case is friendlier than hard-requiring `-d`. The `type === 'dev'` gate lives
	// inside resolveDevCloneSource so the function is correct on its own terms.
	if ( argv._[ 1 ] === 'up' ) {
		const cloneReq = resolveDevCloneSource( argv );
		if ( cloneReq ) {
			const target = getProjectName( argv );
			if ( ! isProjectRunning( target ) ) {
				// Target never came up, or compose was foregrounded and already exited.
			} else if ( ! isProjectRunning( cloneReq.source ) ) {
				if ( cloneReq.explicit ) {
					console.error(
						chalk.red(
							`--clone-from source '${ cloneReq.source }' is not running. Start it first, or omit --clone-from.`
						)
					);
					process.exit( 1 );
				}
				// Auto-clone: silent skip — user gets the normal fresh-install flow.
			} else {
				await cloneDatabase( argv, cloneReq.source, target, envOpts );
			}
		}
	}

	// Persist parallel-instance config to .env on `up --name`. Idempotent: only appends
	// keys that aren't already in the file (Strategy B). Skipped for the primary
	// `jetpack_dev` flow (no --name) so the main checkout's .env is never written to.
	// Also skipped for non-dev types: the e2e flow always passes `--name t1`, but it
	// must not write COMPOSE_PROJECT_NAME/PORT_* into the shared tools/docker/.env.
	if ( shouldManageParallelEnv( argv ) && argv.name ) {
		const written = persistParallelEnv( envOpts );
		if ( written.length ) {
			console.log(
				chalk.cyan(
					`Persisted to tools/docker/.env: ${ written.join(
						', '
					) }. Subsequent \`jp docker up\` from this worktree will use these values.`
				)
			);
		}
	}

	printPostCmdMsg( argv );
};

/**
 * Builds an array of opts that are required to execute specified command in wordpress container
 *
 * @param {object} argv - Yargs
 * @return {Array} Array of options required for specified command
 */
const buildExecCmd = argv => {
	let opts = [ 'exec', 'wordpress' ];
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
		const unitTestArgs = {};
		switch ( argv.target ) {
			case 'jetpack':
				unitTestArgs.plugin = 'jetpack';
				break;
			case 'jp-multisite':
				unitTestArgs.plugin = 'jetpack';
				unitTestArgs.configFile = 'tests/php.multisite.#.xml';
				break;
			case 'jp-wpcomsh':
				unitTestArgs.plugin = 'jetpack';
				unitTestArgs.envVars = [ 'JETPACK_TEST_WPCOMSH=1' ];
				break;
			case 'wpcomsh':
				unitTestArgs.plugin = 'wpcomsh';
				unitTestArgs.envVars = [
					'WP_TESTS_DIR=/tmp/wordpress-develop/tests/phpunit',
					'WP_CORE_DIR=/var/www/html',
					'WP_CONTENT_DIR=/var/www/html/wp-content',
				];
				break;
		}
		opts = buildPhpUnitTestCmd( argv, opts, unitTestArgs );
	} else if (
		cmd === 'phpunit-jp-multisite' ||
		cmd === 'phpunit-jp-wpcomsh' ||
		cmd === 'phpunit-wpcomsh'
	) {
		console.error(
			chalk.red(
				`This command is deprecated. Please use \`jetpack docker phpunit ${ cmd.substring(
					8
				) }\` instead.`
			)
		);
		process.exit( 1 );
	} else if ( cmd === 'phpunit-integration' ) {
		// Only run tests for wpcomsh and jetpack, but always set JP_MONO_INTEGRATION_PLUGINS to the full list
		const plugins = argv.plugins || argv._.slice( 2 );
		const integrationPluginsEnv = plugins.join( ',' );
		const allCmds = [];
		// Only run for these plugins
		const testablePlugins = [ 'wpcomsh', 'jetpack' ];
		for ( const plugin of testablePlugins ) {
			if ( ! plugins.includes( plugin ) ) continue;
			let envVars = [ `JP_MONO_INTEGRATION_PLUGINS=${ integrationPluginsEnv }` ];
			if ( plugin === 'wpcomsh' ) {
				envVars = envVars.concat( [
					'WP_TESTS_DIR=/tmp/wordpress-develop/tests/phpunit',
					'WP_CORE_DIR=/var/www/html',
					'WP_CONTENT_DIR=/var/www/html/wp-content',
				] );
			}
			const unitTestArgs = {
				plugin,
				envVars,
			};
			const pluginOpts = buildPhpUnitTestCmd( argv, [ 'exec', 'wordpress' ], unitTestArgs );
			allCmds.push( buildComposeFiles().concat( pluginOpts ) );
		}
		return allCmds;
	} else if ( cmd === 'wp' ) {
		const wpArgs = argv._.slice( 2 );
		// Ugly solution to allow interactive shell work in dev context
		// TODO: Look for prettier alternatives.
		if ( argv.type === 'e2e' ) {
			opts.splice( 1, 0, '-T' );
		}
		opts.push( 'wp', '--path=/var/www/html/', ...wpArgs );
	} else if ( cmd === 'tail' ) {
		opts.push( '/var/scripts/tail.sh' );
	} else if ( cmd === 'uninstall' ) {
		opts.push( '/var/scripts/uninstall.sh' );
	} else if ( cmd === 'multisite-convert' ) {
		opts.push( '/var/scripts/multisite-convert.sh' );
	} else if ( cmd === 'update-core' ) {
		opts.push( '/var/scripts/update-core.sh', argv.version );
	} else if ( cmd === 'run-extras' ) {
		opts.push( '/var/scripts/run-extras.sh' );
	} else if ( cmd === 'link-plugin' ) {
		opts.push(
			'ln',
			'-s',
			`/usr/local/src/jetpack-monorepo/projects/plugins/${ argv.plugin_slug }`,
			`/var/www/html/wp-content/plugins/${ argv.plugin_slug }`
		);
	} else if ( cmd === 'unlink-plugin' ) {
		opts.push( 'rm', `/var/www/html/wp-content/plugins/${ argv.plugin_slug }` );
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
		const dockerPs = spawnSync( 'docker', [ 'ps' ] );
		if ( dockerPs.status !== 0 ) {
			console.warn(
				chalk.yellow( 'Docker status unreachable. Make sure that the Docker service has started.' )
			);
			process.exit( dockerPs.status );
		}

		cmd = jtTunnelFile;
		console.warn(
			chalk.yellow(
				'Remember! This is creating a tunnel to your local machine. Please use jetpack docker jt-down as soon as you are done with your testing.'
			)
		);
	}

	const jtResult = executor( argv, () => shellExecutor( argv, cmd, opts.concat( jtOpts ) ) );

	if ( jtResult.status !== 0 ) {
		// Try to check if the default named Jetpack container is up.
		const dockerPs = spawnSync(
			'docker',
			[
				"ps --filter 'name=jetpack_dev[_-]wordpress' --filter 'status=running' --format='{{.ID}} {{.Names}}'",
			],
			{
				encoding: 'utf8',
				shell: true,
			}
		);

		if ( dockerPs.status === 0 && dockerPs.stdout.length === 0 ) {
			console.warn(
				chalk.yellow(
					'Unable to establish Jurassic Tube connection. Is your Jetpack Docker container up? If not, try: jetpack docker up -d'
				)
			);

			process.exit( jtResult.status );
		}
	}

	checkProcessResult( jtResult );

	if ( arg !== 'jt-down' ) {
		console.warn(
			chalk.yellow(
				'Remember! This is creating a tunnel to your local machine. Please use jetpack docker jt-down as soon as you are done with your testing.'
			)
		);
	}
};

/**
 * Generate Docker configuration files.
 *
 * @param {object} argv - The command line arguments
 */
async function generateConfig( argv ) {
	await setConfig( argv );
}

/**
 * Definition for the Docker commands.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the Docker commands defined.
 */
export function dockerDefine( yargs ) {
	return yargs.command( {
		command: 'docker <cmd>',
		description: 'Docker stuff',
		builder: yarg => {
			yarg
				.strict( false )
				// Compose commands
				.command( {
					command: 'up',
					description: 'Start Docker containers',
					builder: yargCmd =>
						defaultOpts( yargCmd ).option( 'detached', {
							alias: 'd',
							describe: 'Launch in detached mode',
							type: 'boolean',
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
						const res = executor( argv, () =>
							shellExecutor(
								argv,
								'rm',
								[
									'-rf',
									`${ dockerFolder }/wordpress/`,
									`${ dockerFolder }/wordpress-develop/*`,
									`${ dockerFolder }/logs/${ project }/`,
									`${ dockerFolder }/data/${ project }_mysql/`,
								],
								{ shell: true }
							)
						);
						checkProcessResult( res );
					},
				} )
				.command( {
					command: 'build-image',
					description: 'Builds local docker image',
					handler: argv => {
						const versions = envfile.parse(
							fs.readFileSync( `${ dockerFolder }/../../.github/versions.sh`, 'utf8' )
						);
						const res = executor( argv, () =>
							shellExecutor(
								argv,
								'docker',
								[
									'build',
									'-t',
									'automattic/jetpack-wordpress-dev',
									'--build-arg',
									`PHP_VERSION=${ versions.PHP_VERSION }`,
									'--build-arg',
									`COMPOSER_VERSION=${ versions.COMPOSER_VERSION }`,
									'--build-arg',
									`NODE_VERSION=${ versions.NODE_VERSION }`,
									'--build-arg',
									`PNPM_VERSION=${ versions.PNPM_VERSION }`,
									dockerFolder,
								],
								{ env: { DOCKER_BUILDKIT: 1 } }
							)
						);
						checkProcessResult( res );
					},
				} )

				// WordPress exec commands
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
					description: 'Access MySQL CLI',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'sh',
					description: 'Access shell on WordPress container',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'phpunit <target>',
					description:
						'Run PHPUnit tests inside container for plugins that require a WordPress install.\n\nMost projects do not need a WordPress install, and can be tested on the host by using the `jetpack test` command. If you really want to run them inside the container anyway, see docs in docs/development-environment.md.',
					builder: yargCmd =>
						defaultOpts( yargCmd )
							.option( 'php', {
								describe: 'Use the specified version of PHP.',
								type: 'string',
							} )
							.positional( 'target', {
								describe:
									'Which PHPUnit tests to run:\n- jetpack: Jetpack plugin tests\n- jp-multisite: Jetpack plugin multisite tests.\n- jp-wpcomsh: Jetpack plugin tests with wpcomsh installed.\n- wpcomsh: Wpcomsh plugin tests.',
								type: 'string',
							} ),
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
					command: 'phpunit-jp-multisite',
					deprecated: true,
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'phpunit-jp-wpcomsh',
					deprecated: true,
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'phpunit-wpcomsh',
					deprecated: true,
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'multisite-convert',
					description: 'Convert WP into a multisite',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'update-core [version]',
					description: 'Installs core files',
					builder: yargExec =>
						defaultOpts( yargExec ).positional( 'version', {
							type: 'string',
							description: 'Specify the version to install',
							default: 'latest',
						} ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'run-extras',
					description: 'Run run-extras.sh bin script',
					builder: yargExec => defaultOpts( yargExec ),
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'link-plugin <plugin_slug>',
					description:
						'Links a monorepo plugin folder with the plugin folder of your Docker env. Plugin will be considered installed.',
					builder: yargCmd => {
						yargCmd.positional( 'plugin_slug', {
							describe: 'The plugin slug',
							type: 'string',
						} );
					},
					handler: argv => execDockerCmdHandler( argv ),
				} )
				.command( {
					command: 'unlink-plugin <plugin_slug>',
					description:
						'Uninks a monorepo plugin folder from the plugin folder of your Docker env. Plugin will be considered not installed.',
					builder: yargCmd => {
						yargCmd.positional( 'plugin_slug', {
							describe: 'The plugin slug',
							type: 'string',
						} );
					},
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
				} )
				.command( {
					command: 'config',
					description: 'Generate Docker configuration files',
					builder: yargCmd => defaultOpts( yargCmd ),
					handler: async argv => {
						await generateConfig( argv );
					},
				} )
				.command( {
					command: 'phpunit-integration <plugins...>',
					description:
						'Run PHPUnit for each specified plugin with all specified plugins activated (integration mode)',
					builder: yargCmd =>
						defaultOpts( yargCmd ).positional( 'plugins', {
							describe: 'Plugin slugs to activate and test',
							type: 'string',
							array: true,
						} ),
					handler: argv => {
						// Get all the commands to run
						const allCmds = buildExecCmd( argv );
						let hasFailure = false;
						for ( const opts of allCmds ) {
							try {
								composeExecutor( argv, opts, buildEnv( argv ) );
							} catch ( e ) {
								console.error( chalk.bgRed( `Error: ` ) + e );
								hasFailure = true;
							}
						}
						if ( hasFailure ) {
							process.exit( 1 );
						}
					},
				} );
		},
	} );
}
