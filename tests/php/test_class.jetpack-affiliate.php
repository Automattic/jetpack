<?php
/**
 * Tests for Jetpack_Affiliate
 */

// Load required class to get the affiliate code
require_once JETPACK__PLUGIN_DIR . 'class.jetpack.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-affiliate.php';

class WP_Test_Jetpack_Affiliate extends WP_UnitTestCase {

	function test_affiliate_code_missing() {
		$this->assertEmpty( Jetpack_Affiliate::init()->get_affiliate_code() );
	}

	function test_affiliate_code_exists() {
		add_option( 'jetpack_affiliate_code', 'abc123' );
		$this->assertEquals( 'abc123', Jetpack_Affiliate::init()->get_affiliate_code() );
	}

	function test_affiliate_connect_url_missing() {
		$this->assertNotContains( 'aff=', Jetpack::init()->build_connect_url() );
	}

	function test_affiliate_connect_url_exists() {
		add_option( 'jetpack_affiliate_code', 'abc123' );
		$this->assertContains( 'aff=abc123', Jetpack::init()->build_connect_url() );
	}

	function test_affiliate_add_code_to_url() {
		add_option( 'jetpack_affiliate_code', 'abc123' );

		$source = 'somesource123';
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		$user = 123;
		$url = Jetpack_Affiliate::init()->add_code_as_query_arg(
			"https://jetpack.com/redirect/?source={$source}&site={$normalized_site_url}&u={$user}"
		);

		$this->assertContains( "source={$source}", $url );
		$this->assertContains( "site={$normalized_site_url}", $url );
		$this->assertContains( "u=$user", $url );
		$this->assertContains( 'aff=abc123', $url );
	}
}
