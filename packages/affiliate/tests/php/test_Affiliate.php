<?php
use Automattic\Jetpack\Partners\Affiliate;
use Automattic\Jetpack\Constants as Jetpack_Constants;

class Test_Affiliate extends WP_UnitTestCase {

	public function setUp() {
		Jetpack_Constants::set_constant(
			'JETPACK__PLUGIN_DIR',
			dirname( dirname( dirname( dirname( __DIR__ ) ) ) )
		);
		require_once Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_DIR' ) . '/class.jetpack.php';
	}

	function test_affiliate_code_missing() {
		$this->assertEmpty( Affiliate::init()->get_affiliate_code() );
	}

	function test_affiliate_code_exists() {
		add_option( 'jetpack_affiliate_code', 'abc123' );
		$this->assertEquals( 'abc123', Affiliate::init()->get_affiliate_code() );
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
		$url = Affiliate::init()->add_code_as_query_arg(
			"https://jetpack.com/redirect/?source={$source}&site={$normalized_site_url}&u={$user}"
		);

		$this->assertContains( "source={$source}", $url );
		$this->assertContains( "site={$normalized_site_url}", $url );
		$this->assertContains( "u=$user", $url );
		$this->assertContains( 'aff=abc123', $url );
	}

}
