<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Dummy plugin interface for testing plugin handling.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName

namespace Automattic\Jetpack\Changelogger\Tests;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Dummy plugin interface for testing plugin handling.
 */
interface DummyPlugin {

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

}
