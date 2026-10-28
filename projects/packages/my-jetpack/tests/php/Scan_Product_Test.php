<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Scan;
use Automattic\Jetpack\Redirect;
use PHPUnit\Framework\Attributes\CoversClass;
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
		parent::tearDown();
	}

	public function test_manage_url_is_jetpack_cloud_without_a_protect_page() {
		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-scan' ), Scan::get_manage_url() );
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
}
