<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

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
		$this->classes_handler = new Classes_Handler( new Plugins_Handler(), new Version_Selector() );
		spl_autoload_register( 'autoloader' );
	}

	/**
	 * Tests whether enqueueing adds a class to the global array.
	 */
	public function test_enqueueing_adds_to_the_global_array() {
		$this->classes_handler->enqueue_package_class( 'className', '1', 'path_to_class' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], '1' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class' );
	}

	/**
	 * Tests whether enqueueing adds the latest class version to the global array.
	 */
	public function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		$this->classes_handler->enqueue_package_class( 'className', '1', 'path_to_class' );
		$this->classes_handler->enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], '2' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class_v2' );

	}

	/**
	 * Tests whether enqueueing prioritizes the stable version of the class when the
	 * JETPACK_AUTOLOAD_DEV constant is not set. This test must be run before
	 * 'test_enqueueing_adds_the_dev_version_to_the_global_array' because that test
	 * sets JETPACK_AUTOLOAD_DEV.
	 */
	public function test_enqueueing_does_not_add_the_dev_version_to_the_global_array() {

		$this->classes_handler->enqueue_package_class( 'className', '1', 'path_to_class' );
		$this->classes_handler->enqueue_package_class( 'className', 'dev-howdy', 'path_to_class_dev' );
		$this->classes_handler->enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], '2' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class_v2' );
	}

	/**
	 * Tests whether enqueueing prioritizes the dev version of the class when the
	 * JETPACK_AUTOLOAD_DEV constant is set to true.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_enqueueing_adds_the_dev_version_to_the_global_array() {
		defined( 'JETPACK_AUTOLOAD_DEV' ) || define( 'JETPACK_AUTOLOAD_DEV', true );

		$this->classes_handler->enqueue_package_class( 'className', '1', 'path_to_class' );
		$this->classes_handler->enqueue_package_class( 'className', 'dev-howdy', 'path_to_class_dev' );
		$this->classes_handler->enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class_dev' );
	}

	/**
	 * Tests whether enqueueing works with autoloading.
	 */
	public function test_enqueue_class_to_autoload_works_as_expected() {
		$this->classes_handler->enqueue_package_class( 'Jetpack\TestCase_ABC\ClassName_ABC', '1', dirname( __FILE__ ) . '/path_to_class.php' );

		$class = new ClassName_ABC();

		$this->assertTrue( $class->return_true() );
	}
}
