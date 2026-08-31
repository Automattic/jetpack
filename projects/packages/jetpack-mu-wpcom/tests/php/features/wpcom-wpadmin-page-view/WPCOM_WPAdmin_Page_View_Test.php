<?php
/**
 * Tests for WPCom Tracking for WP Admin Page Views.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Wpadmin_Page_View;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

// Needed to load Class "WPCOMSH_Support_Session_Detect"
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-wpadmin-page-view/wpcom-wpadmin-page-view.php';

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class WPCOM_WPAdmin_Page_View_Test extends TestCase {
	/**
	 * Tests that the wpcom_nosara_track_admin_page_views function does not track admin page views for Automatticians.
	 *
	 * @dataProvider wpcom_nosara_track_admin_page_views_does_not_track_a11ns_provider
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool      $is_wpcom         Whether the site is a WordPress.com site.
	 * @param bool|null $is_automattician Whether the user is an Automattician.
	 * @param bool|null $is_network_admin Whether the user is a network admin.
	 */
	#[DataProvider( 'wpcom_nosara_track_admin_page_views_does_not_track_a11ns_provider' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_nosara_track_admin_page_views_does_not_track_a11ns(
		$is_wpcom,
		$is_automattician,
		$is_network_admin
	) {
		define( 'IS_WPCOM', $is_wpcom );
		$this->assertTrue( defined( 'IS_WPCOM' ), 'IS_WPCOM should be defined' );
		$this->assertSame( IS_WPCOM, $is_wpcom, 'IS_WPCOM should equal the provided value' );

		if ( ! defined( 'WP_NETWORK_ADMIN' ) ) {
			define( 'WP_NETWORK_ADMIN', $is_network_admin );
		}
		$this->assertTrue( defined( 'WP_NETWORK_ADMIN' ), 'WP_NETWORK_ADMIN should be defined' );
		$this->assertSame( WP_NETWORK_ADMIN, $is_network_admin, 'WP_NETWORK_ADMIN should equal the provided value' );

		Functions\stubs(
			array(
				'is_automattician' => $is_automattician,
			)
		);

		ob_start();
		wpcom_nosara_track_admin_page_views();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	/**
	 * Data provider for test_wpcom_nosara_track_admin_page_views_does_not_track_a11ns.
	 *
	 * @return array
	 */
	public static function wpcom_nosara_track_admin_page_views_does_not_track_a11ns_provider() {
		return array(
			array( true, true, null ),
			array( true, false, true ),
			array( false, null, null ),
		);
	}

	/**
	 * Tests that only a Location response header marks a request as having rendered no screen.
	 *
	 * @dataProvider wpcom_admin_screen_rendered_provider
	 *
	 * @param string[] $headers  Response headers, as returned by headers_list().
	 * @param bool     $expected Whether the request should count as a rendered screen.
	 */
	#[DataProvider( 'wpcom_admin_screen_rendered_provider' )]
	public function test_wpcom_admin_screen_rendered( $headers, $expected ) {
		$this->assertSame( $expected, wpcom_admin_screen_rendered( $headers ) );
	}

	/**
	 * Data provider for test_wpcom_admin_screen_rendered.
	 *
	 * PHP echoes the caller's casing back from header() and not every redirect goes through
	 * wp_redirect(), while matching the header name anywhere in the string would treat
	 * X-Content-Location as a redirect and drop real screens out of the denominator.
	 *
	 * The download and fragment cases each isolate one guard: export.php sends an attachment as
	 * text/html would otherwise be accepted, and async-upload.php sends text/plain.
	 *
	 * @return array
	 */
	public static function wpcom_admin_screen_rendered_provider() {
		return array(
			'rendered screen'      => array( array( 'Content-Type: text/html; charset=UTF-8', 'X-Frame-Options: SAMEORIGIN' ), true ),
			'headerless response'  => array( array(), true ),
			'wp_redirect'          => array( array( 'Content-Type: text/html; charset=UTF-8', 'Location: /wp-admin/edit.php' ), false ),
			'lowercased by caller' => array( array( 'location: /wp-admin/' ), false ),
			'location in a name'   => array( array( 'X-Content-Location: /wp-admin/' ), true ),
			'attachment download'  => array( array( 'Content-Type: text/html; charset=UTF-8', 'Content-Disposition: attachment; filename=export.xml' ), false ),
			'non-html fragment'    => array( array( 'Content-Type: text/plain; charset=UTF-8' ), false ),
		);
	}
}
