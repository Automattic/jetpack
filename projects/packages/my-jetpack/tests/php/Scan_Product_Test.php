<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Scan;
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
		parent::tearDown();
	}

	public function test_post_checkout_url_is_the_scan_dashboard_with_jetpack() {
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertSame( Scan::get_manage_url(), Scan::get_post_checkout_url() );
	}

	public function test_post_checkout_url_is_empty_without_jetpack() {
		$this->assertNull( Scan::get_post_checkout_url() );
	}
}
