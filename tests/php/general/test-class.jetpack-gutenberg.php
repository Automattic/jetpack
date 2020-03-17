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
		delete_option( 'jetpack_excluded_extensions' );

		// These action causing issues in tests in WPCOM context. Since we are not using any real block here,
		// and we are testing block availability with block stubs - we are safe to remove these actions for these tests.
		remove_all_actions( 'jetpack_register_gutenberg_extensions' );
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
				if ( wp_startswith( $block_name, 'jetpack/' ) ) {
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

	/**
	 * This test will throw an exception/fail if blocks register twice upon repeat calls to get_availability()
	 */
	function test_does_calling_get_availability_twice_result_in_notice() {
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_block') );
		Jetpack_Gutenberg::get_availability();
		Jetpack_Gutenberg::get_availability();
		$result = remove_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_block') );
		$this->assertTrue( $result );
	}

	function register_block() {
		jetpack_register_block( 'jetpack/apple' );
	}

	function test_registered_block_is_available() {
		jetpack_register_block( 'jetpack/apple' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['apple']['available'] );
	}

	function test_registered_block_is_not_available() {
		Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/banana', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['banana']['available'], 'banana is available!' );
		$this->assertEquals( $availability['banana']['unavailable_reason'], 'bar', 'unavailable_reason is not "bar"' );
	}

	function test_registered_block_is_not_available_when_not_defined_in_whitelist() {
		jetpack_register_block( 'jetpack/durian' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertArrayNotHasKey( 'durian', $availability, 'durian is available!' );
	}

	function test_block_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['grape']['available'], 'Availability is not false exists' );
		$this->assertEquals( $availability['grape']['unavailable_reason'], 'missing_module', 'unavailable_reason is not "missing_module"'  );
	}

	// Plugins
	function test_registered_plugin_is_available() {
		Jetpack_Gutenberg::set_extension_available( 'jetpack/onion' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['onion']['available'] );
	}

	function test_registered_plugin_is_not_available() {
		Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/potato', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['potato']['available'], 'potato is available!' );
		$this->assertEquals( $availability['potato']['unavailable_reason'], 'bar', 'unavailable_reason is not "bar"' );
	}

	function test_registered_plugin_is_not_available_when_not_defined_in_whitelist() {
		Jetpack_Gutenberg::set_extension_available( 'jetpack/parsnip' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertArrayNotHasKey( 'parsnip', $availability, 'parsnip is available!' );

	}

	function test_plugin_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['tomato']['available'], 'Availability is not false exists' );
		$this->assertEquals( $availability['tomato']['unavailable_reason'], 'missing_module', 'unavailable_reason is not "missing_module"'  );
	}

	function test_get_available_extensions() {
		$extensions = Jetpack_Gutenberg::get_available_extensions( $this->get_extensions_whitelist() );
		$this->assertInternalType( 'array', $extensions );
		$this->assertNotEmpty( $extensions );
		$this->assertContains( 'onion', $extensions );

		update_option( 'jetpack_excluded_extensions', array( 'onion' ) );

		$extensions = Jetpack_Gutenberg::get_available_extensions( $this->get_extensions_whitelist() );
		$this->assertInternalType( 'array', $extensions );
		$this->assertNotEmpty( $extensions );
		$this->assertNotContains( 'onion', $extensions );
	}

	function test_returns_false_if_core_wp_version_less_than_minimum() {
		$version_gated = Jetpack_Gutenberg::is_gutenberg_version_available(
			array(
				'wp'        => '999999',
				'gutenberg' => '999999',
			),
			'gated_block'
		);
		$this->assertEquals( false, $version_gated );
	}

	/**
	 * Tests whether the environment has the minimum Gutenberg/WordPress installation needed by a block
	 */
	public function test_returns_true_if_gutenberg_or_core_wp_version_greater_or_equal_to_minimum() {
		$version_gated = Jetpack_Gutenberg::is_gutenberg_version_available(
			array(
				'wp'        => '1',
				'gutenberg' => '1',
			),
			'ungated_block'
		);
		$this->assertEquals( true, $version_gated );
	}

	/**
	 * Test that known invalid urls are normalized during validation.
	 *
	 * @dataProvider provider_invalid_urls
	 *
	 * @param string $url               Original URL.
	 * @param string $validated_url     Expected URL after validation.
	 */
	public function test_validate_normalizes_invalid_domain_url( $url, $validated_url ) {
		$allowed_hosts = array( 'calendar.google.com' );

		$url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertEquals( $validated_url, $url );
	}

	/**
	 * Provides Original URL and Expected Validated URL values.
	 *
	 * @return array Array of Test Data
	 */
	public function provider_invalid_urls() {
		return array(
			array(
				'https://calendar.google.com#@evil.com',
				'https://calendar.google.com/#%40evil.com',
			),
			array(
				'https://foo@evil.com:80@calendar.google.com',
				'https://calendar.google.com/',
			),
			array(
				'https://foo@127.0.0.1 @calendar.google.com',
				'https://calendar.google.com/',
			),
			array(
				'https://calendar.google.com/\xFF\x2E\xFF\x2E/passwd',
				'https://calendar.google.com/\xFF\x2E\xFF\x2E/passwd',
			),
		);
	}

	/**
	 * Tests whether a third-party domain can be used in a block.
	 */
	public function test_validate_block_embed_third_party_url() {
		$url           = 'https://example.org';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a random string (not a URL) can be used in a block.
	 */
	public function test_validate_block_embed_string() {
		$url           = 'apple';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a schemeless URL can be used in a block.
	 */
	public function test_validate_block_embed_scheme() {
		$url           = 'wordpress.com';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a URL belonging to a whitelisted list can be used in a block.
	 */
	public function test_validate_block_embed_url() {
		$url           = 'https://wordpress.com/tos/';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertEquals( $url, $validated_url );
	}

	/**
	 * Tests whether a URL matches a specific regex.
	 */
	public function test_validate_block_embed_regex() {
		$url     = 'https://wordpress.com/tos/';
		$allowed = array( '#^https?:\/\/(www.)?wordpress\.com(\/)?([^\/]+)?(\/)?$#' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed, true );

		$this->assertEquals( $url, $validated_url );
	}

	/**
	 * Tests whether a URL does not match a specific regex.
	 */
	public function test_validate_block_embed_regex_mismatch() {
		$url     = 'https://www.facebook.com/WordPresscom/';
		$allowed = array( '#^https?:\/\/(www.)?wordpress\.com(\/)?([^\/]+)?(\/)?$#' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed, true );

		$this->assertFalse( $validated_url );
	}
}
