<?php

class WP_Test_Jetpack_Gutenberg extends WP_UnitTestCase {

	public $master_user_id = false;

	public function setUp() {
		parent::setUp();
		if ( ! function_exists( 'register_block_type' ) ) {
			$this->markTestSkipped( 'register_block_type not available' );
			return;
		}

		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			$this->markTestSkipped( 'WP_Block_Type_Registry not available' );
			return;
		}
		// Create a user and set it up as current.
		$this->master_user_id = $this->factory->user->create( array( 'user_login' => 'current_master' ) );
		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $this->master_user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $this->master_user_id => "honey.badger.$this->master_user_id" ) );

		add_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extensions_whitelist' ) );
		Jetpack_Gutenberg::init();
	}

	public function tearDown() {
		parent::tearDown();

		Jetpack_Gutenberg::reset();
		remove_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extensions_whitelist' ) );

		if ( $this->master_user_id ) {
			Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
			wp_delete_user( $this->master_user_id );
		}

		if ( class_exists( 'WP_Block_Type_Registry' ) ) {
			$blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();
			foreach ( $blocks as $block_name => $block ) {
				if ( strpos( $block_name, 'jetpack/' ) !== false ) {
					unregister_block_type( $block_name );
				}
			}
		}
	}

	public static function get_extensions_whitelist() {
		return array(
			// Our "Blocks" :)
			'apple',
			'banana',
			'coconut',
			'grape',
			// Our "Plugins" :)
			'onion',
			'potato',
			'tomato'
		);
	}

	function test_registered_block_is_available() {
		jetpack_register_block( 'apple' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['apple']['available'] );
	}

	function test_registered_block_is_not_available() {
		jetpack_set_extension_unavailability_reason( 'banana', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['banana']['available'], 'banana is available!' );
		$this->assertEquals( $availability['banana']['unavailable_reason'], 'bar', 'unavailable_reason is not "bar"' );
	}

	function test_registered_block_is_not_available_when_not_defined_in_whitelist() {
		jetpack_register_block( 'durian' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['durian']['available'], 'durian is available!' );
		$this->assertEquals( $availability['durian']['unavailable_reason'], 'not_whitelisted', 'unavailable_reason is not "not_whitelisted"' );
	}

	function test_block_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['grape']['available'], 'Availability is not false exists' );
		$this->assertEquals( $availability['grape']['unavailable_reason'], 'missing_module', 'unavailable_reason is not "missing_module"'  );
	}

	// Plugins
	function test_registered_plugin_is_available() {
		jetpack_register_plugin( 'onion' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['onion']['available'] );
	}

	function test_registered_plugin_is_not_available() {
		jetpack_set_extension_unavailability_reason( 'potato', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['potato']['available'], 'potato is available!' );
		$this->assertEquals( $availability['potato']['unavailable_reason'], 'bar', 'unavailable_reason is not "bar"' );
	}

	function test_registered_plugin_is_not_available_when_not_defined_in_whitelist() {
		jetpack_register_plugin( 'parsnip' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['parsnip']['available'], 'durian is available!' );
		$this->assertEquals( $availability['parsnip']['unavailable_reason'], 'not_whitelisted', 'unavailable_reason is not "not_whitelisted"' );

	}

	function test_plugin_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['tomato']['available'], 'Availability is not false exists' );
		$this->assertEquals( $availability['tomato']['unavailable_reason'], 'missing_module', 'unavailable_reason is not "missing_module"'  );
	}
}
