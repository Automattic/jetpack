<?php
/**
 * Autoloader locator test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for the Autoloader locator.
 */
class AutoloaderLocatorTest extends TestCase {

	/**
	 * The older version of the autoloader that we want to use. Note that
	 * the version should support PSR-4 since this one does.
	 */
	const OLDER_VERSION = '2.6.0.0';

	/**
	 * The directory of a plugin using the autoloader.
	 *
	 * @var string
	 */
	private static $older_plugin_dir;

	/**
	 * The locator we are testing.
	 *
	 * @var Autoloader_Locator
	 */
	private $autoloader_locator;

	/**
	 * Setup before class runs before the class.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		self::$older_plugin_dir = Test_Plugin_Factory::create_test_plugin( false, self::OLDER_VERSION )->make();
	}

	/**
	 * Setup executes before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->autoloader_locator = new Autoloader_Locator( new Version_Selector() );
	}

	/**
	 * Tests the locator to find the latest version of the autoloader.
	 */
	public function test_finds_latest_autoloader() {
		$latest_version = null;
		$latest         = $this->autoloader_locator->find_latest_autoloader( array(), $latest_version );
		$this->assertNull( $latest );
		$this->assertNull( $latest_version );

		$latest = $this->autoloader_locator->find_latest_autoloader(
			array( self::$older_plugin_dir ),
			$latest_version
		);
		$this->assertEquals( self::$older_plugin_dir, $latest );
		$this->assertEquals( self::OLDER_VERSION, $latest_version );

		$latest = $this->autoloader_locator->find_latest_autoloader(
			array( TEST_PLUGIN_DIR, self::$older_plugin_dir ),
			$latest_version
		);
		$this->assertEquals( TEST_PLUGIN_DIR, $latest );
		$this->assertEquals( Test_Plugin_Factory::VERSION_CURRENT, $latest_version );
	}

	/**
	 * Tests that the locator can find the path to the autoloader file.
	 */
	public function test_gets_autoloader_path() {
		$path = $this->autoloader_locator->get_autoloader_path( TEST_PLUGIN_DIR );
		$this->assertEquals( TEST_PLUGIN_DIR . '/vendor/autoload_packages.php', $path );
	}

	/**
	 * Tests that the locator returns null when no version could be found.
	 */
	public function test_gets_autoloader_version_as_null_without_class() {
		$version = $this->autoloader_locator->get_autoloader_version( TEST_PACKAGE_DIR );

		$this->assertNull( $version );
	}

	/**
	 * Tests that the locator can find the version..
	 */
	public function test_gets_autoloader_version() {
		$version = $this->autoloader_locator->get_autoloader_version( TEST_PLUGIN_DIR );

		$this->assertEquals( Test_Plugin_Factory::VERSION_CURRENT, $version );
	}
}
