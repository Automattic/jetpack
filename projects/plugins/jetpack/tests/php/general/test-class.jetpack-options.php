<?php

use Automattic\Jetpack\Constants;

class WP_Test_Jetpack_Options extends WP_UnitTestCase {

	/**
	 * Cache for the test option.
	 *
	 * @var mixed
	 */
	private $option_cache = false;

	/**
	 * Set up a fake cache for the option 'test_option'.
	 *
	 * Note the hooks added here will be automatically removed by
	 * `WP_UnitTestCase_Base::tear_down()`.
	 */
	private function setup_option_cache() {
		$cache_option = function ( $name, $value = false ) {
			$this->option_cache = $value;
		};
		add_action( 'add_option_test_option', $cache_option, 10, 2 );
		add_action( 'update_option_test_option', $cache_option, 10, 2 );
		add_action( 'delete_option_test_option', $cache_option, 10, 1 );
		add_filter(
			'option_test_option',
			function ( $value ) {
				return false === $this->option_cache ? $value : $this->option_cache;
			}
		);
	}

	public function test_delete_non_compact_option_returns_true_when_successfully_deleted() {
		Jetpack_Options::update_option( 'migrate_for_idc', true );

		// Make sure the option is set
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		$deleted = Jetpack_Options::delete_option( 'migrate_for_idc' );

		// Was the option successfully deleted?
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		// Check if Jetpack_Options::delete_option() properly returned true?
		$this->assertTrue( $deleted );
	}

	public function test_raw_option_update_will_bypass_wp_cache_and_filters() {
		$this->setup_option_cache();

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( 'test_option', 'updated_value' );
		$this->assertEquals( 'cached_value', get_option( 'test_option' ) );
	}

	public function test_raw_option_with_constant_does_not_by_pass_wp_cache_filters() {
		$this->setup_option_cache();

		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
		try {
			update_option( 'test_option', 'cached_value' );
			Jetpack_Options::update_raw_option( 'test_option', 'updated_value' );
			$this->assertEquals( 'updated_value', get_option( 'test_option' ) );
			$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( 'test_option' ) );
		} finally {
			Constants::clear_single_constant( 'JETPACK_DISABLE_RAW_OPTIONS' );
		}
	}

	public function test_raw_option_with_filter_does_not_by_pass_wp_cache_filters() {
		$this->setup_option_cache();

		add_filter(
			'jetpack_disabled_raw_options',
			function ( $options ) {
				$options['test_option'] = true;
				return $options;
			}
		);

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( 'test_option', 'updated_value' );
		$this->assertEquals( 'updated_value', get_option( 'test_option' ) );
		$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( 'test_option' ) );
	}

	public function test_raw_option_get_will_bypass_wp_cache_and_filters() {
		$this->setup_option_cache();

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( 'test_option', 'updated_value' );
		$this->assertEquals( 'cached_value', get_option( 'test_option' ) );
		$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( 'test_option' ) );
	}

	public function test_raw_option_delete_will_bypass_wp_cache_and_filters() {
		$this->setup_option_cache();

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::delete_raw_option( 'test_option' );
		$this->assertEquals( 'cached_value', get_option( 'test_option' ) );
		$this->assertNull( Jetpack_Options::get_raw_option( 'test_option' ) );
	}

	public function test_raw_option_update_with_duplicate_value_returns_false() {
		Jetpack_Options::delete_raw_option( 'test_option_2' );

		Jetpack_Options::update_raw_option( 'test_option_2', 'blue' );
		$this->assertEquals( 'blue', Jetpack_Options::get_raw_option( 'test_option_2' ) );

		$this->assertFalse( Jetpack_Options::update_raw_option( 'test_option_2', 'blue' ) );
		$this->assertTrue( Jetpack_Options::update_raw_option( 'test_option_2', 'yellow' ) );
	}
}
