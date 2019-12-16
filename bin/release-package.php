<?php
/**
 * Release a Jetpack package.
 *
 * Example usage: `php bin/release-package.php example-package 1.2.3`, where:
 * - `1.2.3` is the tag version
 * - `example-package` is the name of the package that corresponds to:
 *   - A Jetpack package in `/packages/example-package` in the main Jetpack repository
 *   - A repository that lives in `automattic/jetpack-example-package`.
 *
 * This will:
 * - Push a new release in the main repository, with a tag `automattic/jetpack-example-package@1.2.3`.
 * - Push the latest contents and history of the package directory to the package repository.
 * - Push a new release in the package repository, with a tag `v1.2.3`.
 *
 * Pre-requisites and important notes - before running this script, double check all are fulfilled:
 * - The `automattic/jetpack-example-package` package repository must already exist.
 * - The `packages/example-package` directory must already exist.
 * - The user running the script must have permissions to push to:
 *   - The `automattic/jetpack` repository.
 *   - The package repository.
 * - The tag version SHOULD be the next available minor or major version, following the semver standards.
 *
 * @package jetpack
 */

// We need the package name to be able to mirror its directory to a package.
if ( empty( $argv[1] ) ) {
	die( 'Error: Package name has not been specified.' );
}

// Package name should contain only alphanumeric characters and dashes (example: `example-package`).
if ( ! preg_match( '/^[A-Za-z0-9\-]+$/', $argv[1] ) ) {
	die( 'Error: Package name is incorrect.' );
}
$package_name = $argv[1];

// We need the tag name (version) to be able to mirror a package to its corresponding version.
if ( empty( $argv[2] ) ) {
	die( 'Error: Tag name (version) has not been specified.' );
}

// Tag name (version) should match the format `1.2.3`.
if ( ! preg_match( '/^[0-9.]+$/', $argv[2] ) ) {
	die( 'Error: Tag name (version) is incorrect.' );
}
$tag_version = $argv[2];

// Create the new tag in the main repository.
$main_repo_tag = 'automattic/jetpack-' . $package_name . '@' . $tag_version;
$command       = sprintf(
	'git tag -a %1$s -m "%1$s"',
	escapeshellarg( $main_repo_tag )
);
execute( $command, 'Could not tag the new package version in the main repository.' );

// Do the magic: bring the subdirectory contents (and history of non-empty commits) onto the master branch.
$command = sprintf(
	'git filter-branch -f --prune-empty --subdirectory-filter %s master',
	escapeshellarg( 'packages/' . $package_name )
);
execute( $command, 'Could not filter the branch to the package contents.', true );

// Add the corresponding package repository as a remote.
$package_repo_url = sprintf(
	'git@github.com:Automattic/jetpack-%s.git',
	$package_name
);
$command          = sprintf(
	'git remote add package %s',
	escapeshellarg( $package_repo_url )
);
execute( $command, 'Could not add the new package repository remote.', true, true );

// Push the contents to the package repository.
execute( 'git push package master --force', 'Could not push to the new package repository.', true, true );

// Grab all the existing tags from the package repository.
execute( 'git fetch -f --tags', 'Could not fetch the existing tags of the package.', true, true );

// Create the new tag.
$command = sprintf(
	'git tag -a v%1$s -m "Version %1$s"',
	escapeshellarg( $tag_version )
);
execute( $command, 'Could not tag the new version in the package repository.', true, true );

// Push the new package tag to the main repository.
$command = sprintf(
	'git push origin %s',
	escapeshellarg( $main_repo_tag )
);
execute( $command, 'Could not push the new package version tag to the main repository.', true, true );

// Push the new tag to the package repository.
$command = sprintf(
	'git push package v%s',
	escapeshellarg( $tag_version )
);
execute( $command, 'Could not push the new version tag to the package repository.', true, true );

// Reset the main repository to the original state, and remove the package repository remote.
cleanup( true, true );

/**
 * Execute a command.
 * On failure, throw an exception with the specified message (if specified).
 *
 * @throws Exception With the specified message if the command fails.
 *
 * @param string $command           Command to execute.
 * @param string $error             Error message to be thrown if command fails.
 * @param bool   $cleanup_repo      Whether to cleaup repo on error.
 * @param bool   $cleanup_remotes   Whether to cleanup remotes on error.
 */
function execute( $command, $error = '', $cleanup_repo = false, $cleanup_remotes = false ) {
	// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru
	passthru( $command, $status );
	// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru

	if ( $error && 0 !== $status ) {
		cleanup( $cleanup_repo, $cleanup_remotes );

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		echo( 'Error: ' . $error . PHP_EOL );
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}
}

/**
 * Cleanup repository and remotes.
 * Should be called at any error that changes the repo, or at success at the end.
 *
 * @param bool $cleanup_repo    Whether to cleaup repo on error.
 * @param bool $cleanup_remotes Whether to cleanup remotes on error.
 */
function cleanup( $cleanup_repo = false, $cleanup_remotes = false ) {
	if ( $cleanup_repo ) {
		// Reset the main repository to the original state.
		execute( 'git reset --hard refs/original/refs/heads/master', 'Could not reset the repository to its original state.' );

		// Pull the latest master from the main repository.
		execute( 'git pull', 'Could not pull the latest master from the repository.' );
	}

	if ( $cleanup_remotes ) {
		// Remove the temporary repository package remote.
		execute( 'git remote rm package', 'Could not clean up the package repository remote.' );
	}
}
