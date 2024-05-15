import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as envfile from 'envfile';
import { execaNode } from 'execa';
import semver from 'semver';

let monorepoVersions = null;

/**
 * Get a list of monorepo tooling version requirements to check which versions we need.
 *
 * @returns {object} - a list of monorepo version requirements.
 */
export function getVersions() {
	if ( monorepoVersions === null ) {
		monorepoVersions = envfile.parse( fs.readFileSync( `./.github/versions.sh`, 'utf8' ) );
		Object.freeze( monorepoVersions );
	}
	return monorepoVersions;
}

/**
 * Returns the current dev environment's node version.
 *
 * @returns {string} - the node version of the current dev environment.
 */
export async function getNodeVersion() {
	return process.versions.node;
}

/**
 * Compares node versions.
 *
 * @returns {boolean} Whether the version matched.
 */
export async function compareNodeVersion() {
	const currentNodeVersion = await getNodeVersion();
	const monorepoNodeVersion = getVersions().NODE_VERSION;
	if (
		! process.env.CI &&
		currentNodeVersion &&
		! semver.satisfies( currentNodeVersion, '^' + monorepoNodeVersion )
	) {
		console.log(
			chalk.yellow(
				`Node version ${ currentNodeVersion } does not satisfy the monorepo's required version of ^${ monorepoNodeVersion }! This may cause issues when working with monorepo tooling.`
			)
		);
		return false;
	}
	return true;
}

/**
 * Returns the current dev environment's pnpm version.
 *
 * @returns {string} - the pnpm version of the current dev environment.
 */
export async function getPnpmVersion() {
	const res = await child_process.spawnSync( 'pnpm', [ '--version' ] );
	// Bail if we don't detect pnpm is installed.
	if ( ! res.stdout ) {
		if ( res.error?.code === 'ENOENT' ) {
			return '<not found>';
		}
		return;
	}
	return res.stdout.toString().trim();
}

/**
 * Compares pnpm versions.
 *
 * @returns {boolean} Whether the version matched.
 */
export async function comparePnpmVersion() {
	const currentPnpmVersion = await getPnpmVersion();
	const monorepoPnpmVersion = getVersions().PNPM_VERSION;
	if (
		! process.env.CI &&
		currentPnpmVersion &&
		! semver.satisfies( currentPnpmVersion, '^' + monorepoPnpmVersion )
	) {
		console.log(
			chalk.yellow(
				`Pnpm version ${ currentPnpmVersion } does not satisfy the monorepo's required version of ^${ monorepoPnpmVersion }! This may cause issues when working with monorepo tooling.`
			)
		);
		return false;
	}
	return true;
}

/**
 * Returns the current dev environment's php version.
 *
 * @returns {string} - the php version of the current dev environment.
 */
export async function getPhpVersion() {
	const res = await child_process.spawnSync( 'php', [ '-r', 'echo PHP_VERSION;' ] );
	// Bail if we don't detect composer is installed.
	if ( ! res.stdout ) {
		if ( res.error?.code === 'ENOENT' ) {
			return '<not found>';
		}
		return;
	}
	// Strip any `-1` or the like, as various sources (e.g. sury) indicate patched versions in this manner which confuses `semver.satisfies`.
	return res.stdout.toString().trim().replace( /-.*/, '' );
}

/**
 * Compares php versions.
 *
 * @returns {boolean} Whether the version matched.
 */
export async function comparePhpVersion() {
	const currentPhpVersion = await getPhpVersion();
	const monorepoPhpVersion = getVersions().PHP_VERSION;
	if (
		! process.env.CI &&
		currentPhpVersion &&
		! semver.satisfies( currentPhpVersion, '^' + monorepoPhpVersion )
	) {
		console.log(
			chalk.yellow(
				`PHP version ${ currentPhpVersion } does not satisfy the monorepo's required version of ^${ monorepoPhpVersion }! This may cause issues when working with monorepo tooling.`
			)
		);
		return false;
	}
	return true;
}

/**
 * Returns the current dev environment's composer version.
 *
 * @returns {string} - the composer version of the current dev environment.
 */
export async function getComposerVersion() {
	const res = await child_process.spawnSync( 'composer', [ '--version' ] );
	// Bail if we don't detect composer is installed.
	if ( ! res.stdout ) {
		if ( res.error?.code === 'ENOENT' ) {
			return '<not installed>';
		}
		return;
	}
	const composerVersion = res.stdout
		.toString()
		.trim()
		.match( /\d+\.\d+\.\d+/ );
	return composerVersion?.[ 0 ];
}

/**
 * Compares composer versions.
 *
 * @returns {boolean} Whether the version matched.
 */
export async function compareComposerVersion() {
	const currentComposerVersion = await getComposerVersion();
	const monorepoComposerVersion = getVersions().COMPOSER_VERSION;
	if (
		! process.env.CI &&
		currentComposerVersion &&
		// Tilde rather than caret because API version bumps in minor updates sometimes cause issues.
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
		return false;
	}
	return true;
}

/**
 * Compares versions of various tools.
 *
 * @returns {boolean} Whether all tools matched.
 */
export async function compareToolVersions() {
	let ok = true;
	// Run each function and accumulate results, without short-circuiting.
	ok = ( await compareNodeVersion() ) && ok;
	ok = ( await comparePhpVersion() ) && ok;
	ok = ( await compareComposerVersion() ) && ok;
	ok = ( await comparePnpmVersion() ) && ok;
	return ok;
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
		const res = await execaNode( exe, process.argv.slice( 2 ), {
			env: {
				JETPACK_CLI_DID_REEXEC: thisRoot,
			},
			stdio: [ 'inherit', 'inherit', 'inherit' ],
			reject: false,
		} );
		process.exit( res.exitCode );
	}
}
