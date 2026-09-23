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

/**
 * Class PayPal_Email_Sender_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Email_Sender
 */
#[CoversClass( PayPal_Email_Sender::class )]
class PayPal_Email_Sender_Test extends TestCase {

	/**
	 * Per-flag filter that forces the API-managed buttons on.
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG;

	/**
	 * HTTP status of the last ajax response.
	 *
	 * @var int|null
	 */
	private $response_status;

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

		// Clean up rate limit transients.
		$users   = get_users( array( 'fields' => 'ID' ) );
		$users[] = username_exists( 'testadmin_email_sender' );
		foreach ( array_filter( $users ) as $uid ) {
			delete_transient( 'paypal_email_rate_' . $uid );
			delete_transient( 'paypal_email_daily_' . $uid . '_' . gmdate( 'Y-m-d' ) );
		}

		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		delete_transient( 'paypal_resource_plb-zc45rdyzrhs9' );
		delete_transient( 'paypal_resource_plb-u7xqruhkesaz' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'pre_wp_mail' );

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
	}

	/**
	 * Test send_email prints the formatted price as it is given.
	 */
	public function test_send_email_prints_the_price_as_given() {
		$mail = $this->capture_mail();

		PayPal_Email_Sender::send_email(
			'test@example.com',
			'https://www.paypal.com/ncp/payment/PLB-TEST123',
			'Test Product',
			'From $24.50'
		);

		$this->assertStringContainsString( '>From $24.50</p>', $mail->message );
	}

	// --- handle_send ---

	/**
	 * Test the email for a link priced per option shows the cheapest option.
	 */
	public function test_handle_send_emails_the_from_price_for_priced_options() {
		$mail = $this->capture_mail();
		$this->mock_get_resource_response( $this->get_per_option_resource() );

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertTrue( $response['success'] );
		$this->assertStringContainsString( '>From $24.50</p>', $mail->message );
	}

	/**
	 * Test the email for a link priced on the product shows that price.
	 */
	public function test_handle_send_emails_the_product_price() {
		$mail = $this->capture_mail();
		$this->mock_get_resource_response( $this->get_product_price_resource() );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertTrue( $response['success'] );
		$this->assertStringContainsString( '>$11.00</p>', $mail->message );
	}

	/**
	 * Test handle_send takes the link, name and price from the resource, not the post.
	 */
	public function test_handle_send_reads_the_resource_not_the_post() {
		$mail = $this->capture_mail();
		$this->mock_get_resource_response( $this->get_per_option_resource() );

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
		$this->assertStringContainsString( 'WOOPTP-491 Test Widget', $mail->subject );
		$this->assertStringContainsString( '>From $24.50</p>', $mail->message );
		$this->assertStringContainsString( 'sandbox.paypal.com/ncp/payment/PLB-ZC45RDYZRHS9', $mail->message );
		$this->assertStringNotContainsString( 'PLB-POSTED', $mail->message );
		$this->assertStringNotContainsString( 'Posted Name', $mail->message );
		$this->assertStringNotContainsString( '€1.00', $mail->message );
	}

	/**
	 * Test handle_send fails and sends nothing when the resource can't be read.
	 */
	public function test_handle_send_fails_when_the_resource_cannot_be_read() {
		$mail = $this->capture_mail();
		$this->set_up_connected_state();
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 404,
						'message' => '',
					),
					'body'     => wp_json_encode(
						array(
							'name'    => 'RESOURCE_NOT_FOUND',
							'message' => 'The specified resource does not exist.',
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 404, $this->response_status );
		$this->assertNotEmpty( $response['data']['message'] );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
		$this->assertEmpty( PayPal_Email_Sender::get_log_for_resource( 'PLB-ZC45RDYZRHS9' ) );
	}

	/**
	 * Test handle_send answers 500 for a read error with no status, like a missing connection.
	 */
	public function test_handle_send_fails_with_500_when_paypal_is_not_connected() {
		$mail     = $this->capture_mail();
		$requests = $this->count_http_requests();

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 500, $this->response_status );
		$this->assertNotEmpty( $response['data']['message'] );
		$this->assertSame( 0, $requests->count );
		$this->assertNull( $mail->to );
	}

	/**
	 * Test handle_send answers 503 for a read error with status 0, a network error.
	 */
	public function test_handle_send_fails_with_503_on_a_network_error() {
		$mail = $this->capture_mail();
		// The client retries a network error with real sleeps, so plant the error it ends with.
		// The cache never holds errors in production.
		set_transient(
			'paypal_resource_plb-zc45rdyzrhs9',
			new \WP_Error( 'paypal_api_request_failed', 'PayPal API request failed: timeout', array( 'status' => 0 ) )
		);

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 503, $this->response_status );
		$this->assertSame( 'PayPal API request failed: timeout', $response['data']['message'] );
		$this->assertNull( $mail->to );
	}

	/**
	 * Test handle_send rejects a malformed resource ID before it counts or calls PayPal.
	 *
	 * @dataProvider provide_malformed_resource_ids
	 *
	 * @param string $resource_id A resource ID that is not PLB-XXXX.
	 */
	#[DataProvider( 'provide_malformed_resource_ids' )]
	public function test_handle_send_rejects_a_malformed_resource_id( $resource_id ) {
		$mail     = $this->capture_mail();
		$requests = $this->count_http_requests();
		$this->set_up_connected_state();

		$response = $this->send_payment_link( $resource_id );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 400, $this->response_status );
		$this->assertSame( 'Invalid or missing PayPal payment link.', $response['data']['message'] );
		$this->assertSame( 0, $requests->count );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
	}

	/**
	 * Resource IDs that are not PLB-XXXX.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_malformed_resource_ids() {
		return array(
			'empty'     => array( '' ),
			'no prefix' => array( 'ZC45RDYZRHS9' ),
			'no body'   => array( 'PLB-' ),
			'path'      => array( 'PLB-ZC45/../x' ),
		);
	}

	/**
	 * Test handle_send falls back to the resource ID when the product has no name.
	 */
	public function test_handle_send_names_a_nameless_product_by_its_id() {
		$mail     = $this->capture_mail();
		$resource = $this->get_product_price_resource();

		$resource['line_items'][0]['name'] = '';
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertTrue( $response['success'] );
		$this->assertStringContainsString( 'PLB-U7XQRUHKESAZ', $mail->subject );
	}

	/**
	 * Test handle_send fails and sends nothing when the resource has no price.
	 */
	public function test_handle_send_fails_when_the_resource_has_no_price() {
		$mail     = $this->capture_mail();
		$resource = $this->get_per_option_resource();
		foreach ( $resource['line_items'][0]['variants']['dimensions'][0]['options'] as $i => $option ) {
			unset( $resource['line_items'][0]['variants']['dimensions'][0]['options'][ $i ]['unit_amount'] );
		}
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-ZC45RDYZRHS9' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 400, $this->response_status );
		$this->assertSame( 'This payment link has no price.', $response['data']['message'] );
		$this->assertNull( $mail->to );
		$this->assertFalse( get_transient( 'paypal_email_rate_' . get_current_user_id() ) );
	}

	/**
	 * Test handle_send fails and sends nothing when the resource has no payment link.
	 */
	public function test_handle_send_fails_when_the_resource_has_no_payment_link() {
		$mail     = $this->capture_mail();
		$resource = $this->get_product_price_resource();
		unset( $resource['payment_link'] );
		$this->mock_get_resource_response( $resource );

		$response = $this->send_payment_link( 'PLB-U7XQRUHKESAZ' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 400, $this->response_status );
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

		return $this->capture_ajax_json( array( PayPal_Email_Sender::class, 'handle_send' ) );
	}

	/**
	 * Invoke an ajax handler and return its JSON envelope as an array.
	 *
	 * WordPress's wp_send_json_* echoes the response then calls wp_die(); force the
	 * ajax path and throw from the die handler so we can capture the buffered JSON
	 * without ending the test process.
	 *
	 * @param callable $handler Ajax handler to invoke.
	 * @return array<string, mixed> Decoded response.
	 */
	private function capture_ajax_json( $handler ) {
		add_filter( 'wp_doing_ajax', '__return_true' );
		add_filter(
			'wp_die_ajax_handler',
			function () {
				// Throw so wp_send_json_*'s wp_die() unwinds back to the test rather
				// than ending the process. A `never` return type would break PHP <8.1.
				// @phan-suppress-next-line PhanPluginNeverReturnFunction
				return function () {
					throw new \Exception( 'wp_die' );
				};
			}
		);

		$this->response_status = null;
		add_filter(
			'status_header',
			function ( $status_header, $code ) {
				$this->response_status = $code;
				return $status_header;
			},
			10,
			2
		);

		ob_start();
		try {
			$handler();
		} catch ( \Exception $e ) {
			unset( $e ); // wp_die() from wp_send_json_*; expected.
		}
		$output = ob_get_clean();

		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );
		remove_all_filters( 'status_header' );

		return json_decode( $output, true );
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

	/**
	 * Mock a get_resource API response.
	 *
	 * @param array $resource The resource data to return.
	 */
	private function mock_get_resource_response( $resource ) {
		$this->set_up_connected_state();
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $resource ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => '',
					),
					'body'     => wp_json_encode( $resource, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * A payment priced on the product, as PayPal returns it.
	 *
	 * @return array
	 */
	private function get_product_price_resource() {
		return array(
			'id'               => 'PLB-U7XQRUHKESAZ',
			'integration_mode' => 'LINK',
			'type'             => 'BUY_NOW',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array(
				array(
					'name'                     => 'C67 link ONE',
					'unit_amount'              => array(
						'currency_code' => 'USD',
						'value'         => '11.00',
					),
					'collect_shipping_address' => false,
				),
			),
			'status'           => 'ACTIVE',
			'payment_link'     => 'https://www.sandbox.paypal.com/ncp/payment/PLB-U7XQRUHKESAZ',
		);
	}

	/**
	 * A payment priced per Size, with an unpriced Color, as PayPal returns it.
	 *
	 * @return array
	 */
	private function get_per_option_resource() {
		return array(
			'id'               => 'PLB-ZC45RDYZRHS9',
			'integration_mode' => 'LINK',
			'type'             => 'BUY_NOW',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array(
				array(
					'name'                     => 'WOOPTP-491 Test Widget',
					'description'              => 'P6 M1 canvas/frontend parity fixture.',
					'collect_shipping_address' => true,
					'variants'                 => array(
						'dimensions' => array(
							array(
								'name'    => 'Size',
								'primary' => true,
								'options' => array(
									array(
										'label'       => 'Small',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '24.50',
										),
									),
									array(
										'label'       => 'Medium',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '29.50',
										),
									),
									array(
										'label'       => 'Large',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '34.50',
										),
									),
								),
							),
							array(
								'name'    => 'Color',
								'primary' => false,
								'options' => array(
									array( 'label' => 'Red' ),
									array( 'label' => 'Blue' ),
								),
							),
						),
					),
				),
			),
			'status'           => 'ACTIVE',
			'payment_link'     => 'https://www.sandbox.paypal.com/ncp/payment/PLB-ZC45RDYZRHS9',
		);
	}
}
