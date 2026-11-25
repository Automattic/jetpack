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
	 * Drop the options and the home override the tests set.
	 */
	public function tear_down() {
		delete_option( 'blogname' );
		delete_option( 'home' );
		remove_all_filters( 'pre_option_home' );

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

	public function test_a_site_without_a_name_or_a_host_still_gets_the_signup_url() {
		update_option( 'blogname', '' );
		add_filter(
			'pre_option_home',
			static function () {
				return 'localhost';
			}
		);

		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack',
			parsely_signup_url()
		);
	}

	public function test_a_site_whose_name_is_only_whitespace_is_sent_without_a_name() {
		update_option( 'blogname', '   ' );
		update_option( 'home', 'https://newsupermedia.com' );

		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&site_domain=newsupermedia.com',
			parsely_signup_url()
		);
	}

	public function test_a_site_name_that_needs_encoding_is_encoded() {
		update_option( 'home', 'https://smith.example' );

		foreach ( array(
			'Smith & Co'   => 'Smith%20%26%20Co',
			"O'Brien & Co" => 'O%27Brien%20%26%20Co',
		) as $name => $encoded ) {
			update_option( 'blogname', $name );

			$this->assertSame(
				'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=' . $encoded . '&site_domain=smith.example',
				parsely_signup_url()
			);
		}
	}
}
