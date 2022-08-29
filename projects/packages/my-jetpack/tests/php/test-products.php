<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/assets/mock-classes.php';

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Test_Products extends TestCase {

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {

		// See https://stackoverflow.com/a/41611876.
		if ( version_compare( phpversion(), '5.7', '<=' ) ) {
			$this->markTestSkipped( 'avoid bug in PHP 5.6 that throws strict mode warnings for abstract static methods.' );
		}

	}

	/**
	 * Cleaning up after the test.
	 *
	 * @after
	 */
	public function tear_down() {
		// Make sure to clear the filters even after exceptions.
		remove_filter( 'my_jetpack_products_classes', array( $this, 'return_valid_class' ) );
		remove_filter( 'my_jetpack_products_classes', array( $this, 'return_non_existent_class' ) );
		remove_filter( 'my_jetpack_products_classes', array( $this, 'return_invalid_class' ) );
	}

	/**
	 * Filter that returns a non existent class
	 *
	 * @param arrray $classes The Products classes.
	 * @return array
	 */
	public function return_non_existent_class( $classes ) {
		$classes['boost'] = 'Non_Existent_Class';
		return $classes;
	}

	/**
	 * Filter that returns an invalid class
	 *
	 * @param arrray $classes The Products classes.
	 * @return array
	 */
	public function return_invalid_class( $classes ) {
		$classes['boost'] = 'Automattic\Jetpack\My_Jetpack\Mock_Boost_Invalid';
		return $classes;
	}

	/**
	 * Filter that returns a valid class
	 *
	 * @param arrray $classes The Products classes.
	 * @return array
	 */
	public function return_valid_class( $classes ) {
		$classes['boost'] = 'Automattic\Jetpack\My_Jetpack\Mock_Boost_Child';
		return $classes;
	}

	/**
	 * Tests a filter returning a valid class
	 */
	public function test_filter_classes_valid() {
		add_filter( 'my_jetpack_products_classes', array( $this, 'return_valid_class' ) );
		$this->assertEquals( 'Child Boost', ( Products::get_product_class( 'boost' ) )::get_name() );
	}

	/**
	 * Tests a filter returning a non existent class
	 */
	public function test_filter_classes_non_existent() {
		$this->expectException( \Exception::class );
		add_filter( 'my_jetpack_products_classes', array( $this, 'return_non_existent_class' ) );
		Products::get_products_classes();
	}

	/**
	 * Tests a filter returning an invalid class
	 */
	public function test_filter_classes_invalid() {
		$this->expectException( \Exception::class );
		add_filter( 'my_jetpack_products_classes', array( $this, 'return_invalid_class' ) );
		Products::get_products_classes();
	}

}

