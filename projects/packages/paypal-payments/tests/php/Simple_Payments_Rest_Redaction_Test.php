<?php
/**
 * Tests for the spay_email REST redaction filter.
 *
 * Guards against the SHILL-1889 regression: the seller's PayPal email
 * must not leak through public REST responses, but must remain available
 * to authenticated editors so the block editor's read/write round-trip
 * keeps working (incident: 2026-04-15 misrouted Simple Payments).
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\Paypal_Payments;

use WorDBless\BaseTestCase;
use WP_REST_Response;

/**
 * Class Simple_Payments_Rest_Redaction_Test
 */
class Simple_Payments_Rest_Redaction_Test extends BaseTestCase {

	/**
	 * The Simple_Payments singleton.
	 *
	 * @var Simple_Payments
	 */
	private $simple_payments;

	/**
	 * A product post ID.
	 *
	 * @var int
	 */
	private $product_id;

	/**
	 * Set up before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		if ( ! post_type_exists( Simple_Payments::$post_type_product ) ) {
			register_post_type(
				Simple_Payments::$post_type_product,
				array(
					'public'       => false,
					'show_in_rest' => true,
				)
			);
		}

		$this->simple_payments = Simple_Payments::get_instance();

		$this->product_id = wp_insert_post(
			array(
				'post_title'  => 'Test product',
				'post_status' => 'publish',
				'post_type'   => Simple_Payments::$post_type_product,
			)
		);
		update_post_meta( $this->product_id, 'spay_email', 'seller@example.com' );
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Build a REST response that mirrors what the default posts controller
	 * produces for a jp_pay_product entity (with meta included).
	 */
	private function build_response_with_email() {
		return new WP_REST_Response(
			array(
				'id'    => $this->product_id,
				'title' => array( 'raw' => 'Test product' ),
				'meta'  => array(
					'spay_email'    => 'seller@example.com',
					'spay_currency' => 'USD',
					'spay_price'    => '9.99',
				),
			)
		);
	}

	/**
	 * Unauthenticated callers must not see spay_email — this is the SHILL-1889 case.
	 */
	public function test_unauthenticated_request_strips_spay_email() {
		wp_set_current_user( 0 );

		$response = $this->simple_payments->redact_spay_email_for_unauthorized(
			$this->build_response_with_email(),
			get_post( $this->product_id )
		);

		$data = $response->get_data();
		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayNotHasKey( 'spay_email', $data['meta'], 'spay_email must not leak to unauthenticated callers' );
		// Sibling meta keys must survive.
		$this->assertSame( 'USD', $data['meta']['spay_currency'] );
		$this->assertSame( '9.99', $data['meta']['spay_price'] );
	}

	/**
	 * Subscribers (read-only) must not see spay_email either.
	 */
	public function test_subscriber_request_strips_spay_email() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber',
				'user_pass'  => wp_hash_password( 'password' ),
				'user_email' => 'subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$response = $this->simple_payments->redact_spay_email_for_unauthorized(
			$this->build_response_with_email(),
			get_post( $this->product_id )
		);

		$data = $response->get_data();
		$this->assertArrayNotHasKey( 'spay_email', $data['meta'] );
	}

	/**
	 * Editors (the block-editor write path) MUST keep seeing spay_email so the
	 * round-trip save doesn't wipe the field — this is the regression guard
	 * for the 2026-04 incident.
	 */
	public function test_editor_request_preserves_spay_email() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'editor',
				'user_pass'  => wp_hash_password( 'password' ),
				'user_email' => 'editor@example.com',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $editor_id );

		$response = $this->simple_payments->redact_spay_email_for_unauthorized(
			$this->build_response_with_email(),
			get_post( $this->product_id )
		);

		$data = $response->get_data();
		$this->assertSame( 'seller@example.com', $data['meta']['spay_email'] );
	}

	/**
	 * Administrators see spay_email too.
	 */
	public function test_admin_request_preserves_spay_email() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => wp_hash_password( 'password' ),
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$response = $this->simple_payments->redact_spay_email_for_unauthorized(
			$this->build_response_with_email(),
			get_post( $this->product_id )
		);

		$data = $response->get_data();
		$this->assertSame( 'seller@example.com', $data['meta']['spay_email'] );
	}

	/**
	 * A response without a meta key must pass through untouched.
	 */
	public function test_response_without_meta_is_unchanged() {
		wp_set_current_user( 0 );

		$payload  = array(
			'id'    => $this->product_id,
			'title' => 'no meta',
		);
		$response = new WP_REST_Response( $payload );
		$result   = $this->simple_payments->redact_spay_email_for_unauthorized( $response, get_post( $this->product_id ) );

		$this->assertSame( $payload, $result->get_data() );
	}

	/**
	 * Defensive guard: non-response/non-post inputs are returned as-is.
	 */
	public function test_non_response_input_returned_unchanged() {
		$not_a_response = 'string instead of response';
		$result         = $this->simple_payments->redact_spay_email_for_unauthorized( $not_a_response, get_post( $this->product_id ) );

		$this->assertSame( $not_a_response, $result );
	}
}
