<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Integration test suite for the loader population.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\AutoloaderTestData\Plugin\Psr4\Test as Psr4Test;
use Jetpack\AutoloaderTestData\Plugin\Test as Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for verifying that parsed manifests can be put into the loader and used.
 */
class WP_Test_Integration_Loader extends TestCase {

	/**
	 * A manifest handler configured for a single plugin.
	 *
	 * @var Manifest_Handler
	 */
	private $single_manifest_handler;

	/**
	 * A manifest handler configured for multiple plugins.
	 *
	 * @var Manifest_Handler
	 */
	private $multiple_manifest_handler;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->single_manifest_handler   = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);
		$this->multiple_manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_newer',
			),
			new Version_Selector()
		);
	}

	/**
	 * Tests that the classmap manifest from a single plugin can be handled correctly.
	 */
	public function test_single_plugin_classmap() {
		$path_map = array();
		$this->single_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_classmap.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			$path_map,
			null,
			null
		);

		$file = $loader->find_class_file( Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php', $file );
	}

	/**
	 * Tests that the classmap manifest from multiple plugins can be handled correctly.
	 */
	public function test_multiple_plugin_classmap() {
		$path_map = array();
		$this->multiple_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_classmap.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			$path_map,
			null,
			null
		);

		$file = $loader->find_class_file( Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_newer/includes/class-test.php', $file );
	}

	/**
	 * Tests that the PSR-4 manifest from a single plugin can be handled correctly.
	 */
	public function test_single_plugin_psr4() {
		$path_map = array();
		$this->single_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			null,
			$path_map,
			null
		);

		$file = $loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/src/Psr4/Test.php', $file );
	}

	/**
	 * Tests that the PSR-4 manifest from multiple plugins can be handled correctly.
	 */
	public function test_multiple_plugin_psr4() {
		$path_map = array();
		$this->multiple_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			null,
			$path_map,
			null
		);

		$file = $loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_newer/src/Psr4/Test.php', $file );
	}

	/**
	 * Tests that the filemap manifest from a single plugin can be handled correctly.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_single_plugin_filemap() {
		$path_map = array();
		$this->single_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_filemap.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			$path_map
		);

		$loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files']['123456acbdefg'] );
		$this->assertTrue( function_exists( '\\Jetpack\\AutoloaderTestData\\PluginCurrent\\if_i_exist_then_this_test_passed' ) );
	}

	/**
	 * Tests that the filemap manifest from multiple plugins can be handled correctly.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_multiple_plugin_filemap() {
		$path_map = array();
		$this->multiple_manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_filemap.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			$path_map
		);

		$loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files']['123456acbdefg'] );
		$this->assertTrue( function_exists( '\\Jetpack\\AutoloaderTestData\\PluginNewer\\if_i_exist_then_this_test_passed' ) );
	}
}
