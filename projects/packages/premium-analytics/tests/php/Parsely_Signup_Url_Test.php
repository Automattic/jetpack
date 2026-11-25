<?php
/**
 * Tests for the Parse.ly self-serve signup URL.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/parsely-signup-url.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\parsely_signup_url
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\parsely_signup_url' )]
class Parsely_Signup_Url_Test extends BaseTestCase {

	/**
	 * Drop the options the tests set.
	 */
	public function tear_down() {
		delete_option( 'blogname' );
		delete_option( 'home' );

		parent::tear_down();
	}

	public function test_the_signup_url_carries_the_site_name_and_domain() {
		update_option( 'blogname', 'New Super Media' );
		update_option( 'home', 'https://newsupermedia.com/blog' );

		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=New%20Super%20Media&site_domain=newsupermedia.com',
			parsely_signup_url()
		);
	}

	public function test_a_site_without_a_name_still_gets_the_signup_url() {
		update_option( 'blogname', '' );
		update_option( 'home', 'https://newsupermedia.com' );

		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&site_domain=newsupermedia.com',
			parsely_signup_url()
		);
	}

	public function test_a_site_name_that_needs_encoding_is_encoded() {
		update_option( 'blogname', 'Smith & Co' );
		update_option( 'home', 'https://smith.example' );

		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=Smith%20%26%20Co&site_domain=smith.example',
			parsely_signup_url()
		);
	}
}
