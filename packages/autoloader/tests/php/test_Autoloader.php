<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\TestCase_ABC\Psr4_ClassName_ABC;
use PHPUnit\Framework\TestCase;
use Jetpack\TestCase_ABC\ClassName_ABC;

/**
 * Test suite class for the Autoloader.
 */
class WP_Test_Autoloader extends TestCase {

	/**
	 * Setup runs before each test.
	 */
	public function setup() {
		parent::setup();
		spl_autoload_register( 'autoloader' );
	}

	/**
	 * Tests whether manifest registration works with autoloading.
	 */
	public function test_autoloader_works() {
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = new Version_Loader( new Version_Selector() );
		$jetpack_autoloader_loader->set_class_map(
			array(
				'Jetpack\TestCase_ABC\ClassName_ABC' => array(
					'version' => '1.0.0.0',
					'path'    => __DIR__ . '/data/path_to_class.php',
				),
			)
		);

		$class = new ClassName_ABC();

		$this->assertTrue( $class->return_true() );
	}
}
