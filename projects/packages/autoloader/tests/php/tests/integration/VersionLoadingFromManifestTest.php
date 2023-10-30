<?php
/**
 * Integration test suite for the loader population.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass;
use Classmap_Test_Class;
use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for verifying that parsed manifests can be put into the loader and used.
 */
class VersionLoadingFromManifestTest extends TestCase {

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
			array( TEST_PLUGIN_DIR ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			$path_map,
			null,
			null
		);

		$file = $loader->find_class_file( Classmap_Test_Class::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/includes/class-classmap-test-class.php', $file );
	}

	/**
	 * Tests that the PSR-4 manifest from a single plugin can be handled correctly.
	 */
	public function test_psr4() {
		$path_map = array();
		$this->manifest_handler->read_manifests(
			array( TEST_PLUGIN_DIR ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		$loader = new Version_Loader(
			new Version_Selector(),
			null,
			$path_map,
			null
		);

		$file = $loader->find_class_file( UniqueTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/Current/UniqueTestClass.php', $file );
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
			array( TEST_PLUGIN_DIR ),
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

		global $jetpack_autoloader_testing_loaded_files;
		$this->assertContains( Test_Plugin_Factory::VERSION_CURRENT, $jetpack_autoloader_testing_loaded_files );
	}
}
