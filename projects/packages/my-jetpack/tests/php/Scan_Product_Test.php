<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Scan;
use Automattic\Jetpack\Protect_Status\Plan;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\My_Jetpack\Products\Scan
 */
#[CoversClass( Scan::class )]
class Scan_Product_Test extends TestCase {

	/**
	 * Install the mock Jetpack plugin.
	 */
	public function setUp(): void {
		parent::setUp();
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Deactivate the mock plugin.
	 */
	public function tearDown(): void {
		deactivate_plugins( 'jetpack/jetpack.php' );
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		delete_option( 'jetpack_site_products' );
		Constants::clear_constants();
		StatusCache::clear();
		parent::tearDown();
	}

	/**
	 * Without a Protect page, threats are managed on the host's dashboard: WordPress.com's on WoA, Jetpack Cloud elsewhere.
	 *
	 * @dataProvider provide_scan_dashboards
	 *
	 * @param bool $woa Whether the site is on WoA.
	 */
	#[DataProvider( 'provide_scan_dashboards' )]
	public function test_manage_url_without_a_protect_page( $woa ) {
		if ( $woa ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
			StatusCache::clear();
		}

		$this->assertSame( Redirect::get_url( $woa ? 'my-jetpack-manage-scan-wpcom' : 'my-jetpack-manage-scan' ), Scan::get_manage_url() );
	}

	/**
	 * Data provider for test_manage_url_without_a_protect_page.
	 *
	 * @return array
	 */
	public static function provide_scan_dashboards() {
		return array(
			'self-hosted' => array( false ),
			'WoA'         => array( true ),
		);
	}

	public function test_manage_url_is_the_protect_page_once_the_dashboard_loads() {
		do_action( 'jetpack_protect_dashboard_initialized' );

		$this->assertSame( admin_url( 'admin.php?page=jetpack-protect' ), Scan::get_manage_url() );
	}

	public function test_post_checkout_url_is_the_scan_dashboard_with_jetpack() {
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertSame( Scan::get_manage_url(), Scan::get_post_checkout_url() );
	}

	public function test_post_checkout_url_is_empty_without_jetpack() {
		$this->assertNull( Scan::get_post_checkout_url() );
	}

	public function test_a_real_time_scan_purchase_counts_on_the_protect_page_and_in_my_jetpack() {
		$slug = 'jetpack_scan_realtime_monthly';
		update_option( 'jetpack_site_products', array( array( 'product_slug' => $slug ) ) );
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array( (object) array( 'product_slug' => $slug ) ), HOUR_IN_SECONDS );

		$this->assertTrue( Plan::has_required_plan() );
		$this->assertSame( $slug, Scan::get_paid_plan_purchase_for_product()->product_slug ?? null );
	}
}
