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
	 * Track page views with the WordPress.com identity, including local-only users' events.
	 *
	 * @dataProvider tracking_identity_provider
	 * @param bool       $is_wpcom          Whether this is a Simple site.
	 * @param int        $wpcom_user_id     The Atomic user's WordPress.com ID, or zero for a local-only user.
	 * @param array|null $wpcom_user_data   Cached WordPress.com user data.
	 * @param string     $expected_username The username sent to Tracks.
	 */
	#[DataProvider( 'tracking_identity_provider' )]
	public function test_page_view_tracking_identity( $is_wpcom, $wpcom_user_id, $wpcom_user_data, $expected_username ) {
		define( 'IS_WPCOM', $is_wpcom );
		define( 'IS_ATOMIC', ! $is_wpcom );
		define( 'WP_NETWORK_ADMIN', false );
		update_option( 'jetpack_options', array( 'id' => 123 ) );
		Functions\stubs(
			array(
				'is_automattician'                       => false,
				'_wpcom_get_current_blog_id'             => 123,
				'wpcomsh_get_wpcom_active_subscriptions' => array(),
				'wpcom_site_has_feature'                 => false,
			)
		);
		$user_id                 = wp_insert_user(
			array(
				'user_login' => 'tracking-test-user',
				'user_pass'  => 'test-password',
			)
		);
		$GLOBALS['current_user'] = get_userdata( $user_id );
		set_current_screen( 'dashboard' );
		if ( $wpcom_user_id ) {
			update_user_meta( $user_id, 'wpcom_user_id', $wpcom_user_id );
		}
		if ( null !== $wpcom_user_data ) {
			update_user_meta( $user_id, 'wpcom_user_data', (object) $wpcom_user_data );
		}
		if ( $is_wpcom ) {
			require_once ABSPATH . WPINC . '/class-wp-site.php';
			$GLOBALS['current_blog'] = new \WP_Site( (object) array( 'blog_id' => '123' ) );
			\Mockery::mock( 'alias:WPCOM_User' )->shouldReceive( 'get_types' )->andReturn( array( 'Paid' ) );
		}

		$expected_user_id = $is_wpcom ? $user_id : $wpcom_user_id;
		foreach (
			array(
				'wpcom_nosara_track_admin_page_views'  => 'wpcom_admin_page_view',
				'wpcom_track_customizer_from_frontend' => 'wpcom_customize_loaded_from_frontend',
			) as $callback => $event_name
		) {
			$output = '';
			ob_start();
			try {
				call_user_func( __NAMESPACE__ . '\\' . $callback );
				$output = (string) ob_get_contents();
			} finally {
				ob_end_clean();
			}
			$this->assertStringContainsString( "[ 'recordEvent', '$event_name',", $output );
			$this->assertStringContainsString( 'is_local_only_user: ' . ( 0 === $expected_user_id ? 'true' : 'false' ), $output );
			if ( $expected_user_id > 0 ) {
				$this->assertStringContainsString( "[ 'identifyUser', $expected_user_id, \"$expected_username\" ]", $output );
			} else {
				$this->assertStringNotContainsString( 'identifyUser', $output );
			}
		}
	}

	/**
	 * @return array Tracking identities for Simple and Atomic users.
	 */
	public static function tracking_identity_provider() {
		$wpcom_user_data = array(
			'ID'    => 456,
			'login' => 'wpcom-tracking-user',
		);
		$stale_user_data = array(
			'ID'    => 789,
			'login' => 'previous-wpcom-user',
		);
		return array(
			'Simple user'                   => array( true, 0, null, 'tracking-test-user' ),
			'Atomic connected user'         => array( false, 456, $wpcom_user_data, 'wpcom-tracking-user' ),
			'Atomic without cached user'    => array( false, 456, null, 'tracking-test-user' ),
			'Atomic with stale cached user' => array( false, 456, $stale_user_data, 'tracking-test-user' ),
			'Atomic local-only user'        => array( false, 0, null, 'tracking-test-user' ),
		);
	}

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
}
