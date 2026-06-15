<?php
/**
 * RTC Notices Tests.
 *
 * @package automattic/jetpack-rtc
 */

declare( strict_types = 1 );

use Automattic\Jetpack\RTC;
use Automattic\Jetpack\RTC\REST_RTC_Notices;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for RTC Notices feature.
 *
 * @covers \Automattic\Jetpack\RTC
 * @covers \Automattic\Jetpack\RTC\REST_RTC_Notices
 */
#[CoversClass( RTC::class )]
#[CoversClass( REST_RTC_Notices::class )]
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
		$wp_scripts = $this->original_wp_scripts;
		$wp_styles  = $this->original_wp_styles;

		wp_set_current_user( 0 );
		wp_delete_user( $this->user_id );

		remove_all_filters( 'jetpack_rtc_max_peers_per_room' );
		remove_all_filters( 'jetpack_rtc_enabled' );
		remove_all_filters( 'jetpack_rtc_enable_limit_notices' );

		delete_option( 'wp_enable_real_time_collaboration' );
		delete_option( 'wp_collaboration_enabled' );

		// Clean up any transients left by tests.
		delete_transient( REST_RTC_Notices::JOIN_REQUEST_OPTION . '_' . 999999 );

		// Reset the REST server so stale route registrations don't leak
		// into other test classes.
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Tests that default max peers per room is 3.
	 */
	public function test_default_max_peers_per_room() {
		$this->assertSame( 3, RTC::get_max_peers_per_room() );
	}

	/**
	 * Tests that max peers per room is filterable.
	 */
	public function test_filterable_max_peers_per_room() {
		add_filter(
			'jetpack_rtc_max_peers_per_room',
			function () {
				return 5;
			}
		);

		$this->assertSame( 5, RTC::get_max_peers_per_room() );
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

		$controller = new REST_RTC_Notices();

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

		$controller = new REST_RTC_Notices();

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
	 * Tests that join request rejects invalid post IDs.
	 */
	public function test_join_request_rejects_invalid_post_id() {
		$controller = new REST_RTC_Notices();

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

		$controller = new REST_RTC_Notices();

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

		$controller = new REST_RTC_Notices();
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
	 * Tests that REST routes are registered.
	 */
	public function test_rest_routes_registered() {
		$controller = new REST_RTC_Notices();
		$controller->register_routes();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-request', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-requests', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/rtc-notices/join-requests/clear', $routes );
	}

	/**
	 * Tests that plan owner returns false when no owner detection is available.
	 */
	public function test_plan_owner_returns_false_without_detection() {
		$this->assertFalse( RTC::is_plan_owner() );
	}

	/**
	 * Tests that plan owner uses Jetpack master_user when available.
	 */
	public function test_plan_owner_via_jetpack_master_user() {
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Jetpack_Options not available' );
		}

		// Set master_user to current user.
		\Jetpack_Options::update_option( 'master_user', $this->user_id );
		$this->assertTrue( RTC::is_plan_owner() );

		// Set master_user to a different user.
		\Jetpack_Options::update_option( 'master_user', 999999 );
		$this->assertFalse( RTC::is_plan_owner() );

		\Jetpack_Options::delete_option( 'master_user' );
	}

	// -------------------------------------------------------------------------
	// load_notices enqueue tests
	// -------------------------------------------------------------------------

	/**
	 * Reset scripts/styles to a fresh state for enqueue tests.
	 */
	private function reset_scripts(): void {
		global $wp_scripts, $wp_styles;
		$wp_scripts = new \WP_Scripts();
		$wp_styles  = new \WP_Styles();
	}

	/**
	 * Tests that load_notices skips when RTC is not enabled.
	 */
	public function test_load_notices_skips_when_rtc_disabled() {
		$this->reset_scripts();
		add_filter( 'jetpack_rtc_enabled', '__return_false' );

		RTC::load_notices();

		$this->assertFalse( wp_script_is( 'jetpack-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that load_notices enqueues when RTC is enabled.
	 */
	public function test_load_notices_enqueues_when_rtc_enabled() {
		$this->reset_scripts();
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( 'wp_collaboration_enabled', '1' );

		RTC::load_notices();

		$this->assertTrue( wp_script_is( 'jetpack-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that load_notices skips when RTC setting is off.
	 */
	public function test_load_notices_skips_when_rtc_setting_off() {
		$this->reset_scripts();
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( 'wp_enable_real_time_collaboration', '0' );
		update_option( 'wp_collaboration_enabled', '0' );

		RTC::load_notices();

		$this->assertFalse( wp_script_is( 'jetpack-rtc-notices', 'enqueued' ) );
	}

	/**
	 * Tests that the inline script includes expected config keys.
	 */
	public function test_load_notices_includes_inline_config() {
		$this->reset_scripts();
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( 'wp_collaboration_enabled', '1' );

		RTC::load_notices();

		global $wp_scripts;
		$handle = 'jetpack-rtc-notices';
		$extra  = $wp_scripts->registered[ $handle ]->extra['before'] ?? array();
		$inline = implode( "\n", array_filter( $extra ) );

		$this->assertStringContainsString( 'jetpackRtcNotices', $inline );
		$this->assertStringContainsString( '"assetsUrl"', $inline );
		$this->assertStringContainsString( '"isAdmin"', $inline );
		$this->assertStringContainsString( '"maxPeersPerRoom"', $inline );
		$this->assertStringContainsString( '"enableLimitNotices"', $inline );
	}
}
