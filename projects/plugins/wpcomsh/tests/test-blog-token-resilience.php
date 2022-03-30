<?php

use Jetpack_Options;
class BlogTokenResilienceTest extends WP_UnitTestCase {

	/**
	 * Clear values for each test
	 */
	public function tearDown() {
		Atomic_Persistent_Data::delete( 'JETPACK_BLOG_TOKEN' );
		delete_option( 'blog_token' );
	}

	/**
	 * Tests the filter to get the blog token on WPCOMSH_Blog_Token_Resilience class
	 *
	 * @param string|null $value_on_db The value to be present at the database at the time get_option is called.
	 * @param string|null $value_on_persistent_data The value to be present at the Persistent Data storage at the time get_option is called.
	 * @param string|bool $expected_value The expeceted return of get_option call.
	 * @return void
	 * @covers WPCOMSH_Blog_Token_Resilience::filter_get_option
	 * @dataProvider get_blog_token_data
	 */
	public function test_get_blog_token( $value_on_db, $value_on_persistent_data, $expected_value ) {
		if ( $value_on_db ) {
			update_option( 'blog_token', $value_on_db );
		}
		if ( $value_on_persistent_data ) {
			Atomic_Persistent_Data::set( 'JETPACK_BLOG_TOKEN', $value_on_persistent_data );
		}

		$value = Jetpack_Options::get_option( 'blog_token' );
		$this->assertSame( $expected_value, $value );
	}

	/**
	 * Data provider for test_get_blog_token
	 *
	 * @return array
	 */
	public function get_blog_token_data() {
		return array(
			'empty'           => array(
				null,
				null,
				false,
			),
			'only_db'         => array(
				'asd',
				null,
				'asd',
			),
			'only_persistent' => array(
				null,
				'qwe',
				'qwe',
			),
			'both'            => array(
				'asda',
				'qwew',
				'qwew',
			),
		);
	}

}

/**
 * Mock for Jetpack_Options
 */
if ( ! class_exists( 'Jetpack_Options' ) ) {
	class Jetpack_Options {

		public static function get_option( $option_name, $default = false ) {
			return apply_filters( 'jetpack_options', get_option( $option_name, $default ), $option_name );
		}

	}
}
