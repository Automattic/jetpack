<?php
/**
 * Tests for the page-scoping predicate that gates wp-build polyfill
 * registration. The polyfills force-replace core script handles
 * (notably `wp-private-apis`) on `wp_default_scripts`, so registration
 * must be confined to the Scan admin page and never run on other admin
 * pages such as the block editor.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Jetpack_Scan::is_scan_admin_request().
 *
 * @covers \Automattic\Jetpack\Scan_Page\Jetpack_Scan
 */
#[CoversClass( Jetpack_Scan::class )]
class Jetpack_Scan_Page_Request_Test extends TestCase {

	/**
	 * Reset request and screen globals touched by these tests so a stuck
	 * `$_GET` / screen from one case can't leak into the next.
	 */
	protected function tearDown(): void {
		unset( $_GET['page'] );
		unset( $GLOBALS['current_screen'] );
		parent::tearDown();
	}

	/**
	 * The Scan page slug in wp-admin is recognized as a Scan admin request.
	 */
	public function test_is_scan_admin_request_true_for_scan_page() {
		set_current_screen( 'toplevel_page_jetpack-scan' );
		$_GET['page'] = 'jetpack-scan';

		$this->assertTrue( Jetpack_Scan::is_scan_admin_request() );
	}

	/**
	 * Any other admin page is not a Scan admin request, so the polyfills
	 * (which force-replace core handles) must not load there.
	 */
	public function test_is_scan_admin_request_false_for_other_admin_page() {
		set_current_screen( 'edit-post' );
		$_GET['page'] = 'some-other-plugin';

		$this->assertFalse( Jetpack_Scan::is_scan_admin_request() );
	}

	/**
	 * An admin request with no `page` parameter is not a Scan admin request.
	 */
	public function test_is_scan_admin_request_false_when_no_page_param() {
		set_current_screen( 'edit-post' );
		unset( $_GET['page'] );

		$this->assertFalse( Jetpack_Scan::is_scan_admin_request() );
	}

	/**
	 * A front-end request carrying the Scan slug is not a Scan admin request.
	 */
	public function test_is_scan_admin_request_false_on_front_end() {
		set_current_screen( 'front' );
		$_GET['page'] = 'jetpack-scan';

		$this->assertFalse( Jetpack_Scan::is_scan_admin_request() );
	}
}
