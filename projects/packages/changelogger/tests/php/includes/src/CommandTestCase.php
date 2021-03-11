<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Base test case for the changelogger tool commands.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Application;
use Automattic\Jetpack\Changelogger\Config;
use Symfony\Component\Console\Output\BufferedOutput;
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
		// `$command->configure()` is called by `->__construct()`, which may
		// call Config, so we need Config to have an output set. Set one that
		// asserts that nothing is output, we don't need to test Config failure
		// cases here.
		$output = $this->getMockBuilder( BufferedOutput::class )
			->setMethods( array( 'doWrite' ) )
			->getMock();
		$output->expects( $this->never() )->method( 'doWrite' );
		Config::setOutput( $output );

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
