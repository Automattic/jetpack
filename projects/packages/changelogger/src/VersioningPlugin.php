<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Versioning plugin interface.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName

namespace Automattic\Jetpack\Changelogger;

use Automattic\Jetpack\Changelog\ChangeEntry;
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
	 * Determine the next version given a current version and a set of changes.
	 *
	 * @param string        $version Current version.
	 * @param ChangeEntry[] $changes Changes.
	 * @return string
	 */
	public function nextVersion( $version, array $changes );

}
