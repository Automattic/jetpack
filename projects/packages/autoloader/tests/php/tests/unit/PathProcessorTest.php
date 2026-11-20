<?php
/**
 * Path processor test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\Attributes\DataProvider;
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
	 */
	public function setUp(): void {
		parent::setUp();
		$this->processor = new Path_Processor();

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@symlink( TEST_PLUGIN_DIR, WP_PLUGIN_DIR . '/current_symlink' );
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@symlink( TEST_PLUGIN_DIR, WPMU_PLUGIN_DIR . '/mu_symlink' );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( WP_PLUGIN_DIR . '/current_symlink' );
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( WPMU_PLUGIN_DIR . '/mu_symlink' );
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
	 * Tests find_directory_with_autoloader.
	 *
	 * @dataProvider provide_find_directory_with_autoloader
	 * @param array{string,string[],2?:bool} $args Arguments to pass.
	 * @param mixed                          $expect Expected return value.
	 */
	#[DataProvider( 'provide_find_directory_with_autoloader' )]
	public function test_find_directory_with_autoloader( $args, $expect ) {
		$actual = $this->processor->find_directory_with_autoloader( ...$args );
		$this->assertSame( $expect, $actual );
	}

	/**
	 * Data provider for `test_find_directory_with_autoloader`.
	 *
	 * @return array<string,array{array{string,string[],2?:bool},mixed}> $args Arguments to pass.
	 */
	public static function provide_find_directory_with_autoloader() {
		return array(
			'does not work on non-PHP files'            => array(
				array( 'current/current.test', array( WP_PLUGIN_DIR ) ),
				false,
			),

			"does not work for files that don't have the autoloader" => array(
				array( 'src/autoload.php', array( dirname( TEST_PLUGIN_DIR ) ) ),
				false,
			),

			'finds directories for plugins that have the autoloader' => array(
				array( 'current/current.php', array( WP_PLUGIN_DIR ) ),
				TEST_PLUGIN_DIR,
			),

			'finds directories using Windows paths'     => array(
				array( 'current\\current.php', array( str_replace( '/', '\\', WP_PLUGIN_DIR ) ) ),
				TEST_PLUGIN_DIR,
			),

			'finds the realpath of directories that use symlinks' => array(
				array( 'current_symlink\current.php', array( WP_PLUGIN_DIR ) ),
				TEST_PLUGIN_DIR,
			),

			'accepts absolute paths'                    => array(
				array( TEST_PLUGIN_DIR . '/current.php', array() ),
				TEST_PLUGIN_DIR,
			),

			'finds directories in safe mode'            => array(
				array( 'current/current.php', array( WP_PLUGIN_DIR ), true ),
				TEST_PLUGIN_DIR,
			),

			'accepts absolute path in safe mode'        => array(
				array( TEST_PLUGIN_DIR . '/current.php', array( WP_PLUGIN_DIR ), true ),
				TEST_PLUGIN_DIR,
			),

			'accepts paths with traversal in non-safe mode' => array(
				array( '../mu-plugins/mu_symlink/current.php', array( WP_PLUGIN_DIR ), false ),
				TEST_PLUGIN_DIR,
			),

			'accepts absolute paths with traversal in non-safe mode' => array(
				array( TEST_PLUGIN_DIR . '/../current/current.php', array( WP_PLUGIN_DIR ), false ),
				TEST_PLUGIN_DIR,
			),

			'rejects paths with traversal in safe mode' => array(
				array( '../mu-plugins/mu_symlink/current.php', array( WP_PLUGIN_DIR ), true ),
				false,
			),

			'rejects absolute paths with traversal in safe mode' => array(
				array( TEST_PLUGIN_DIR . '/../current/current.php', array( WP_PLUGIN_DIR ), true ),
				false,
			),

			'ok with traversal in the checked part in safe mode' => array(
				array( 'current/current.php', array( WP_PLUGIN_DIR . '/../plugins' ), true ),
				TEST_PLUGIN_DIR,
			),

			'ok with traversal in the checked part in safe mode (absolute)' => array(
				array( WP_PLUGIN_DIR . '/../plugins/current/current.php', array( WP_PLUGIN_DIR . '/../plugins' ), true ),
				TEST_PLUGIN_DIR,
			),

			'accepts symlinked directories in safe mode, even if the target is outside the checked path' => array(
				array( WPMU_PLUGIN_DIR . '/mu_symlink/current.php', array( WPMU_PLUGIN_DIR ), true ),
				TEST_PLUGIN_DIR,
			),

			'rejects symlinked directories outside of checked paths in safe mode, even if the target is inside the checked path' => array(
				array( WPMU_PLUGIN_DIR . '/mu_symlink/current.php', array( WP_PLUGIN_DIR ), true ),
				false,
			),
		);
	}
}
