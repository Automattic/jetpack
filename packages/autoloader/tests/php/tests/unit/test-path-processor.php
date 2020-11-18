<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Path processor test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles processing paths.
 */
class Test_Path_Processor extends TestCase {

	/**
	 * The path processor we're testing.
	 *
	 * @var Path_Processor
	 */
	private $processor;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->processor = new Path_Processor();
	}

	/**
	 * Tests that find_directory_with_autoloader does not work on non-PHP files.
	 */
	public function test_does_not_find_directory_for_non_php_files() {
		$path = $this->processor->find_directory_with_autoloader(
			'dummy_current/dummy-file.test',
			array( TEST_DATA_PATH . '/plugins' )
		);

		$this->assertFalse( $path );
	}

	/**
	 * Tests that find_directory_with_autoloader does not work for files that don't have the autoloader.
	 */
	public function test_does_not_find_directory_for_not_autoloaded_plugin() {
		$path = $this->processor->find_directory_with_autoloader(
			'file-plugin.php',
			array( TEST_DATA_PATH . '/plugins' )
		);

		$this->assertFalse( $path );
	}

	/**
	 * Tests that find_directory_with_autoloader finds directories for plugins that have the autoloader.
	 */
	public function test_finds_directory_for_autoloaded_plugin() {
		$path = $this->processor->find_directory_with_autoloader(
			'dummy_current/dummy_current.php',
			array( TEST_DATA_PATH . '/plugins' )
		);

		$this->assertEquals( TEST_DATA_PATH . '/plugins/dummy_current', $path );
	}
}
