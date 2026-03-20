<?php
/**
 * RTC Notices Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc-notices/gutenberg-rtc-notices.php';
// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc-notices/class-wp-rest-rtc-notices.php';
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for RTC Notices feature.
 *
 * @covers ::wpcom_get_rtc_max_peers_per_room
 * @covers ::wpcom_get_rtc_max_clients_per_user
 * @covers WP_REST_RTC_Notices
 */
#[CoversFunction( 'wpcom_get_rtc_max_peers_per_room' )]
#[CoversFunction( 'wpcom_get_rtc_max_clients_per_user' )]
#[CoversClass( WP_REST_RTC_Notices::class )]
class RTC_Notices_Test extends \WorDBless\BaseTestCase {

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'rtc_test_user',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );
	}

	/**
	 * Original WP_Scripts instance.
	 *
	 * @var \WP_Scripts|null
	 */
	private $original_wp_scripts;

	/**
	 * Original WP_Styles instance.
	 *
	 * @var \WP_Styles|null
	 */
	private $original_wp_styles;

	/**
	 * Set up before each test.
	 *
	 * @before
	 */
	#[Before]
	public function save_globals(): void {
		global $wp_scripts, $wp_styles;
		$this->original_wp_scripts = $wp_scripts;
		$this->original_wp_styles  = $wp_styles;
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down(): void {
		global $wp_scripts, $wp_styles;
		$wp_scripts = $this->original_wp_scripts; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_styles  = $this->original_wp_styles; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		wp_set_current_user( 0 );
		wp_delete_user( $this->user_id );

		remove_all_filters( 'wpcom_rtc_max_peers_per_room' );
		remove_all_filters( 'wpcom_rtc_max_clients_per_user' );
		remove_all_filters( 'wpcom_is_gutenberg_rtc_enabled' );
		remove_all_filters( 'wpcom_rtc_enable_limit_notices' );

		delete_option( 'wp_enable_real_time_collaboration' );
		delete_option( 'wp_collaboration_enabled' );

		// Clean up any user options and transients left by tests.
		delete_user_option( $this->user_id, WP_REST_RTC_Notices::OPTION_KEY );
		delete_transient( WP_REST_RTC_Notices::JOIN_REQUEST_OPTION . '_' . 999999 );

		parent::tear_down();
	}

	/**
	 * Tests that default max peers per room is 2.
	 */
	public function test_default_max_peers_per_room() {
		$this->assertSame( 3, wpcom_get_rtc_max_peers_per_room() );
	}

	/**
	 * Tests that max peers per room is filterable.
	 */
	public function test_filterable_max_peers_per_room() {
		add_filter(
			'wpcom_rtc_max_peers_per_room',
			function () {
				return 5;
			}
		);

		$this->assertSame( 5, wpcom_get_rtc_max_peers_per_room() );
	}

	/**
	 * Tests that default max clients per user is 2.
	 */
	public function test_default_max_clients_per_user() {
		$this->assertSame( 2, wpcom_get_rtc_max_clients_per_user() );
	}

	/**
	 * Tests that max clients per user is filterable.
	 */
	public function test_filterable_max_clients_per_user() {
		add_filter(
			'wpcom_rtc_max_clients_per_user',
			function () {
				return 3;
			}
		);

		$this->assertSame( 3, wpcom_get_rtc_max_clients_per_user() );
	}

	/**
	 * Tests that welcome notice is not dismissed by default.
	 */
	public function test_welcome_notice_not_dismissed_by_default() {
		$this->assertFalse( WP_REST_RTC_Notices::is_dismissed() );
	}

	/**
	 * Tests that welcome notice can be dismissed via user meta.
	 */
	public function test_welcome_notice_dismiss_persists() {
		update_user_option( $this->user_id, WP_REST_RTC_Notices::OPTION_KEY, 'dismissed' );

		$this->assertTrue( WP_REST_RTC_Notices::is_dismissed() );
	}

	/**
	 * Tests that welcome notice dismiss is per-user.
	 */
	public function test_welcome_notice_dismiss_is_per_user() {
		$other_user_id = wp_insert_user(
			array(
				'user_login' => 'rtc_test_user_2',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);

		update_user_option( $this->user_id, WP_REST_RTC_Notices::OPTION_KEY, 'dismissed' );

		wp_set_current_user( $other_user_id );
		$this->assertFalse( WP_REST_RTC_Notices::is_dismissed() );

		wp_set_current_user( $this->user_id );
		$this->assertTrue( WP_REST_RTC_Notices::is_dismissed() );

		wp_delete_user( $other_user_id );
	}

	/**
	 * Tests the dismiss REST endpoint.
	 */
	public function test_dismiss_rest_endpoint() {
		$controller = new WP_REST_RTC_Notices();
		$response   = $controller->dismiss_notice();
		$data       = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertTrue( WP_REST_RTC_Notices::is_dismissed() );
	}

	/**
	 * Tests the status REST endpoint.
	 */
	public function test_status_rest_endpoint() {
		$controller = new WP_REST_RTC_Notices();

		$response = $controller->get_status();
		$this->assertFalse( $response->get_data()['dismissed'] );

		$controller->dismiss_notice();

		$response = $controller->get_status();
		$this->assertTrue( $response->get_data()['dismissed'] );
	}

	/**
	 * Tests that join request can be recorded and retrieved.
	 */
	public function test_join_request_record_and_retrieve() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
			)
		);

		$controller = new WP_REST_RTC_Notices();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc-notices/join-request' );
		$request->set_param( 'post_id', $post_id );
		$response = $controller->record_join_request( $request );
		$this->assertTrue( $response->get_data()['success'] );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/rtc-notices/join-requests' );
		$request->set_param( 'post_id', $post_id );
		$response = $controller->get_join_requests( $request );
		$requests = $response->get_data()['requests'];

		$this->assertCount( 1, $requests );
		$this->assertSame( $this->user_id, $requests[0]['userId'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Tests that join requests can be cleared.
	 */
	public function test_clear_join_requests() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
			)
		);

		$controller = new WP_REST_RTC_Notices();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc-notices/join-request' );
		$request->set_param( 'post_id', $post_id );
		$controller->record_join_request( $request );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc-notices/join-requests/clear' );
		$request->set_param( 'post_id', $post_id );
		$controller->clear_join_requests( $request );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/rtc-notices/join-requests' );
		$request->set_param( 'post_id', $post_id );
		$response = $controller->get_join_requests( $request );
		$this->assertCount( 0, $response->get_data()['requests'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Tests that permission check requires login.
	 */
	public function test_permission_requires_login() {
		wp_set_current_user( 0 );
		$controller = new WP_REST_RTC_Notices();

		$this->assertFalse( $controller->check_permission() );
	}

	/**
	 * Tests that join request rejects invalid post IDs.
	 */
	public function test_join_request_rejects_invalid_post_id() {
		$controller = new WP_REST_RTC_Notices();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc-notices/join-request' );
		$request->set_param( 'post_id', 999999 );
		$result = $controller->check_edit_post_permission( $request );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'rest_post_invalid_id', $result->get_error_code() );
	}

	/**
	 * Tests that join request requires edit_post capability.
	 */
	public function test_join_request_requires_edit_post() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_author' => $this->user_id,
			)
		);

		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'rtc_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		$controller = new WP_REST_RTC_Notices();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc-notices/join-request' );
		$request->set_param( 'post_id', $post_id );

		// Subscriber cannot edit posts.
		wp_set_current_user( $subscriber_id );
		$result = $controller->check_edit_post_permission( $request );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );

		// Admin can edit posts.
		wp_set_current_user( $this->user_id );
		$result = $controller->check_edit_post_permission( $request );
		$this->assertTrue( $result );

		wp_delete_user( $subscriber_id );
		wp_delete_post( $post_id, true );
	}

	/**
	 * Tests admin edit post permission denies non-admins.
	 */
	public function test_admin_edit_post_permission_denies_non_admin() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
			)
		);

		$editor_id = wp_insert_user(
			array(
				'user_login' => 'rtc_editor_perm',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);

		$controller = new WP_REST_RTC_Notices();
		$request    = new WP_REST_Request( 'GET', '/wpcom/v2/rtc-notices/join-requests' );
		$request->set_param( 'post_id', $post_id );

		wp_set_current_user( $editor_id );
		$this->assertFalse( $controller->check_admin_edit_post_permission( $request ) );

		wp_set_current_user( $this->user_id );
		$this->assertTrue( $controller->check_admin_edit_post_permission( $request ) );

		wp_delete_user( $editor_id );
		wp_delete_post( $post_id, true );
	}

	/**
	 * Reset scripts/styles to a fresh state for enqueue tests.
	 */
	private function reset_scripts(): void {
		global $wp_scripts, $wp_styles;
		$wp_scripts = new \WP_Scripts(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_styles  = new \WP_Styles(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * Tests that enqueue skips when RTC is not enabled.
	 */
	public function test_enqueue_skips_when_rtc_disabled() {
		$this->reset_scripts();
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_false' );

		wpcom_enqueue_rtc_notices_assets();

		$this->assertFalse( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue skips when RTC setting is off.
	 */
	public function test_enqueue_skips_when_rtc_setting_off() {
		$this->reset_scripts();
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		// Explicitly set to '0' — deleting won't work because gutenberg-rtc.php
		// has a default_option filter that returns '1' when providers exist.
		update_option( 'wp_enable_real_time_collaboration', '0' );
		update_option( 'wp_collaboration_enabled', '0' );

		wpcom_enqueue_rtc_notices_assets();

		$this->assertFalse( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue works when RTC is enabled and old setting is on.
	 */
	public function test_enqueue_works_with_old_rtc_option() {
		$this->reset_scripts();
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		update_option( 'wp_enable_real_time_collaboration', '1' );

		wpcom_enqueue_rtc_notices_assets();

		$this->assertTrue( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue works when RTC is enabled and new setting is on.
	 */
	public function test_enqueue_works_with_new_rtc_option() {
		$this->reset_scripts();
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		update_option( 'wp_collaboration_enabled', '1' );

		wpcom_enqueue_rtc_notices_assets();

		$this->assertTrue( wp_script_is( 'jetpack-mu-wpcom-gutenberg-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that the inline script includes expected config keys.
	 */
	public function test_enqueue_includes_inline_config() {
		$this->reset_scripts();
		add_filter( 'wpcom_is_gutenberg_rtc_enabled', '__return_true' );
		update_option( 'wp_enable_real_time_collaboration', '1' );

		wpcom_enqueue_rtc_notices_assets();

		global $wp_scripts;
		$handle = 'jetpack-mu-wpcom-gutenberg-rtc-notices';
		$extra  = $wp_scripts->registered[ $handle ]->extra['before'] ?? array();
		$inline = implode( "\n", array_filter( $extra ) );

		$this->assertStringContainsString( 'wpcomRtcNotices', $inline );
		$this->assertStringContainsString( '"isAdmin"', $inline );
		$this->assertStringContainsString( '"welcomeDismissed"', $inline );
		$this->assertStringContainsString( '"maxPeersPerRoom"', $inline );
		$this->assertStringContainsString( '"maxClientsPerUser"', $inline );
		$this->assertStringContainsString( '"siteSlug"', $inline );
	}

	/**
	 * Tests that REST routes are registered.
	 */
	public function test_rest_routes_registered() {
		$controller = new WP_REST_RTC_Notices();
		$controller->register_routes();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/dismiss', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/status', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-request', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-requests', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-requests/clear', $routes );
	}
}
