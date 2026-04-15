<?php
/**
 * Admin Notifications Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

/**
 * Tests for admin notification lib functions.
 */
class Admin_Notifications_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tests that bell notification no-ops when notes_send_callback is unavailable
	 * and no Jetpack site ID is set.
	 */
	public function test_bell_notification_noop_without_notes_function_or_site_id() {
		// notes_send_callback does not exist in this test environment,
		// and no Jetpack site ID is configured.
		// Should not throw — gracefully skips.
		\Jetpack_Options::delete_option( 'id' );
		wpcom_send_bell_notification( 1, 'test_type', array( 'key' => 'value' ), 'dedup-1' );
		$this->assertTrue( true );
	}

	/**
	 * Tests that bell notification calls the wpcom API when notes_send_callback
	 * is unavailable but a Jetpack site ID is set (WoW/Atomic path).
	 */
	public function test_bell_notification_calls_wpcom_api_on_wow() {
		if ( ! class_exists( Client::class ) ) {
			$this->markTestSkipped( 'Jetpack Connection Client not available' );
		}

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'bell_test_user',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
		\Jetpack_Options::update_option( 'id', 12345 );

		// Hook into pre_http_request to capture the outgoing request.
		$captured = null;
		$filter   = function ( $preempt, $args, $url ) use ( &$captured ) {
			$captured = array(
				'url'  => $url,
				'args' => $args,
			);
			// Short-circuit the HTTP request.
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => '{"success":true}',
			);
		};
		add_filter( 'pre_http_request', $filter, 10, 3 );

		wpcom_send_bell_notification(
			42,
			'rtc_collaborator_blocked',
			array( 'post_id' => 99 ),
			'dedup-key-1'
		);

		remove_filter( 'pre_http_request', $filter );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		$this->assertNotNull( $captured, 'Expected an HTTP request to be made' );
		$this->assertStringContainsString( '/sites/12345/site-notifications', $captured['url'] );

		$body = json_decode( $captured['args']['body'], true );
		$this->assertSame( 42, $body['recipient_id'] );
		$this->assertSame( 'rtc_collaborator_blocked', $body['type'] );
		$this->assertSame( array( 'post_id' => 99 ), $body['data'] );
		$this->assertSame( 'dedup-key-1', $body['dedup_key'] );
	}
}
