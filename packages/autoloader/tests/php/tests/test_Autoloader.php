<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader.
 */
class WP_Test_Autoloader extends TestCase {

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		spl_autoload_register( 'autoloader' );
	}

	/**
	 * Tests whether manifest registration works with autoloading.
	 */
	public function test_autoloader_works() {
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = new Version_Loader(
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

		$class = new Test();

		$this->assertInstanceOf( Test::class, $class );
	}
}
