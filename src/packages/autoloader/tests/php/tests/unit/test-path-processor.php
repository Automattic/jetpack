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
	 *
	 * @before
	 */
	public function set_up() {
		$this->processor = new Path_Processor();
	}

	/**
	 * Tests that the process is able to successfully tokenize and untokenize paths.
	 */
	public function test_handles_path_tokenization_and_untokenization() {
		$path = $this->processor->tokenize_path_constants( WP_PLUGIN_DIR . '/test/path' );

		$this->assertEquals( '{{WP_PLUGIN_DIR}}/test/path', $path );

		$path = $this->processor->untokenize_path_constants( $path );

		$this->assertEquals( WP_PLUGIN_DIR . '/test/path', $path );
	}

	/**
	 * Tests that find_directory_with_autoloader is able to successfully tokenize and untokenize paths on Windows.
	 */
	public function test_handles_path_tokenization_and_untokenization_with_windows_paths() {
		$path = $this->processor->tokenize_path_constants( WP_PLUGIN_DIR . '/test/path' );

		$this->assertEquals( '{{WP_PLUGIN_DIR}}/test/path', $path );

		$path = $this->processor->untokenize_path_constants( $path );

		$this->assertEquals( WP_PLUGIN_DIR . '/test/path', $path );
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

	/**
	 * Tests that find_directory_with_autoloader finds directories using Windows paths.
	 */
	public function test_finds_directory_for_autoloaded_plugin_with_windows_paths() {
		$path = $this->processor->find_directory_with_autoloader(
			'dummy_current\dummy_current.php',
			array( WP_PLUGIN_DIR )
		);

		$this->assertEquals( TEST_DATA_PATH . '/plugins/dummy_current', $path );
	}
}
