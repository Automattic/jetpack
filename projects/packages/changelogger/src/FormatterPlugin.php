<?php
/**
 * Formatter plugin interface.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Automattic\Jetpack\Changelog\Changelog;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Formatter plugin interface.
 *
 * This is intentionally compatible with \Automattic\Jetpack\Changelog\Parser.
 *
 * PluginTrait may be used to handle the boilerplate for `instantiate()`, `getOptions()` and `setIO()`.
 */
interface FormatterPlugin {

	/**
	 * The plugin is created via this factory method.
	 *
	 * @param array $config Configuration information from composer.json.
	 */
	public static function instantiate( array $config );

	/**
	 * Define any command line options the formatter wants to accept.
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
	 * Parse changelog data into a Changelog object.
	 *
	 * @param string $changelog Changelog contents.
	 * @return Changelog
	 */
	public function parse( $changelog );

	/**
	 * Write a Changelog object to a string.
	 *
	 * @param Changelog $changelog Changelog object.
	 * @return string
	 */
	public function format( Changelog $changelog );

	/**
	 * Create a new ChangelogEntry.
	 *
	 * @param string $version See `ChangelogEntry::__construct()`.
	 * @param array  $data See `ChangelogEntry::__construct()`.
	 * @returns ChangelogEntry
	 */
	public function newChangelogEntry( $version, $data = array() );

	/**
	 * Create a new ChangeEntry.
	 *
	 * @param array $data See `ChangeEntry::__construct()`.
	 * @returns ChangeEntry
	 */
	public function newChangeEntry( $data = array() );

}
