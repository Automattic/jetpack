<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader locator test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader locator.
 */
class WP_Test_Autoloader_Locator extends TestCase {

	/**
	 * The locator we are testing.
	 *
	 * @var Autoloader_Locator
	 */
	private $autoloader_locator;

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
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			$latest_version
		);
		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current', $latest );
		$this->assertEquals( '2.0.0.0', $latest_version );

		$latest = $this->autoloader_locator->find_latest_autoloader(
			array(
				TEST_DATA_PATH . '/plugins/plugin_newer',
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			$latest_version
		);
		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_newer', $latest );
		$this->assertEquals( '2.2.0.0', $latest_version );
	}

	/**
	 * Tests that the locator can find the path to the autoloader file.
	 */
	public function test_gets_autoloader_path() {
		$path = $this->autoloader_locator->get_autoloader_path( TEST_DATA_PATH . '/plugins/plugin_current' );
		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current/vendor/autoload_packages.php', $path );
	}

	/**
	 * Tests that the locator returns null when no version could be found.
	 */
	public function test_gets_autoloader_version_as_null_without_class() {
		$version = $this->autoloader_locator->get_autoloader_version( TEST_DATA_PATH );

		$this->assertNull( $version );
	}

	/**
	 * Tests that the locator can find the version..
	 */
	public function test_gets_autoloader_version() {
		$version = $this->autoloader_locator->get_autoloader_version( TEST_DATA_PATH . '/plugins/plugin_current' );

		$this->assertEquals( '2.0.0.0', $version );
	}
}
