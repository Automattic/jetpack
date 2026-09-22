<?php
/**
 * Tests for the Newsletter subscribers link script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Newsletter\Urls;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/newsletter-subscribers-link.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_newsletter_subscribers_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_newsletter_subscribers_script_data' )]
class Newsletter_Subscribers_Link_Test extends BaseTestCase {

	/**
	 * Drop the registered page and the current user.
	 */
	public function tear_down() {
		unset( $GLOBALS['_parent_pages'], $GLOBALS['_registered_pages'], $GLOBALS['submenu'] );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	public function test_script_data_carries_the_newsletter_subscribers_tab_url() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'jpa_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		add_submenu_page( 'jetpack', 'Newsletter', 'Newsletter', 'manage_options', 'jetpack-newsletter', '__return_null' );

		$data = inject_newsletter_subscribers_script_data(
			array( 'premium_analytics' => array( 'has_videopress' => true ) )
		);

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertNotNull( Urls::get_subscribers_url() );
		$this->assertSame( Urls::get_subscribers_url(), $data['premium_analytics']['newsletter_subscribers_url'] );
	}
}
