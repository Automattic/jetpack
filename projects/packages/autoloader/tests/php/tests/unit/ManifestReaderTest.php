<?php // phpcs:ignore WordPress.Files.FileName
/**
 * File loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use Classmap_Test_Class;
use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class ManifestReaderTest extends TestCase {

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
	 * The manifest reader we're testing.
	 *
	 * @var Manifest_Reader
	 */
	private $reader;

	/**
	 * Setup before class runs before the class.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		self::$older_plugin_dir = Test_Plugin_Factory::create_test_plugin( false, self::OLDER_VERSION )->make();
	}

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->reader = new Manifest_Reader( new Version_Selector() );
	}

	/**
	 * Tests that nothing is read without any plugins.
	 */
	public function test_reads_nothing_without_plugins() {
		$input_array = array();

		$this->reader->read_manifests(
			array(),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertEmpty( $input_array );
	}

	/**
	 * Tests that nothing is read for plugins that have no manifest.
	 */
	public function test_reads_nothing_for_plugins_without_manifests() {
		$input_array = array();

		$this->reader->read_manifests(
			array( TEST_PACKAGE_DIR ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertEmpty( $input_array );
	}

	/**
	 * Tests that a single plugin manifest can be read successfully.
	 */
	public function test_reads_single_plugin_manifest() {
		$input_array = array();

		$this->reader->read_manifests(
			array( TEST_PLUGIN_DIR ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Classmap_Test_Class::class, $input_array );
		$this->assertEquals( Test_Plugin_Factory::VERSION_CURRENT, $input_array[ Classmap_Test_Class::class ]['version'] );
		$this->assertEquals( $input_array[ Classmap_Test_Class::class ]['path'], TEST_PLUGIN_DIR . '/includes/class-classmap-test-class.php' );
	}

	/**
	 * Tests that the reader only keeps the latest version when processing multiple manifests.
	 */
	public function test_read_overwrites_older_version_in_manifest() {
		$input_array = array();

		$this->reader->read_manifests(
			array( self::$older_plugin_dir, TEST_PLUGIN_DIR ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Classmap_Test_Class::class, $input_array );
		$this->assertEquals( Test_Plugin_Factory::VERSION_CURRENT, $input_array[ Classmap_Test_Class::class ]['version'] );
		$this->assertEquals( $input_array[ Classmap_Test_Class::class ]['path'], TEST_PLUGIN_DIR . '/includes/class-classmap-test-class.php' );
	}

	/**
	 * Tests that the reader ignores older versions when a newer version is already set.
	 */
	public function test_read_ignores_older_version_when_newer_already_loaded() {
		$input_array = array();

		$this->reader->read_manifests(
			array( TEST_PLUGIN_DIR, self::$older_plugin_dir ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Classmap_Test_Class::class, $input_array );
		$this->assertEquals( Test_Plugin_Factory::VERSION_CURRENT, $input_array[ Classmap_Test_Class::class ]['version'] );
		$this->assertEquals( $input_array[ Classmap_Test_Class::class ]['path'], TEST_PLUGIN_DIR . '/includes/class-classmap-test-class.php' );
	}
}
