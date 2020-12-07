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
class Test_Version_Loading_From_Manifests extends TestCase {

	/**
	 * A manifest handler.
	 *
	 * @var Manifest_Reader
	 */
	private $manifest_handler;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->manifest_handler = new Manifest_Reader( new Version_Selector() );
	}

	/**
	 * Tests that the classmap manifest from a single plugin can be handled correctly.
	 */
	public function test_classmap() {
		$path_map = array();
		$this->manifest_handler->read_manifests(
			array( TEST_DATA_PATH . '/plugins/dummy_current' ),
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

		$this->assertEquals( TEST_DATA_PATH . '/plugins/dummy_current/includes/class-test.php', $file );
	}

	/**
	 * Tests that the PSR-4 manifest from a single plugin can be handled correctly.
	 */
	public function test_psr4() {
		$path_map = array();
		$this->manifest_handler->read_manifests(
			array( TEST_DATA_PATH . '/plugins/dummy_current' ),
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

		$this->assertEquals( TEST_DATA_PATH . '/plugins/dummy_current/src/Psr4/Test.php', $file );
	}

	/**
	 * Tests that the filemap manifest from a single plugin can be handled correctly.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_filemap() {
		$path_map = array();
		$this->manifest_handler->read_manifests(
			array( TEST_DATA_PATH . '/plugins/dummy_current' ),
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
}
