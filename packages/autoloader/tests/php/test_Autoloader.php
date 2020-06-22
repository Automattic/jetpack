<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Testing file for the autoloader.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader as Autoloader;
use PHPUnit\Framework\TestCase;
use Jetpack\TestCase_ABC\ClassName_ABC;

/**
 * Class WP_Test_Autoloader
 */
class WP_Test_Autoloader extends TestCase {
	/**
	 * Jetpack package classes.
	 *
	 * @var $jetpack_packages_classes
	 */
	public static $jetpack_packages_classes;

	/**
	 * Test setup.
	 */
	public function setup() {
		parent::setup();
		global $jetpack_packages_classes;
		self::$jetpack_packages_classes = $jetpack_packages_classes;
		$jetpack_packages_classes       = array();
	}

	/**
	 * Test tear down.
	 */
	public function tearDown() {
		parent::tearDown();
		// re-apply the global.
		global $jetpack_packages_classes;
		$jetpack_packages_classes = self::$jetpack_packages_classes;
	}

	/**
	 * Ensure enqueuing adds to the global array.
	 */
	public function test_enqueueing_adds_to_the_global_array() {
		Autoloader\enqueue_package_class( 'className', '1', 'path_to_class' );

		global $jetpack_packages_classes;
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], '1' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class' );
	}

	/**
	 * Tests that the latest version is added to the global array.
	 */
	public function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		Autoloader\enqueue_package_class( 'className', '1', 'path_to_class' );
		Autoloader\enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classes;
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], '2' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class_v2' );

	}

	/**
	 * Tests that the dev version is added to the global array.
	 */
	public function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {

		Autoloader\enqueue_package_class( 'className', '1', 'path_to_class' );
		Autoloader\enqueue_package_class( 'className', 'dev-howdy', 'path_to_class_dev' );
		Autoloader\enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classes;
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class_dev' );
	}

	/**
	 * Ensures that an autoloaded class is available.
	 */
	public function test_enqueue_class_to_autoload_works_as_expected() {
		Autoloader\enqueue_package_class( 'Jetpack\TestCase_ABC\ClassName_ABC', '1', dirname( __FILE__ ) . '/path_to_class.php' );

		$class = new ClassName_ABC();

		$this->assertTrue( $class->return_true() );
	}
}
