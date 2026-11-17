<?php
/**
 * Tests for the assets URL script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/assets-url.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_assets_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_assets_url_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_assets_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_assets_url_script_data' )]
class Assets_Url_Test extends BaseTestCase {

	/**
	 * Reset the request and filters.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_assets_url_script_data', 20 );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		parent::tear_down();
	}

	public function test_dashboard_gets_the_copied_images_url_beside_existing_script_data() {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
		configure_assets_url();

		$data = apply_filters( 'jetpack_admin_js_script_data', array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertStringEndsWith( '/build/images/', $data['premium_analytics']['assets_url'] );
		// The build sits beside `src/`, not in it.
		$this->assertStringNotContainsString( '/src/', $data['premium_analytics']['assets_url'] );
	}

	public function test_other_admin_pages_get_no_assets_url() {
		$_GET['page'] = 'my-jetpack';
		set_current_screen( 'toplevel_page_my-jetpack' );
		configure_assets_url();

		$this->assertSame( array(), apply_filters( 'jetpack_admin_js_script_data', array() ) );
	}
}
