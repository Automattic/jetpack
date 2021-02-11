<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Path processor test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles processing paths.
 */
class PathProcessorTest extends TestCase {

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

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@symlink( TEST_PLUGIN_DIR, WP_PLUGIN_DIR . '/current_symlink' );
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( WP_PLUGIN_DIR . '/current_symlink' );
	}

	/**
	 * Tests that the processor is able to successfully tokenize and untokenize paths.
	 */
	public function test_handles_path_tokenization_and_untokenization() {
		$path = $this->processor->tokenize_path_constants( TEST_PLUGIN_DIR );

		$this->assertEquals( '{{WP_PLUGIN_DIR}}/current', $path );

		$path = $this->processor->untokenize_path_constants( $path );

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that the processor is able to successfully tokenize and untokenize paths on Windows.
	 */
	public function test_handles_path_tokenization_and_untokenization_with_windows_paths() {
		$path = $this->processor->tokenize_path_constants( str_replace( '/', '\\', TEST_PLUGIN_DIR ) );

		$this->assertEquals( '{{WP_PLUGIN_DIR}}/current', $path );

		$path = $this->processor->untokenize_path_constants( $path );

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that the processor resolves symlinks when untokenizing.
	 */
	public function test_path_untokenization_resolves_symlinks() {
		$path = $this->processor->untokenize_path_constants( '{{WP_PLUGIN_DIR}}/current_symlink' );

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that find_directory_with_autoloader does not work on non-PHP files.
	 */
	public function test_does_not_find_directory_for_non_php_files() {
		$path = $this->processor->find_directory_with_autoloader(
			'current/current.test',
			array( WP_PLUGIN_DIR )
		);

		$this->assertFalse( $path );
	}

	/**
	 * Tests that find_directory_with_autoloader does not work for files that don't have the autoloader.
	 */
	public function test_does_not_find_directory_for_not_autoloaded_plugin() {
		$path = $this->processor->find_directory_with_autoloader(
			'src/autoload.php',
			array( dirname( TEST_PLUGIN_DIR ) )
		);

		$this->assertFalse( $path );
	}

	/**
	 * Tests that find_directory_with_autoloader finds directories for plugins that have the autoloader.
	 */
	public function test_finds_directory_for_autoloaded_plugin() {
		$path = $this->processor->find_directory_with_autoloader(
			'current/current.php',
			array( WP_PLUGIN_DIR )
		);

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that find_directory_with_autoloader finds directories using Windows paths.
	 */
	public function test_finds_directory_for_autoloaded_plugin_with_windows_paths() {
		$path = $this->processor->find_directory_with_autoloader(
			'current\\current.php',
			array( str_replace( '/', '\\', WP_PLUGIN_DIR ) )
		);

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that find_directory_with_autoloader finds the realpath of directories that use symlinks.
	 */
	public function test_finds_directory_realpath_for_symlinked_plugin() {
		$path = $this->processor->find_directory_with_autoloader(
			'current_symlink\current.php',
			array( WP_PLUGIN_DIR )
		);

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}
}
