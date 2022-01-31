<?php
/**
 * Versioning plugin interface.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Automattic\Jetpack\Changelog\ChangeEntry;
use InvalidArgumentException;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Versioning plugin interface.
 *
 * PluginTrait may be used to handle the boilerplate for `instantiate()`, `getOptions()` and `setIO()`.
 */
interface VersioningPlugin {

	/**
	 * The plugin is created via this factory method.
	 *
	 * @param array $config Configuration information from composer.json.
	 */
	public static function instantiate( array $config );

	/**
	 * Define any command line options the versioning plugin wants to accept.
	 *
	 * @return InputOption[]
	 */
	public function getOptions();

	/**
	 * Set Symfony Console input and output interfaces.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 */
	public function setIO( InputInterface $input, OutputInterface $output );

	/**
	 * Parse a version number.
	 *
	 * @param string $version Version.
	 * @return array Associative array with at minimum the following keys. Additional keys may be returned depending on the subclass.
	 *  - version: (string) Version number, without any prerelease or buildinfo.
	 *  - prerelease: (string|null) Prerelease version, e.g. "dev", "alpha", or "beta", if any.
	 *  - buildinfo: (string|null) Build info, if any.
	 * @throws InvalidArgumentException If the version number is not in a recognized format or extra is invalid.
	 */
	public function parseVersion( $version );

	/**
	 * Check and normalize a version number.
	 *
	 * @param string $version Version.
	 * @param array  $extra Extra components for the version, replacing any in `$version`.
	 * @return string Normalized version.
	 * @throws InvalidArgumentException If the version number is not in a recognized format.
	 */
	public function normalizeVersion( $version, $extra = array() );

	/**
	 * Determine the next version given a current version and a set of changes.
	 *
	 * @param string        $version Current version.
	 * @param ChangeEntry[] $changes Changes.
	 * @param array         $extra Extra components for the version.
	 *  - prerelease: (string|null) Prerelease version, e.g. "dev", "alpha", or "beta", if any. See subclass docs for exact values accepted.
	 *  - buildinfo: (string|null) Build info, if any. See subclass docs for exact values accepted.
	 * @return string
	 * @throws InvalidArgumentException If the version number is not in a recognized format, or other arguments are invalid.
	 */
	public function nextVersion( $version, array $changes, array $extra = array() );

	/**
	 * Compare two version numbers.
	 *
	 * @param string $a First version.
	 * @param string $b Second version.
	 * @return int Less than, equal to, or greater than 0 depending on whether `$a` is less than, equal to, or greater than `$b`.
	 * @throws InvalidArgumentException If the version numbers are not in a recognized format.
	 */
	public function compareVersions( $a, $b );

	/**
	 * Return a valid "first" version number.
	 *
	 * @param array $extra Extra components for the version, as for `nextVersion()`.
	 * @return string
	 */
	public function firstVersion( array $extra = array() );
}
