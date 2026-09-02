import fs from 'fs';
import { resolve } from 'path';
import process from 'process';

/**
 * Resolve the compose environment for a docker command that runs on the host.
 *
 * Mirrors the precedence `tools/cli/commands/docker.js` uses inside the container:
 * process env, then tools/docker/default.env, then the worktree's tools/docker/.env,
 * then built-in defaults for whatever is still unset.
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
 * @param {string} monorepoRoot - Path to the monorepo root.
 * @param {string} projectName  - Resolved compose project name (e.g. 'jetpack_dev').
 * @return {Array<string>} Paths that will be removed.
 */
export const buildCleanupPaths = ( monorepoRoot, projectName ) => [
	resolve( monorepoRoot, 'tools/docker/wordpress/' ),
	resolve( monorepoRoot, 'tools/docker/wordpress-develop/*' ),
	resolve( monorepoRoot, 'tools/docker/logs/', projectName ),
	resolve( monorepoRoot, 'tools/docker/data/', `${ projectName }_mysql` ),
];

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
