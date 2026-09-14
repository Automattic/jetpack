<?php
/**
 * Unit tests for the Jetpack Forms payments prototype.
 *
 * Covers the parts that carry real risk even in a prototype: order tokens
 * (signature, expiry, tampering) and the awaiting → paid state machine,
 * including replay.
 *
 * To run: from packages/forms, `composer test-php`.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Payments;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Order, Payment_Status and Payments.
 */
#[CoversClass( Order::class )]
#[CoversClass( Payment_Status::class )]
#[CoversClass( Payments::class )]
class Payments_Test extends BaseTestCase {

	/**
	 * Create a feedback post to hang payments off.
	 *
	 * @return int
	 */
	private function make_entry() {
		return wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Test response',
			)
		);
	}

	public function test_minted_token_verifies_and_round_trips_its_payload() {
		$token = Order::mint(
			array(
				'entry_id' => 123,
				'amount'   => 2500,
				'currency' => 'USD',
			)
		);

		$payload = Order::verify( $token );

		$this->assertIsArray( $payload );
		$this->assertSame( 123, $payload['entry_id'] );
		$this->assertSame( 2500, $payload['amount'] );
		$this->assertSame( 'USD', $payload['currency'] );
	}

	public function test_tampered_amount_fails_verification() {
		$token = Order::mint(
			array(
				'entry_id' => 1,
				'amount'   => 2500,
				'currency' => 'USD',
			)
		);

		list( $body, $signature ) = explode( '.', $token );

		$payload           = json_decode( base64_decode( strtr( $body, '-_', '+/' ) ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$payload['amount'] = 1;

		$forged_body = rtrim( strtr( base64_encode( (string) wp_json_encode( $payload ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		$result = Order::verify( $forged_body . '.' . $signature );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'invalid_order_signature', $result->get_error_code() );
	}

	public function test_malformed_token_is_rejected() {
		$this->assertTrue( is_wp_error( Order::verify( 'not-a-token' ) ) );
		$this->assertTrue( is_wp_error( Order::verify( 'too.many.parts' ) ) );
	}

	public function test_entry_moves_from_awaiting_to_paid_once_only() {
		$entry_id = $this->make_entry();

		Payment_Status::start( $entry_id, 2500, 'USD', 'token' );

		$this->assertTrue( Payment_Status::is_awaiting( $entry_id ) );
		$this->assertTrue( Payment_Status::mark_paid( $entry_id, 'order_1' ) );

		$record = Payment_Status::get( $entry_id );
		$this->assertIsArray( $record );
		$this->assertSame( 'paid', $record['status'] );
		$this->assertSame( 'order_1', $record['order_id'] );

		// Replaying the same order must not re-mark it, which is what makes the
		// order token effectively single-use.
		$this->assertFalse( Payment_Status::mark_paid( $entry_id, 'order_2' ) );

		$replayed = Payment_Status::get( $entry_id );
		$this->assertIsArray( $replayed );
		$this->assertSame( 'order_1', $replayed['order_id'] );
	}

	public function test_paid_entries_are_never_marked_verified_in_the_prototype() {
		$entry_id = $this->make_entry();

		Payment_Status::start( $entry_id, 2500, 'USD', 'token' );
		Payment_Status::mark_paid( $entry_id, 'order_1' );

		$record = Payment_Status::get( $entry_id );
		$this->assertIsArray( $record );
		$this->assertFalse( $record['verified'] );
	}

	public function test_owner_notification_is_held_until_payment_completes() {
		$entry_id = $this->make_entry();

		Payment_Status::start( $entry_id, 2500, 'USD', 'token' );
		Payment_Status::defer_notification( $entry_id, 'owner@example.com', 'New order', 'Body', '' );

		$this->assertNotEmpty( get_post_meta( $entry_id, Payment_Status::PENDING_EMAIL_META_KEY, true ) );

		$sent = array();
		add_filter(
			'pre_wp_mail',
			function ( $return, $atts ) use ( &$sent ) {
				$sent[] = $atts;
				return true;
			},
			10,
			2
		);

		Payment_Status::mark_paid( $entry_id, 'order_1' );

		$this->assertCount( 1, $sent );
		$this->assertSame( 'New order', reset( $sent )['subject'] );
		$this->assertSame( '', get_post_meta( $entry_id, Payment_Status::PENDING_EMAIL_META_KEY, true ) );
	}

	public function test_fixed_amount_resolves_to_minor_units() {
		$settings = array(
			'currency'    => 'USD',
			'amountMode'  => 'fixed',
			'amount'      => 25.5,
			'amountField' => '',
		);

		$this->assertSame( 2550, Payments::resolve_amount( $settings, array() ) );
	}

	public function test_buyer_amount_is_read_from_the_named_field() {
		$settings = array(
			'currency'    => 'USD',
			'amountMode'  => 'buyer',
			'amount'      => 0,
			'amountField' => 'Amount',
		);

		$this->assertSame( 4000, Payments::resolve_amount( $settings, array( 'Amount' => '$40.00' ) ) );
	}

	public function test_amount_below_the_currency_minimum_is_refused() {
		$settings = array(
			'currency'    => 'USD',
			'amountMode'  => 'fixed',
			'amount'      => 0.10,
			'amountField' => '',
		);

		$this->assertNull( Payments::resolve_amount( $settings, array() ) );
	}

	public function test_unresolvable_buyer_amount_returns_null() {
		$settings = array(
			'currency'    => 'USD',
			'amountMode'  => 'buyer',
			'amount'      => 0,
			'amountField' => 'Amount',
		);

		$this->assertNull( Payments::resolve_amount( $settings, array( 'Amount' => 'no digits here' ) ) );
	}
}
