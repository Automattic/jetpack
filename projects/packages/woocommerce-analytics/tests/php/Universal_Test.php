<?php
/**
 * Tests for the Universal class.
 *
 * @package automattic/woocommerce-analytics
 */

namespace Automattic\Woocommerce_Analytics;

use WC_Order;
use WorDBless\BaseTestCase;

/**
 * Tests for the Universal class.
 */
class Universal_Test extends BaseTestCase {

	/**
	 * Reset global mocks before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		global $wc_get_order_calls, $wc_get_order_mock_return;
		$wc_get_order_calls       = array();
		$wc_get_order_mock_return = false;
	}

	/**
	 * Helper method to set up a mock session cookie with a session ID.
	 * The cookie name matches the one used in get_js_session_id() method.
	 *
	 * @param string $session_id The session ID to set in the cookie.
	 */
	private function set_session_cookie( $session_id ) {
		$_COOKIE['woocommerceanalytics_session'] = rawurlencode(
			wp_json_encode(
				array(
					'session_id' => $session_id,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
	}

	/**
	 * Helper method to clear the session cookie.
	 */
	private function clear_session_cookie() {
		unset( $_COOKIE['woocommerceanalytics_session'] );
	}

	/**
	 * Test that order_process calls wc_get_order with an integer order ID.
	 */
	public function test_order_process_handles_integer_order_id(): void {
		global $wc_get_order_calls, $wc_get_order_mock_return;

		// Set up mock to return false (order not found).
		$wc_get_order_mock_return = false;

		$universal = new Universal();
		$universal->order_process( 12345 );

		$this->assertCount( 1, $wc_get_order_calls, 'wc_get_order should be called once.' );
		$this->assertSame( 12345, $wc_get_order_calls[0], 'wc_get_order should receive the integer order ID.' );
	}

	/**
	 * Test that order_process calls wc_get_order with a string order ID.
	 */
	public function test_order_process_handles_string_order_id(): void {
		global $wc_get_order_calls, $wc_get_order_mock_return;

		// Set up mock to return false (order not found).
		$wc_get_order_mock_return = false;

		$universal = new Universal();
		$universal->order_process( '12345' );

		$this->assertCount( 1, $wc_get_order_calls, 'wc_get_order should be called once.' );
		$this->assertSame( '12345', $wc_get_order_calls[0], 'wc_get_order should receive the string order ID.' );
	}

	/**
	 * Test that order_process calls wc_get_order with a WC_Order object.
	 */
	public function test_order_process_handles_wc_order_object(): void {
		global $wc_get_order_calls, $wc_get_order_mock_return;

		// Set up mock to return false (order not found).
		$wc_get_order_mock_return = false;

		$order = new WC_Order();

		$universal = new Universal();
		$universal->order_process( $order );

		$this->assertCount( 1, $wc_get_order_calls, 'wc_get_order should be called once.' );
		$this->assertSame( $order, $wc_get_order_calls[0], 'wc_get_order should receive the WC_Order object.' );
	}

	/**
	 * Test that order_process returns early when wc_get_order returns false.
	 */
	public function test_order_process_returns_early_when_order_not_found(): void {
		global $wc_get_order_mock_return;

		// Set up mock to return false.
		$wc_get_order_mock_return = false;

		$universal = new Universal();
		$universal->order_process( 12345 );

		// If we get here without errors, the method completed without processing a non-existent order.
		$this->assertTrue( true, 'order_process should handle a missing order without throwing an exception.' );
	}

	/**
	 * Test that reset_checkout_tracking_state clears the session flag.
	 */
	public function test_reset_checkout_tracking_state_clears_session(): void {
		$session = new \WC_Session();
		$session->set( Universal::CHECKOUT_TRACKED_KEY, true );

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		$universal = new Universal();
		$universal->reset_checkout_tracking_state();

		$this->assertFalse(
			$session->get( Universal::CHECKOUT_TRACKED_KEY ),
			'reset_checkout_tracking_state should set the tracked key to false.'
		);

		// Clean up.
		reset_wc_mock_instance();
	}

	/**
	 * Test that reset_checkout_tracking_state works when session is not available.
	 */
	public function test_reset_checkout_tracking_state_handles_null_session(): void {
		// Create a mock WC instance with null session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = null;
		set_wc_mock_instance( $wc_mock );

		$universal = new Universal();

		// Should not throw an exception.
		$universal->reset_checkout_tracking_state();
		$this->assertTrue( true, 'reset_checkout_tracking_state should handle null session without throwing an exception.' );

		// Clean up.
		reset_wc_mock_instance();
	}

	/**
	 * Test that checkout tracking session keys are defined correctly.
	 */
	public function test_checkout_session_keys_are_defined(): void {
		$this->assertSame(
			'wca_checkout_tracked',
			Universal::CHECKOUT_TRACKED_KEY,
			'CHECKOUT_TRACKED_KEY should be defined correctly.'
		);
		$this->assertSame(
			'wca_checkout_session_id',
			Universal::CHECKOUT_SESSION_ID_KEY,
			'CHECKOUT_SESSION_ID_KEY should be defined correctly.'
		);
	}

	/**
	 * Test that first checkout should be tracked.
	 */
	public function test_first_checkout_should_track(): void {
		$session = new \WC_Session();

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		$universal = new Universal();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// First checkout - should return true.
		$result = $method->invoke( $universal, $session );
		$this->assertTrue( $result, 'First checkout should be tracked.' );

		// Clean up.
		reset_wc_mock_instance();
	}

	/**
	 * Test that duplicate checkout with same cart state should not track.
	 */
	public function test_duplicate_checkout_same_cart_should_not_track(): void {
		$session = new \WC_Session();
		$session->set( Universal::CHECKOUT_TRACKED_KEY, true );

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		$universal = new Universal();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// Duplicate checkout - should return false.
		$result = $method->invoke( $universal, $session );
		$this->assertFalse( $result, 'Duplicate checkout with same cart state should not be tracked.' );

		// Clean up.
		reset_wc_mock_instance();
	}

	/**
	 * Test that checkout after cart modification should track.
	 */
	public function test_checkout_after_cart_modification_should_track(): void {
		$session = new \WC_Session();
		$session->set( Universal::CHECKOUT_TRACKED_KEY, true );

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		$universal = new Universal();

		// Simulate cart modification by resetting the tracking state.
		$universal->reset_checkout_tracking_state();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// After cart modification - should return true.
		$result = $method->invoke( $universal, $session );
		$this->assertTrue( $result, 'Checkout after cart modification should be tracked.' );

		// Clean up.
		reset_wc_mock_instance();
	}

	/**
	 * Test that checkout with different JS session ID should track.
	 */
	public function test_checkout_with_different_session_id_should_track(): void {
		$session = new \WC_Session();
		$session->set( Universal::CHECKOUT_TRACKED_KEY, true );
		$session->set( Universal::CHECKOUT_SESSION_ID_KEY, 'old-session-id' );

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		// Mock the cookie with a new session ID.
		$this->set_session_cookie( 'new-session-id' );

		$universal = new Universal();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// With different session ID - should return true.
		$result = $method->invoke( $universal, $session );
		$this->assertTrue( $result, 'Checkout with different JS session ID should be tracked.' );

		// Clean up.
		$this->clear_session_cookie();
		reset_wc_mock_instance();
	}

	/**
	 * Test that checkout with same JS session ID should not track.
	 */
	public function test_checkout_with_same_session_id_should_not_track(): void {
		$session = new \WC_Session();
		$session->set( Universal::CHECKOUT_TRACKED_KEY, true );
		$session->set( Universal::CHECKOUT_SESSION_ID_KEY, 'same-session-id' );

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		// Mock the cookie with the same session ID.
		$this->set_session_cookie( 'same-session-id' );

		$universal = new Universal();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// With same session ID - should return false.
		$result = $method->invoke( $universal, $session );
		$this->assertFalse( $result, 'Checkout with same JS session ID should not be tracked.' );

		// Clean up.
		$this->clear_session_cookie();
		reset_wc_mock_instance();
	}

	/**
	 * Test that mark_checkout_tracked stores the session ID.
	 */
	public function test_mark_checkout_tracked_stores_session_id(): void {
		$session = new \WC_Session();

		// Create a mock WC instance with the session.
		$wc_mock          = new \stdClass();
		$wc_mock->session = $session;
		set_wc_mock_instance( $wc_mock );

		// Mock the cookie with a session ID.
		$this->set_session_cookie( 'test-session-id' );

		$universal = new Universal();

		// Use reflection to test the private mark_checkout_tracked method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'mark_checkout_tracked' );
		$method->setAccessible( true );

		// Mark checkout as tracked.
		$method->invoke( $universal, $session );

		// Verify the session was marked as tracked.
		$this->assertTrue(
			$session->get( Universal::CHECKOUT_TRACKED_KEY ),
			'Session should be marked as tracked.'
		);

		// Verify the session ID was stored.
		$this->assertSame(
			'test-session-id',
			$session->get( Universal::CHECKOUT_SESSION_ID_KEY ),
			'Session ID should be stored.'
		);

		// Clean up.
		$this->clear_session_cookie();
		reset_wc_mock_instance();
	}

	/**
	 * Test that mark_checkout_tracked handles null session gracefully.
	 */
	public function test_mark_checkout_tracked_handles_null_session(): void {
		$this->expectNotToPerformAssertions();

		$universal = new Universal();

		// Use reflection to test the private mark_checkout_tracked method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'mark_checkout_tracked' );
		$method->setAccessible( true );

		// Should not throw an exception with null session.
		$method->invoke( $universal, null );
	}

	/**
	 * Test that should_track_checkout handles null session.
	 */
	public function test_should_track_checkout_handles_null_session(): void {
		$universal = new Universal();

		// Use reflection to test the private should_track_checkout method.
		$reflection = new \ReflectionClass( $universal );
		$method     = $reflection->getMethod( 'should_track_checkout' );
		$method->setAccessible( true );

		// With null session - should return true (safe to track).
		$result = $method->invoke( $universal, null );
		$this->assertTrue( $result, 'should_track_checkout should return true with null session.' );
	}
}
