<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Base test case for the changelogger tool commands.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Application;
use Symfony\Component\Console\Tester\CommandTester;

/**
 * Base test case for the changelogger tool commands.
 */
class CommandTestCase extends TestCase {

	/**
	 * Get the command.
	 *
	 * @param string $name Command name.
	 * @return Command
	 */
	protected function getCommand( $name ) {
		$app = new Application();
		return $app->find( $name );
	}

	/**
	 * Get a CommandTester.
	 *
	 * @param string $name Command name.
	 * @return CommandTester
	 */
	protected function getTester( $name ) {
		return new CommandTester( $this->getCommand( $name ) );
	}

}
