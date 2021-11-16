<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Class loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass;
use Automattic\Jetpack\AutoloaderTesting\SharedTestClass;
use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class VersionLoaderTest extends TestCase {

	/**
	 * The older version of the autoloader that we want to use. Note that
	 * the version should support PSR-4 since this one does.
	 */
	const OLDER_VERSION = '2.4.0.0';

	/**
	 * The directory of a plugin using the autoloader.
	 *
	 * @var string
	 */
	private static $older_plugin_dir;

	/**
	 * Setup before class runs before the class.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		self::$older_plugin_dir = Test_Plugin_Factory::create_test_plugin( false, self::OLDER_VERSION )->make();
	}

	/**
	 * Tests that `find_class_file` returns null when the given class is not known.
	 */
	public function test_find_class_file_returns_null_for_unknown_class() {
		$version_loader = new Version_Loader( new Version_Selector(), null, null, null );

		$file_path = $version_loader->find_class_file( UniqueTestClass::class );

		$this->assertNull( $file_path );
	}

	/**
	 * Tests that `find_class_file` returns the path to the class when present in the classmap.
	 */
	public function test_find_class_file_returns_path_for_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				SharedTestClass::class => array(
					'version' => '1.0.0.0',
					'path'    => TEST_PLUGIN_DIR . '/src/SharedTestClass.php',
				),
			),
			null,
			null
		);

		$file_path = $version_loader->find_class_file( SharedTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/SharedTestClass.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the path to the class when present in the PSR-4 map.
	 */
	public function test_find_class_file_returns_path_for_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			array(
				Test_Plugin_Factory::TESTING_NAMESPACE => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_PLUGIN_DIR . '/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( SharedTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/SharedTestClass.php', $file_path );
	}

	/**
	 * Tests that `find_class_file` returns the path to the class when presented
	 * with less-specific namespaces first in the PSR-4 map.
	 */
	public function test_find_class_file_checks_returns_path_for_psr4_with_less_specific_namespace() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			array(
				Test_Plugin_Factory::TESTING_NAMESPACE => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_PLUGIN_DIR . '/src' ),
				),
				Test_Plugin_Factory::TESTING_NAMESPACE . 'Current\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_PLUGIN_DIR . '/src/Current' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( UniqueTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/Current/UniqueTestClass.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the classmap version when newer.
	 */
	public function test_find_class_file_returns_newer_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				SharedTestClass::class => array(
					'version' => '2.0.0.0',
					'path'    => TEST_PLUGIN_DIR . '/src/SharedTestClass.php',
				),
			),
			array(
				Test_Plugin_Factory::TESTING_NAMESPACE => array(
					'version' => '1.0.0.0',
					'path'    => array( self::$older_plugin_dir . '/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( SharedTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/SharedTestClass.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the PSR-4 version when newer.
	 */
	public function test_find_class_file_returns_newer_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				SharedTestClass::class => array(
					'version' => '1.0.0.0',
					'path'    => self::$older_plugin_dir . '/src/SharedTestClass.php',
				),
			),
			array(
				Test_Plugin_Factory::TESTING_NAMESPACE => array(
					'version' => '2.0.0.0',
					'path'    => array( TEST_PLUGIN_DIR . '/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( SharedTestClass::class );

		$this->assertEquals( TEST_PLUGIN_DIR . '/src/SharedTestClass.php', $file_path );
	}

	/**
	 * Tests that `load_filemap` correctly loads all of the files.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_loads_filemap() {
		$file_hash = md5( 'test-file' );

		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			array(
				$file_hash => array(
					'version' => '1.0.0.0',
					'path'    => TEST_PLUGIN_DIR . '/functions.php',
				),
			)
		);

		$version_loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files'][ $file_hash ] );
		global $jetpack_autoloader_testing_loaded_files;
		$this->assertContains( Test_Plugin_Factory::VERSION_CURRENT, $jetpack_autoloader_testing_loaded_files );
	}

	/**
	 * Tests that `load_filemap` does not load files that have already been loaded.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_loads_filemap_skips_existing_files() {
		$file_hash = md5( 'test-file' );

		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			array(
				$file_hash => array(
					'version' => '1.0.0.0',
					'path'    => TEST_PLUGIN_DIR . '/functions.php',
				),
			)
		);

		// Pretend it was already loaded!
		$GLOBALS['__composer_autoload_files'][ $file_hash ] = true;

		$version_loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files'][ $file_hash ] );
		global $jetpack_autoloader_testing_loaded_files;
		$this->assertNotContains( Test_Plugin_Factory::VERSION_CURRENT, $jetpack_autoloader_testing_loaded_files );
	}
}
