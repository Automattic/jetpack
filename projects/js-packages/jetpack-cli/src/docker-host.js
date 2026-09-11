import fs from 'fs';
import { resolve } from 'path';
import process from 'process';

/**
 * Resolve the compose environment for a docker command that runs on the host.
 *
 * Precedence, last wins: process env, tools/docker/default.env, the worktree's
 * tools/docker/.env, then built-in defaults for whatever is still unset. Note the file beats
 * an exported variable here, the reverse of `tools/cli/commands/docker.js`, whose
 * `shellExecutor` layers `process.env` last.
 *
 * @param {string}   monorepoRoot - Path to the monorepo root.
 * @param {Array}    args         - Raw CLI arguments.
 * @param {Function} parseEnv     - Parser for an .env buffer; the caller owns the dependency.
 * @return {object} Environment variables for `docker compose`.
 */
export const resolveDockerEnv = ( monorepoRoot, args, parseEnv ) => {
	const isE2e = args.includes( '--type=e2e' );
	const envVars = { ...process.env };

	const defaultEnvPath = resolve( monorepoRoot, 'tools/docker/default.env' );
	if ( fs.existsSync( defaultEnvPath ) ) {
		Object.assign( envVars, parseEnv( fs.readFileSync( defaultEnvPath ) ) );
	}

	const envPath = resolve( monorepoRoot, 'tools/docker/.env' );
	if ( fs.existsSync( envPath ) ) {
		Object.assign( envVars, parseEnv( fs.readFileSync( envPath ) ) );
	}

	if ( ! envVars.COMPOSE_PROJECT_NAME ) {
		envVars.COMPOSE_PROJECT_NAME = isE2e ? 'jetpack_e2e' : 'jetpack_dev';
	}
	if ( ! envVars.PORT_WORDPRESS ) {
		envVars.PORT_WORDPRESS = isE2e ? '8889' : '80';
	}

	if (
		! (
			envVars.PHP_VERSION &&
			envVars.COMPOSER_VERSION &&
			envVars.NODE_VERSION &&
			envVars.PNPM_VERSION
		)
	) {
		const versions = fs.readFileSync( resolve( monorepoRoot, '.github/versions.sh' ), 'utf8' );
		const versionVars = {};
		versions.split( '\n' ).forEach( line => {
			const match = line.match( /^([A-Z_]+)=(.+)$/ );
			if ( match ) {
				versionVars[ match[ 1 ] ] = match[ 2 ].replace( /['"]/g, '' );
			}
		} );

		if ( ! envVars.PHP_VERSION ) envVars.PHP_VERSION = versionVars.PHP_VERSION;
		if ( ! envVars.COMPOSER_VERSION ) envVars.COMPOSER_VERSION = versionVars.COMPOSER_VERSION;
		if ( ! envVars.NODE_VERSION ) envVars.NODE_VERSION = versionVars.NODE_VERSION;
		if ( ! envVars.PNPM_VERSION ) envVars.PNPM_VERSION = versionVars.PNPM_VERSION;
	}

	envVars.HOST_CWD = monorepoRoot;

	return envVars;
};

/**
 * Paths `docker clean` deletes for one instance. `wordpress/` and `wordpress-develop/` are
 * shared by every instance rather than per-project, which is why the plan lists them.
 *
 * `wordpress-develop` is expanded to its entries because `fs.rmSync` does no globbing, and
 * dotfiles are skipped so `.gitkeep` survives, as it does under `rm -rf .../*`.
 *
 * @param {string} monorepoRoot - Path to the monorepo root.
 * @param {string} projectName  - Resolved compose project name (e.g. 'jetpack_dev').
 * @return {Array<string>} Paths that will be removed.
 */
export const buildCleanupPaths = ( monorepoRoot, projectName ) => {
	const wpDevelop = resolve( monorepoRoot, 'tools/docker/wordpress-develop' );
	const wpDevelopEntries = fs.existsSync( wpDevelop )
		? fs
				.readdirSync( wpDevelop )
				.filter( entry => ! entry.startsWith( '.' ) )
				.map( entry => resolve( wpDevelop, entry ) )
		: [];

	return [
		resolve( monorepoRoot, 'tools/docker/wordpress/' ),
		...wpDevelopEntries,
		resolve( monorepoRoot, 'tools/docker/logs/', projectName ),
		resolve( monorepoRoot, 'tools/docker/data/', `${ projectName }_mysql` ),
	];
};

/**
 * Find the first instance-selecting `jetpack docker` flag in `args`.
 *
 * `up`, `down`, `stop` and `clean` run compose directly on the host and forward their arguments
 * verbatim, so every `jetpack docker` flag fails there. These two are refused rather than
 * forwarded because they choose which instance the command acts on: a seeded `.env` wins over
 * both, so `clean` would name one instance in its confirmation prompt and the user another.
 *
 * `-t` is deliberately absent — `jetpack docker` reads it as `--type`, but `docker compose`
 * defines it as `--timeout`, so refusing it would break `jp docker down -t 30`.
 *
 * @param {Array} args - Raw CLI arguments.
 * @return {string|null} The offending flag, or null when there is none.
 */
export const findUnsupportedHostFlag = args => {
	const match = args.find( arg => [ '--name', '-n', '--type' ].includes( arg.split( '=' )[ 0 ] ) );
	return match ? match.split( '=' )[ 0 ] : null;
};

/**
 * Decide how `clean` may proceed. A non-TTY caller is refused rather than prompted, so a
 * script or agent that cannot read the plan has to pass --yes to destroy anything.
 *
 * @param {object}  opts       - Options.
 * @param {boolean} opts.yes   - Whether --yes was passed.
 * @param {boolean} opts.isTty - Whether stdin and stdout are both TTYs.
 * @return {string} 'proceed', 'prompt' or 'refuse'.
 */
export const resolveCleanConsent = ( { yes, isTty } ) => {
	if ( yes ) {
		return 'proceed';
	}
	return isTty ? 'prompt' : 'refuse';
};

/**
 * Remove `--yes`/`-y` from the argument list in place; `docker compose` rejects them.
 *
 * @param {Array} args - Raw CLI arguments, mutated in place.
 * @return {boolean} Whether either flag was present.
 */
export const stripYesFlags = args => {
	let found = false;
	for ( let i = args.length - 1; i >= 0; i-- ) {
		if ( args[ i ] === '--yes' || args[ i ] === '-y' ) {
			args.splice( i, 1 );
			found = true;
		}
	}
	return found;
};
