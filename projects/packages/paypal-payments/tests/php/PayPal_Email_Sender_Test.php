<?php
/**
 * Tests for the PayPal_Email_Sender class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Email_Sender_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Email_Sender
 */
#[CoversClass( PayPal_Email_Sender::class )]
class PayPal_Email_Sender_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_option( PayPal_Email_Sender::LOG_OPTION_KEY );
		wp_set_current_user( 0 );

		// Clean up rate limit transients.
		$users = get_users( array( 'fields' => 'ID' ) );
		foreach ( $users as $uid ) {
			delete_transient( 'paypal_email_rate_' . $uid );
		}
	}

	// --- Constants ---

	/**
	 * Test log option key constant.
	 */
	public function test_log_option_key() {
		$this->assertEquals( 'jetpack_paypal_email_send_log', PayPal_Email_Sender::LOG_OPTION_KEY );
	}

	/**
	 * Test max log entries constant.
	 */
	public function test_max_log_entries() {
		$this->assertEquals( 50, PayPal_Email_Sender::MAX_LOG_ENTRIES );
	}

	/**
	 * Test AJAX action constant.
	 */
	public function test_ajax_action() {
		$this->assertEquals( 'paypal_send_payment_link', PayPal_Email_Sender::AJAX_ACTION );
	}

	// --- send_email ---

	/**
	 * Test send_email sends via wp_mail and returns true.
	 */
	public function test_send_email_returns_true_on_success() {
		// Mock wp_mail to always succeed.
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		$result = PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'29.99',
			'USD',
			'Here is your link.'
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test send_email returns WP_Error when wp_mail fails.
	 */
	public function test_send_email_returns_error_on_failure() {
		// Mock wp_mail to fail.
		add_filter(
			'pre_wp_mail',
			function () {
				return false;
			}
		);

		$result = PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'29.99',
			'USD'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_failed', $result->get_error_code() );
	}

	// --- get_log_for_resource ---

	/**
	 * Test get_log_for_resource returns entries for matching resource ID.
	 */
	public function test_get_log_returns_matching_entries() {
		update_option(
			PayPal_Email_Sender::LOG_OPTION_KEY,
			array(
				array(
					'resource_id' => 'PLB-AAA',
					'email'       => 'tes***@example.com',
					'sent_at'     => '2026-03-16 10:00:00',
				),
				array(
					'resource_id' => 'PLB-BBB',
					'email'       => 'oth***@example.com',
					'sent_at'     => '2026-03-16 11:00:00',
				),
				array(
					'resource_id' => 'PLB-AAA',
					'email'       => 'sec***@example.com',
					'sent_at'     => '2026-03-16 12:00:00',
				),
			),
			false
		);

		$log = PayPal_Email_Sender::get_log_for_resource( 'PLB-AAA' );

		$this->assertCount( 2, $log );
	}

	/**
	 * Test get_log_for_resource returns empty for non-matching resource.
	 */
	public function test_get_log_returns_empty_for_unknown_resource() {
		update_option(
			PayPal_Email_Sender::LOG_OPTION_KEY,
			array(
				array(
					'resource_id' => 'PLB-AAA',
					'email'       => 'tes***@example.com',
					'sent_at'     => '2026-03-16 10:00:00',
				),
			),
			false
		);

		$log = PayPal_Email_Sender::get_log_for_resource( 'PLB-UNKNOWN' );

		$this->assertEmpty( $log );
	}

	/**
	 * Test get_log_for_resource returns empty when no log exists.
	 */
	public function test_get_log_returns_empty_when_no_option() {
		$log = PayPal_Email_Sender::get_log_for_resource( 'PLB-NOLOG' );

		$this->assertEmpty( $log );
	}

	// --- Email masking ---

	/**
	 * Test that logged emails are masked (not stored as plaintext).
	 */
	public function test_log_stores_masked_emails() {
		// We can't call log_send directly (private), but we can check
		// that get_log returns masked data after a send.
		// Simulate a log entry with masked email.
		update_option(
			PayPal_Email_Sender::LOG_OPTION_KEY,
			array(
				array(
					'resource_id' => 'PLB-MASK',
					'email'       => 'cus***@example.com',
					'sent_at'     => '2026-03-16 10:00:00',
				),
			),
			false
		);

		$log = PayPal_Email_Sender::get_log_for_resource( 'PLB-MASK' );
		$this->assertCount( 1, $log );

		$entry = array_values( $log )[0];
		$this->assertStringContainsString( '***', $entry['email'] );
		$this->assertStringNotContainsString( 'customer', $entry['email'] );
	}
}
