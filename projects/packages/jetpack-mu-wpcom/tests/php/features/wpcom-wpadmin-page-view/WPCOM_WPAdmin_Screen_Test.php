<?php
/**
 * Tests for the server-side wpcom_admin_screen Tracks event.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Wpadmin_Page_View;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

// Needed to load Class "WPCOMSH_Support_Session_Detect"
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-wpadmin-page-view/wpcom-wpadmin-page-view.php';

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class WPCOM_WPAdmin_Screen_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up a logged-in user and the dashboard screen.
	 */
	private function login_and_set_screen( $screen_id = 'dashboard' ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test@example.com',
			)
		);
		wp_set_current_user( $user_id );
		set_current_screen( $screen_id );

		return get_current_screen();
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_builds_props_for_a_simple_site_screen() {
		define( 'IS_WPCOM', true );
		define( 'WP_NETWORK_ADMIN', false );
		Functions\stubs( array( 'is_automattician' => false ) );

		$props = wpcom_get_admin_screen_event_props( $this->login_and_set_screen( 'edit-post' ) );

		$this->assertSame( 'edit-post', $props['screen_id'] );
		$this->assertSame( 'false', $props['is_block_editor'] );
		$this->assertSame( 'simple', $props['platform'] );
		$this->assertSame( 'wp-admin', $props['source'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_builds_props_for_an_atomic_site_screen() {
		define( 'IS_WPCOM', false );

		$props = wpcom_get_admin_screen_event_props( $this->login_and_set_screen() );

		$this->assertSame( 'dashboard', $props['screen_id'] );
		$this->assertSame( 'atomic', $props['platform'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_does_not_track_automatticians() {
		define( 'IS_WPCOM', true );
		define( 'WP_NETWORK_ADMIN', false );
		Functions\stubs( array( 'is_automattician' => true ) );

		$this->assertNull( wpcom_get_admin_screen_event_props( $this->login_and_set_screen() ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_does_not_track_logged_out_requests() {
		define( 'IS_WPCOM', false );
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		$this->assertNull( wpcom_get_admin_screen_event_props( get_current_screen() ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_does_not_track_without_a_screen() {
		define( 'IS_WPCOM', false );

		$this->assertNull( wpcom_get_admin_screen_event_props( null ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_be_disabled_with_a_filter() {
		define( 'IS_WPCOM', false );
		add_filter( 'wpcom_admin_screen_tracking_enabled', '__return_false' );

		$this->assertNull( wpcom_get_admin_screen_event_props( $this->login_and_set_screen() ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_capture_defers_recording_to_shutdown() {
		define( 'IS_WPCOM', false );

		wpcom_capture_admin_screen( $this->login_and_set_screen() );

		$this->assertNotFalse( has_action( 'shutdown' ) );
	}
}
