/**
 * External dependencies
 */
import child_process from 'child_process';
import fs from 'fs';
import * as envfile from 'envfile';
import chalk from 'chalk';
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
