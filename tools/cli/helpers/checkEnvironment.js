import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as envfile from 'envfile';
import execa from 'execa';
import semver from 'semver';

/**
 * Get a list of monorepo tooling version requirements to check which versions we need.
 *
 * @returns {object} - a list of monorepo version requirements.
 */
export function getVersions() {
	const versions = envfile.parse( fs.readFileSync( `./.github/versions.sh`, 'utf8' ) );
	return versions;
}

/**
 * Returns the current dev environment's composer version.
 *
 * @returns {string} - the composer version of the current dev environment.
 */
export async function getComposerVersion() {
	let composerString = await child_process.spawnSync( 'composer', [ '--version' ] ).stdout;
	// Bail if we don't detect composer is installed.
	if ( ! composerString ) {
		return;
	}
	composerString = composerString.toString().trim();
	const composerVersion = composerString.match( /\d+\.\d+\.\d+/ );
	return composerVersion[ 0 ];
}

/**
 * Compares composer versions and exit if it doesn't match.
 */
export async function compareComposerVersion() {
	const currentComposerVersion = await getComposerVersion();
	const monorepoComposerVersion = getVersions().COMPOSER_VERSION;
	if (
		! process.env.CI &&
		currentComposerVersion &&
		! semver.satisfies( currentComposerVersion, '~' + monorepoComposerVersion )
	) {
		console.log(
			chalk.yellow(
				`Composer version ${ currentComposerVersion } does not satisfy the monorepo's required version of ~${ monorepoComposerVersion }! This may cause issues when working with monorepo tooling.`
			)
		);
		console.log(
			chalk.yellow( `To fix, you can run 'composer self-update ${ monorepoComposerVersion }'` )
		);
		process.exit( 1 );
	}
}

/**
 * Check for whether the CLI is being run from within a different monorepo checkout.
 *
 * If so, this will shell out to the correct CLI, then return.
 */
export async function checkCliLocation() {
	// Did our caller already do this? Don't check again.
	if ( process.env.JETPACK_CLI_DID_REEXEC ) {
		return;
	}

	// Use `path.dirname()` to ensure same trailing-slash behavior as is used below.
	const thisRoot = path.dirname( fileURLToPath( new URL( '../../', import.meta.url ) ) );

	for (
		let olddir = null, dir = process.cwd();
		dir !== olddir;
		olddir = dir, dir = path.dirname( dir )
	) {
		const exe = path.join( dir, 'tools/cli/bin/jetpack.js' );
		if ( ! fs.existsSync( exe ) ) {
			continue;
		}

		if ( dir === thisRoot ) {
			return;
		}

		console.log(
			chalk.yellow(
				`Jetpack CLI was linked to ${ thisRoot }, but a Jetpack Monorepo checkout was found at ${ dir }. Executing the CLI from ${ dir }.`
			)
		);

		// Alas node doesn't expose `execve()` or the like, so this seems the best we can do without messing with native function call stuff.
		const res = await execa.node( exe, process.argv.slice( 2 ), {
			env: {
				JETPACK_CLI_DID_REEXEC: thisRoot,
			},
			stdio: [ 'inherit', 'inherit', 'inherit' ],
			reject: false,
		} );
		process.exit( res.exitCode );
	}
}
