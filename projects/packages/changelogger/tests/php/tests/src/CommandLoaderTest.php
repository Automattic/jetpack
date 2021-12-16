<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger CommandLoader class.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\AddCommand;
use Automattic\Jetpack\Changelogger\CommandLoader;
use Symfony\Component\Console\Exception\CommandNotFoundException;

/**
 * Tests for the changelogger CommandLoader class.
 *
 * @covers \Automattic\Jetpack\Changelogger\CommandLoader
 */
class CommandLoaderTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test `has()`.
	 */
	public function testHas() {
		$loader = new CommandLoader();
		$this->assertTrue( $loader->has( 'add' ) );
		$this->assertFalse( $loader->has( 'doesnotexist' ) );
	}

	/**
	 * Test `get()`.
	 */
	public function testGet() {
		$loader = new CommandLoader();
		$this->assertInstanceOf( AddCommand::class, $loader->get( 'add' ) );
	}

	/**
	 * Test `get()` when passed an unrecognized command.
	 */
	public function testGet_failure() {
		$loader = new CommandLoader();
		$this->expectException( CommandNotFoundException::class );
		$loader->get( 'doesnotexist' );
	}

	/**
	 * Test `getNames()`.
	 */
	public function testGetNames() {
		$loader = new CommandLoader();
		$this->assertSame(
			array( 'add', 'squash', 'validate', 'version', 'write' ),
			$loader->getNames()
		);
	}

}
