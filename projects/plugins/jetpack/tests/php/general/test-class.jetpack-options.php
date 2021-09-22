<?php

use Automattic\Jetpack\Constants;

class WP_Test_Jetpack_Options extends WP_UnitTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		wp_cache_flush();
	}

	function cache_option( $name, $value ) {
		wp_cache_set( $name, $value );
	}

	function get_test_option_from_cache( $value ) {
		$cached_value = wp_cache_get( 'test_option' );
		if ( ! empty( $cached_value ) ) {
			return $cached_value;
		}
		return $value;
	}

	function test_delete_non_compact_option_returns_true_when_successfully_deleted() {
		Jetpack_Options::update_option( 'migrate_for_idc', true );

		// Make sure the option is set
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		$deleted = Jetpack_Options::delete_option( 'migrate_for_idc' );

		// Was the option successfully deleted?
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		// Did Jetpack_Options::delete_option() properly return true?
		$this->assertTrue( $deleted );
	}

	function test_raw_option_update_will_bypass_wp_cache_and_filters() {
		$option_name = 'test_option';
		add_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		add_filter( 'option_' . $option_name, array( $this, 'get_test_option_from_cache' ) );

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( $option_name, 'updated_value' );
		$this->assertEquals( 'cached_value', get_option( $option_name ) );

		remove_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		remove_filter( 'option_'. $option_name, array( $this, 'get_test_option_from_cache' ) );
	}


	function test_raw_option_with_constant_does_not_by_pass_wp_cache_filters() {
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true);
		$option_name = 'test_option_with_constant';
		add_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		add_filter( 'option_' . $option_name, array( $this, 'get_test_option_from_cache' ) );

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( $option_name, 'updated_value' );
		$this->assertEquals( 'updated_value', get_option( $option_name ) );
		$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( $option_name ) );

		remove_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		remove_filter( 'option_'. $option_name, array( $this, 'get_test_option_from_cache' ) );
		Constants::clear_single_constant( 'JETPACK_DISABLE_RAW_OPTIONS' );
	}

	function test_raw_option_with_filter_does_not_by_pass_wp_cache_filters() {
		add_filter( 'jetpack_disabled_raw_options', array( $this, 'set_disable_raw_option' ) );
		$option_name = 'test_option_with_filter';
		add_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		add_filter( 'option_' . $option_name, array( $this, 'get_test_option_from_cache' ) );

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( $option_name, 'updated_value' );
		$this->assertEquals( 'updated_value', get_option( $option_name ) );
		$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( $option_name ) );

		remove_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		remove_filter( 'option_'. $option_name, array( $this, 'get_test_option_from_cache' ) );
		remove_filter( 'jetpack_disabled_raw_options', array( $this, 'set_disable_raw_option' ) );
	}

	function set_disable_raw_option( $options ) {
		$options['test_option_with_filter'] = true;
		return $options;
	}

	function test_raw_option_get_will_bypass_wp_cache_and_filters() {
		add_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		add_filter( 'option_test_option', array( $this, 'get_test_option_from_cache' ) );

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::update_raw_option( 'test_option', 'updated_value' );
		$this->assertEquals( 'cached_value', get_option( 'test_option') );
		$this->assertEquals( 'updated_value', Jetpack_Options::get_raw_option( 'test_option' ) );

		remove_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		remove_filter( 'option_test_option', array( $this, 'get_test_option_from_cache' ) );
	}

	function test_raw_option_delete_will_bypass_wp_cache_and_filters() {
		add_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		add_filter( 'option_test_option', array( $this, 'get_test_option_from_cache' ) );

		update_option( 'test_option', 'cached_value' );
		Jetpack_Options::delete_raw_option( 'test_option' );
		$this->assertEquals( 'cached_value', get_option( 'test_option') );
		$this->assertNull( Jetpack_Options::get_raw_option( 'test_option' ) );

		remove_action( 'added_option', array( $this, 'cache_option' ), 10, 2 );
		remove_filter( 'option_test_option', array( $this, 'get_test_option_from_cache' ) );
	}

	function test_raw_option_update_with_duplicate_value_returns_false() {
		Jetpack_Options::delete_raw_option( 'test_option_2' );

		Jetpack_Options::update_raw_option( 'test_option_2', 'blue' );
		$this->assertEquals( 'blue', Jetpack_Options::get_raw_option( 'test_option_2' ) );

		$this->assertFalse( Jetpack_Options::update_raw_option( 'test_option_2', 'blue' ) );
		$this->assertTrue( Jetpack_Options::update_raw_option( 'test_option_2', 'yellow' ) );
	}
}
