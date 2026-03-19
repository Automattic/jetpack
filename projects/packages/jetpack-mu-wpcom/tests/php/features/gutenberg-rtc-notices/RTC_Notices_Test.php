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
	 * Clean up after each test.
	 */
	public function tear_down(): void {
		wp_delete_user( $this->user_id );
		remove_all_filters( 'wpcom_rtc_max_peers_per_room' );
		remove_all_filters( 'wpcom_rtc_max_clients_per_user' );
		parent::tear_down();
	}

	/**
	 * Tests that default max peers per room is 2.
	 */
	public function test_default_max_peers_per_room() {
		$this->assertSame( 2, wpcom_get_rtc_max_peers_per_room() );
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
		update_user_meta( $this->user_id, WP_REST_RTC_Notices::META_KEY, 'dismissed' );

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

		update_user_meta( $this->user_id, WP_REST_RTC_Notices::META_KEY, 'dismissed' );

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
	 * Tests that admin permission requires manage_options.
	 */
	public function test_admin_permission_requires_manage_options() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'rtc_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);

		$controller = new WP_REST_RTC_Notices();

		wp_set_current_user( $editor_id );
		$this->assertFalse( $controller->check_admin_permission() );

		wp_set_current_user( $this->user_id );
		$this->assertTrue( $controller->check_admin_permission() );

		wp_delete_user( $editor_id );
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
}
