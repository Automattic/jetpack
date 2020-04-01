<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowerCase
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;
use Jetpack\TestCase_ABC\className_ABC;

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
	 * Tests whether enqueueing adds a class to the global array.
	 */
	public function test_enqueueing_adds_to_the_global_array() {
		enqueue_package_class( 'className', '1', 'path_to_class' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], '1' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class' );
	}

	/**
	 * Tests whether enqueueing adds the latest class version to the global array.
	 */
	public function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		enqueue_package_class( 'className', '1', 'path_to_class' );
		enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], '2' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class_v2' );

	}

	/**
	 * Tests whether enqueueing prioritizes the dev version of the class.
	 */
	public function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {

		enqueue_package_class( 'className', '1', 'path_to_class' );
		enqueue_package_class( 'className', 'dev-howdy', 'path_to_class_dev' );
		enqueue_package_class( 'className', '2', 'path_to_class_v2' );

		global $jetpack_packages_classmap;
		$this->assertTrue( isset( $jetpack_packages_classmap['className'] ) );
		$this->assertEquals( $jetpack_packages_classmap['className']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_classmap['className']['path'], 'path_to_class_dev' );
	}

	/**
	 * Tests whether enqueueing works with autoloading.
	 */
	public function test_enqueue_class_to_autoload_works_as_expected() {
		enqueue_package_class( 'Jetpack\TestCase_ABC\className_ABC', '1', dirname( __FILE__ ) . '/path_to_class.php' );

		$class = new className_ABC();

		$this->assertTrue( $class->return_true() );
	}
}
