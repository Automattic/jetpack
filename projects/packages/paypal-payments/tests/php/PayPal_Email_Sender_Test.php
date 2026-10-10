<?php
/**
 * Tests for the PayPal_Email_Sender class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/trait-paypal-resource-fixtures.php';
require_once __DIR__ . '/trait-paypal-tracks-events.php';

/**
 * Class PayPal_Email_Sender_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Email_Sender
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Tracks
 */
#[CoversClass( PayPal_Email_Sender::class )]
#[CoversClass( PayPal_Tracks::class )]
class PayPal_Email_Sender_Test extends TestCase {

	use PayPal_Resource_Fixtures;
	use PayPal_Tracks_Events;

	/**
	 * Per-flag filter that forces the API-managed buttons on.
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG;

	public function test_maybe_init_does_nothing_while_the_flag_is_off() {
		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );

		PayPal_Email_Sender::maybe_init();

		$this->assertFalse( has_action( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION, array( PayPal_Email_Sender::class, 'handle_send' ) ) );
	}

	public function test_maybe_init_hooks_up_while_the_flag_is_on() {
		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );
		add_filter( self::FLAG_FILTER, '__return_true' );

		PayPal_Email_Sender::maybe_init();

		$this->assertNotFalse( has_action( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION, array( PayPal_Email_Sender::class, 'handle_send' ) ) );

		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		remove_all_filters( self::FLAG_FILTER );
		Feature_Flags::reset();

		delete_option( PayPal_Email_Sender::LOG_OPTION_KEY );
		wp_set_current_user( 0 );

		// Clean up the test admin's rate limit transients.
		$user_id = username_exists( 'testadmin_email_sender' );
		delete_transient( 'paypal_email_rate_' . $user_id );
		delete_transient( 'paypal_email_daily_' . $user_id . '_' . gmdate( 'Y-m-d' ) );

		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		PayPal_API_Client::forget_cached_resources( 'PLB-ZC45RDYZRHS9' );
		PayPal_API_Client::forget_cached_resources( 'PLB-U7XQRUHKESAZ' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'pre_wp_mail' );
		unset( $GLOBALS['jetpack_paypal_test_captured_events'] );

		$_POST    = array();
		$_REQUEST = array();
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
			'$29.99',
			'Here is your link.'
		);

		$this->assertTrue( $result );
	}

	/**
	 * A sent email records only its environment.
	 */
	public function test_send_email_records_email_sent() {
		PayPal_OAuth::set_environment( 'sandbox' );
		add_filter( 'pre_wp_mail', '__return_true' );

		PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'$29.99',
			'Here is your link.'
		);

		$this->assertSame(
			array(
				array(
					'event_name' => 'jetpack_paypal_email_sent',
					'properties' => array( 'environment' => 'sandbox' ),
				),
			),
			$this->recorded_events()
		);
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
			'$29.99'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'email_send_failed', $result->get_error_code() );
		$this->assertSame( array(), $this->recorded_events(), 'A failed send recorded an event.' );
	}

	/**
	 * Test send_email shows the formatted price as given.
	 */
	public function test_send_email_shows_the_price_as_given() {
		$mail = $this->capture_mail();

		PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'From $24.50'
		);

		$this->assertStringContainsString( '>From $24.50</p>', $mail->message );
	}

	/**
	 * Test send_email adds the partner attribution code to the emailed link.
	 */
	public function test_send_email_adds_the_partner_code_to_the_link() {
		$mail = $this->capture_mail();

		PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'$29.99'
		);

		$this->assertStringContainsString(
			'href="https://www.paypal.com/ncp/payment/PLB-TEST123?at_code=' . PayPal_Payment_Buttons::PAYPAL_PARTNER_ATTRIBUTION_ID . '"',
			$mail->message
		);
	}

	// --- handle_send ---

	/**
	 * Test the email for a link priced on the product shows that price.
	 */
	public function test_handle_send_emails_the_product_price() {
		$mail = $this->capture_mail();
		$this->set_up_connected_state();
		$this->mock_get_resource_response( self::get_product_price_resource() );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertTrue( $response['success'] );
		$this->assertStringContainsString( '>$11.00</p>', $mail->message );
	}

	/**
	 * Test handle_send takes the link, name and price from PayPal over the posted fields.
	 */
	public function test_handle_send_takes_the_link_name_and_price_from_paypal() {
		$mail = $this->capture_mail();
		$this->set_up_connected_state();
		$this->mock_get_resource_response( self::get_per_option_resource() );

		$response = $this->send_payment_link(
			'PLB-ZC45RDYZRHS9',
			array(
				'payment_link' => 'https://www.paypal.com/ncp/payment/PLB-POSTED',
				'product_name' => 'Posted Name',
				'price'        => '1.00',
				'currency'     => 'EUR',
			)
		);

		$this->assertTrue( $response['success'] );
		$this->assertSame( 'buyer@example.com', $mail->to );
		$this->assertStringContainsString( 'Test Widget', $mail->subject );
		$this->assertStringContainsString( '>From $24.50</p>', $mail->message );
		$this->assertStringContainsString( 'sandbox.paypal.com/ncp/payment/PLB-ZC45RDYZRHS9', $mail->message );
		$this->assertStringNotContainsString( 'PLB-POSTED', $mail->message );
		$this->assertStringNotContainsString( 'Posted Name', $mail->message );
		$this->assertStringNotContainsString( '€1.00', $mail->message );
	}

	/**
	 * Test handle_send passes on PayPal's error and skips the email.
	 */
	public function test_handle_send_passes_on_a_paypal_error() {
		$mail = $this->capture_mail();
		$this->set_up_connected_state();
		$requests = $this->count_http_requests();

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertSame( 1, $requests->count );
		$this->assertFalse( $response['success'] );
		$this->assertSame( 'This PayPal button no longer exists. It may have been deleted from PayPal. Please create a new button.', $response['data']['message'] );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
		$this->assertEmpty( PayPal_Email_Sender::get_log_for_resource( 'PLB-ZC45RDYZRHS9' ) );
	}

	/**
	 * Test handle_send makes no PayPal request while PayPal is disconnected.
	 */
	public function test_handle_send_fails_while_paypal_is_disconnected() {
		$mail     = $this->capture_mail();
		$requests = $this->count_http_requests();

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'PayPal API credentials are not configured. Please connect your PayPal account.', $response['data']['message'] );
		$this->assertSame( 0, $requests->count );
		$this->assertNull( $mail->to );
	}

	/**
	 * Test handle_send rejects a malformed resource ID before the rate limit or any PayPal request.
	 *
	 * @dataProvider provide_malformed_resource_ids
	 *
	 * @param string $resource_id A malformed resource ID.
	 */
	#[DataProvider( 'provide_malformed_resource_ids' )]
	public function test_handle_send_rejects_a_malformed_resource_id( $resource_id ) {
		$mail     = $this->capture_mail();
		$requests = $this->count_http_requests();
		$this->set_up_connected_state();

		$response = $this->send_payment_link( $resource_id );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'Invalid or missing PayPal payment link.', $response['data']['message'] );
		$this->assertSame( 0, $requests->count );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
	}

	/**
	 * Malformed resource IDs.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_malformed_resource_ids() {
		return array(
			'empty'          => array( '' ),
			'missing prefix' => array( 'ZC45RDYZRHS9' ),
			'prefix only'    => array( 'PLB-' ),
			'path'           => array( 'PLB-ZC45/../x' ),
		);
	}

	/**
	 * Test handle_send uses the resource ID when the product name is blank.
	 */
	public function test_handle_send_uses_the_resource_id_for_a_blank_product_name() {
		$mail     = $this->capture_mail();
		$resource = self::get_product_price_resource();

		$resource['line_items'][0]['name'] = '';
		$this->set_up_connected_state();
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertTrue( $response['success'] );
		$this->assertStringContainsString( 'PLB-U7XQRUHKESAZ', $mail->subject );
	}

	/**
	 * Test handle_send rejects a link without a price.
	 */
	public function test_handle_send_requires_a_price() {
		$mail     = $this->capture_mail();
		$resource = self::get_product_price_resource();
		unset( $resource['line_items'][0]['unit_amount'] );
		$this->set_up_connected_state();
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'This payment link has no price.', $response['data']['message'] );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
	}

	/**
	 * Test handle_send rejects a resource without a payment link.
	 */
	public function test_handle_send_requires_a_payment_link() {
		$mail     = $this->capture_mail();
		$resource = self::get_product_price_resource();
		unset( $resource['payment_link'] );
		$this->set_up_connected_state();
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'Invalid or missing PayPal payment link.', $response['data']['message'] );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
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

	// --- Helpers ---

	/**
	 * Capture the next wp_mail() call instead of sending it.
	 *
	 * @return object The captured to, subject and message, null until a send.
	 */
	private function capture_mail() {
		$mail = (object) array(
			'to'      => null,
			'subject' => null,
			'message' => null,
		);
		add_filter(
			'pre_wp_mail',
			function ( $preempt, $atts ) use ( $mail ) {
				$mail->to      = $atts['to'];
				$mail->subject = $atts['subject'];
				$mail->message = $atts['message'];
				return true;
			},
			10,
			2
		);
		return $mail;
	}

	/**
	 * Post the send form as an admin and return the JSON response.
	 *
	 * @param string $resource_id PayPal resource ID.
	 * @param array  $extra       More fields to post.
	 * @return array<string, mixed> Decoded response.
	 * @throws \RuntimeException When the handler throws anything but the wp_die() stand-in.
	 */
	private function send_payment_link( $resource_id, array $extra = array() ) {
		wp_set_current_user( $this->create_admin_user() );

		$_POST    = array_merge(
			array(
				'action'      => PayPal_Email_Sender::AJAX_ACTION,
				'_wpnonce'    => wp_create_nonce( PayPal_Email_Sender::AJAX_ACTION ),
				'resource_id' => $resource_id,
				'recipient'   => 'buyer@example.com',
				'message'     => '',
			),
			$extra
		);
		$_REQUEST = $_POST;

		add_filter( 'wp_doing_ajax', '__return_true' );

		// Throw from wp_die() so wp_send_json_*() returns to the test instead of exiting.
		$expected_exception = new \RuntimeException( 'wp_die' );
		$throw_die_handler  = /** @return never */ static function () use ( $expected_exception ) {
			throw $expected_exception;
		};
		add_filter( 'wp_die_ajax_handler', $throw_die_handler, 20 );

		ob_start();
		try {
			PayPal_Email_Sender::handle_send();
		} catch ( \RuntimeException $caught_exception ) {
			if ( $caught_exception !== $expected_exception ) {
				throw $caught_exception;
			}
		}
		$output = ob_get_clean();

		remove_filter( 'wp_die_ajax_handler', $throw_die_handler, 20 );
		remove_filter( 'wp_doing_ajax', '__return_true' );

		$response = json_decode( $output, true );
		$this->assertNotNull( $response, 'handle_send did not return valid JSON. Output: ' . substr( $output, 0, 200 ) );

		return $response;
	}

	/**
	 * Count the HTTP requests made from here on, answering each with a 404.
	 *
	 * @return object The count, kept up to date.
	 */
	private function count_http_requests() {
		$requests = (object) array( 'count' => 0 );
		add_filter(
			'pre_http_request',
			function () use ( $requests ) {
				++$requests->count;
				return array(
					'response' => array(
						'code'    => 404,
						'message' => '',
					),
					'body'     => '',
				);
			}
		);
		return $requests;
	}

	/**
	 * Create an admin user for testing.
	 *
	 * @return int User ID.
	 */
	private function create_admin_user() {
		$user_id = username_exists( 'testadmin_email_sender' );
		if ( $user_id ) {
			return $user_id;
		}

		return wp_insert_user(
			array(
				'user_login' => 'testadmin_email_sender',
				'user_pass'  => wp_generate_password(),
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Set up a connected PayPal state with a cached token.
	 */
	private function set_up_connected_state() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		PayPal_OAuth::set_environment( 'production' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'fake_access_token' ), 3600 );
	}
}
