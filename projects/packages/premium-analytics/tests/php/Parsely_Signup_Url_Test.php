<?php
/**
 * Tests for the Parse.ly signup URL script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/parsely-signup-url.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_parsely_signup_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_parsely_signup_url_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\parsely_signup_url
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_parsely_signup_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_parsely_signup_url_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\parsely_signup_url' )]
class Parsely_Signup_Url_Test extends BaseTestCase {

	/**
	 * Reset the request, the site and the filters.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_parsely_signup_url_script_data', 20 );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		delete_option( 'blogname' );
		delete_option( 'home' );
		parent::tear_down();
	}

	public function test_dashboard_gets_the_signup_url_with_the_site_filled_in() {
		update_option( 'blogname', 'New Super Media' );
		update_option( 'home', 'https://newsupermedia.com/blog' );
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
		configure_parsely_signup_url();

		$data = apply_filters( 'jetpack_admin_js_script_data', array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertSame(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=New%20Super%20Media&site_domain=newsupermedia.com',
			$data['premium_analytics']['parsely_signup_url']
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

	public function test_other_admin_pages_get_no_signup_url() {
		$_GET['page'] = 'my-jetpack';
		set_current_screen( 'toplevel_page_my-jetpack' );
		configure_parsely_signup_url();

		$this->assertSame( array(), apply_filters( 'jetpack_admin_js_script_data', array() ) );
	}
}
