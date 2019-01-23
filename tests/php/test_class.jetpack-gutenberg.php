<?php

class WP_Test_Jetpack_Gutenberg extends WP_UnitTestCase {

	public $master_user_id = false;

	public function setUp() {
		parent::setUp();
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
	}

	public static function get_extensions_whitelist() {
		return array(
			'apple',
			'banana',
			'coconut',
			'grape',
		);
	}

	function test_registered_extension_is_available() {
		jetpack_register_gutenberg_extension( 'apple' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['apple']['available'] );
	}

	function test_registered_extension_is_not_available() {
		jetpack_set_extension_unavailability_reason( 'banana', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['banana']['available'], 'banana is available!' );
		$this->assertEquals( $availability['banana']['unavailable_reason'], 'bar', 'unavailable_reason is not "bar"' );
	}

	function test_registered_extension_is_not_available_when_not_defined_in_whitelist() {
		jetpack_register_gutenberg_extension( 'durian' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['durian']['available'], 'durian is available!' );
		$this->assertEquals( $availability['durian']['unavailable_reason'], 'not_whitelisted', 'unavailable_reason is not "not_whitelisted"' );
	}

	function test_extension_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the extension wasn't registered
		$this->assertFalse( $availability['grape']['available'], 'Availability is not false exists' );
		$this->assertEquals( $availability['grape']['unavailable_reason'], 'missing_module', 'unavailable_reason is not "missing_module"'  );
	}
}
