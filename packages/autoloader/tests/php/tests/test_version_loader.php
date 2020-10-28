<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Class loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use \Jetpack\AutoloaderTestData\Plugin\Psr4\Test as Psr4Test;
use \Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class WP_Test_Version_Loader extends TestCase {

	/**
	 * Tests that `find_class_file` returns null when the given class is not known.
	 */
	public function test_find_class_file_returns_null_for_unknown_class() {
		$version_loader = new Version_Loader( new Version_Selector(), null, null, null );

		$file_path = $version_loader->find_class_file( Test::class );

		$this->assertNull( $file_path );
	}

	/**
	 * Tests that `find_class_file` returns the path to the class when present in the classmap.
	 */
	public function test_find_class_file_returns_path_for_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				Test::class => array(
					'version' => '1.0.0.0',
					'path'    => TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php',
				),
			),
			null,
			null
		);

		$file_path = $version_loader->find_class_file( Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the path to the class when present in the PSR-4 map.
	 */
	public function test_find_class_file_returns_path_for_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			array(
				'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_DATA_PATH . '/plugins/plugin_current/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/src/Psr4/Test.php', $file_path );
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
				'Jetpack\\AutoloaderTestData\\'         => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_DATA_PATH . '/plugins/plugin_current' ),
				),
				'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_DATA_PATH . '/plugins/plugin_current/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/src/Psr4/Test.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the classmap version when newer.
	 */
	public function test_find_class_file_returns_newer_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				Psr4Test::class => array(
					'version' => '2.0.0.0',
					'path'    => TEST_DATA_PATH . '/plugins/plugin_newer/src/Psr4/Test.php',
				),
			),
			array(
				'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( TEST_DATA_PATH . '/plugins/plugin_current/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_newer/src/Psr4/Test.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the PSR-4 version when newer.
	 */
	public function test_find_class_file_returns_newer_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				Psr4Test::class => array(
					'version' => '1.0.0.0',
					'path'    => TEST_DATA_PATH . '/plugins/plugin_current/src/Psr4/Test.php',
				),
			),
			array(
				'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
					'version' => '2.0.0.0',
					'path'    => array( TEST_DATA_PATH . '/plugins/plugin_newer/src' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( Psr4Test::class );

		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_newer/src/Psr4/Test.php', $file_path );
	}

	/**
	 * Tests that `load_filemap` correctly loads all of the files.
	 *
	 * @preserveGlobalState disabled
	 * @runInSeparateProcess
	 */
	public function test_loads_filemap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			array(
				'123456acbdefg' => array(
					'version' => '1.0.0.0',
					'path'    => TEST_DATA_PATH . '/plugins/plugin_current/includes/functions.php',
				),
			)
		);

		$version_loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files']['123456acbdefg'] );
		$this->assertTrue( function_exists( '\\Jetpack\\AutoloaderTestData\\PluginCurrent\\if_i_exist_then_this_test_passed' ) );
	}

	/**
	 * Tests that `load_filemap` does not load files that have already been loaded.
	 */
	public function test_loads_filemap_skips_existing_files() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			null,
			array(
				'123456acbdefg' => array(
					'version' => '1.0.0.0',
					'path'    => TEST_DATA_PATH . '/plugins/plugin_current/includes/functions.php',
				),
			)
		);

		// Pretend it was already loaded!
		$GLOBALS['__composer_autoload_files']['123456acbdefg'] = true;

		$version_loader->load_filemap();

		$this->assertTrue( $GLOBALS['__composer_autoload_files']['123456acbdefg'] );
		$this->assertFalse( function_exists( '\\Jetpack\\AutoloaderTestData\\PluginCurrent\\if_i_exist_then_this_test_passed' ) );
	}
}
