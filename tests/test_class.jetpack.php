<?php

class WP_Test_Jetpack extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack::init
	 * @since 2.3.3
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack', Jetpack::init() );
	}
	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 */
	public function test_sort_modules_with_equal_sort_values() {

		$first_file  = array( 'sort' => 5 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );

		$this->assertEquals( 0, $sort_value );
	}
	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 */
	public function test_sort_modules_with_different_sort_values() {

		$first_file  = array( 'sort' => 10 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );
		$reversed_sort_value = Jetpack::sort_modules( $second_file, $first_file );

		$this->assertEquals( 1, $sort_value );
		$this->assertEquals( -1, $reversed_sort_value );
	}

	/**
	 * @author tonykova
	 * @covers Jetpack::implode_frontend_css
	 */
	public function test_implode_frontend_css_enqueues_bundle_file_handle() {
		global $wp_styles;
		$wp_styles = new WP_styles();

		add_filter( 'jetpack_implode_frontend_css', '__return_true' );

		// Enqueue some script on the $to_dequeue list
		$style_handle = 'jetpack-carousel';
		wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ) );

		Jetpack::init()->implode_frontend_css();

		$seen_bundle = false;
		foreach ( $wp_styles->registered as $handle => $handle_obj ) {
			$this->assertNotEquals( $style_handle, $handle );
			if ( 'jetpack_css' === $handle ) {
				$seen_bundle = true;
			}
		}

		$this->assertTrue( $seen_bundle );
	}

	/**
	 * @author tonykova
	 * @covers Jetpack::implode_frontend_css
	 */
	public function test_implode_frontend_css_does_not_enqueue_bundle_when_disabled_through_filter() {
		global $wp_styles;
		$wp_styles = new WP_styles();

		add_filter( 'jetpack_implode_frontend_css', '__return_false' );

		// Enqueue some script on the $to_dequeue list
		$style_handle = 'jetpack-carousel';
		wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ) );

		Jetpack::init()->implode_frontend_css();

		$seen_orig = false;
		foreach ( $wp_styles->registered as $handle => $handle_obj ) {
			$this->assertNotEquals( 'jetpack_css', $handle );
			if ( 'jetpack-carousel' === $handle ) {
				$seen_orig = true;
			}
		}

		$this->assertTrue( $seen_orig );
	}
} // end class
