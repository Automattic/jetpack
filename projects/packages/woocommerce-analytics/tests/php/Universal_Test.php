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
}
