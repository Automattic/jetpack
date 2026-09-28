<?php
/**
 * Tests for the PayPal_Webhooks class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Webhooks_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Webhooks
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Tracks
 */
#[CoversClass( PayPal_Webhooks::class )]
#[CoversClass( PayPal_Tracks::class )]
class PayPal_Webhooks_Test extends TestCase {

	/**
	 * The listener URL the tests register, once rest_url() is forced to HTTPS.
	 */
	private const LISTENER_URL = 'https://example.org/index.php?rest_route=/wpcom/v2/paypal/webhook';

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_option( PayPal_Webhooks::OPTION_KEY );
		delete_transient( PayPal_Webhooks::RETRY_LOCK_TRANSIENT );
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		delete_option( PayPal_OAuth::TOKEN_EXPIRES_AT_OPTION_KEY );
		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		\Jetpack_Options::delete_option( 'tos_agreed' );
		delete_transient( PayPal_Webhooks::SEEN_EVENT_TRANSIENT_PREFIX . md5( 'WH-EVENT-1' ) );

		wp_unschedule_hook( PayPal_Webhooks::FORWARD_RETRY_HOOK );
		Constants::clear_constants();

		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'rest_url' );
	}

	/**
	 * Store credentials and a token, as a connected site has them.
	 */
	private function connect_paypal() {
		PayPal_OAuth::set_environment( 'sandbox' );
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'fake_access_token_12345' ), 3600 );
	}

	/**
	 * Serve the REST API over HTTPS, which PayPal requires of a listener.
	 */
	private function serve_rest_over_https() {
		add_filter(
			'rest_url',
			function ( $url ) {
				return preg_replace( '#^http://#', 'https://', $url );
			}
		);
	}

	/**
	 * Give the site the blog ID and token a request to WordPress.com needs.
	 */
	private function connect_to_wordpress_com() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * The requests to the WordPress.com events route among the collected requests.
	 *
	 * @param array $requests Requests collected by mock_http_routes().
	 * @return array[]
	 */
	private function forwarded_events( array $requests ) {
		$forwarded = array();
		foreach ( $requests as $request ) {
			if ( false !== strpos( $request['url'], PayPal_Webhooks::WPCOM_EVENTS_ROUTE ) ) {
				$forwarded[] = $request;
			}
		}

		return $forwarded;
	}

	/**
	 * Connect an admin as the connection owner, so events have someone to go to.
	 */
	private function set_up_connection_owner() {
		$user_id = username_exists( 'testadmin_webhooks' );
		if ( ! $user_id ) {
			$user_id = wp_insert_user(
				array(
					'user_login' => 'testadmin_webhooks',
					'user_pass'  => 'password',
					'user_email' => 'webhooks@example.com',
					'role'       => 'administrator',
				)
			);
		}
		( new Tokens() )->update_user_token( $user_id, 'token.secret.' . $user_id, true );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'tos_agreed', true );
	}

	/**
	 * Route mocked HTTP responses by URL fragment.
	 *
	 * @param array $routes   Map of URL fragment => response array.
	 * @param array $requests Optional. Collected by reference as [ url, args ] pairs.
	 */
	private function mock_http_routes( array $routes, &$requests = null ) {
		$requests = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $routes, &$requests ) {
				$requests[] = array(
					'url'  => $url,
					'args' => $args,
				);

				foreach ( $routes as $fragment => $response ) {
					if ( false !== strpos( $url, $fragment ) ) {
						return $response;
					}
				}

				return $preempt;
			},
			10,
			3
		);
	}

	/**
	 * Build a mocked HTTP response array.
	 *
	 * @param int   $status HTTP status code.
	 * @param array $body   Response body.
	 * @return array
	 */
	private function http_response( $status, array $body ) {
		return array(
			'response' => array(
				'code'    => $status,
				'message' => 'OK',
			),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	/**
	 * The Tracks events among the collected requests, as the pixel's query parameters.
	 *
	 * @param array $requests Requests collected by mock_http_routes().
	 * @return array[]
	 */
	private function tracks_events( array $requests ) {
		$events = array();
		foreach ( $requests as $request ) {
			if ( false === strpos( $request['url'], 'pixel.wp.com' ) ) {
				continue;
			}
			$query = array();
			parse_str( (string) wp_parse_url( $request['url'], PHP_URL_QUERY ), $query );
			$events[] = $query;
		}

		return $events;
	}

	/**
	 * The capture_completed_event() fields as handle() forwards them.
	 *
	 * @return array
	 */
	private function forwarded_payload() {
		return array(
			'event_id'      => 'WH-EVENT-1',
			'capture_id'    => 'CAPTURE999',
			'status'        => 'COMPLETED',
			'amount'        => '30.00',
			'currency'      => 'USD',
			'order_id'      => 'ORDER12345',
			'custom_id'     => 'PLB-ORDER1',
			'invoice_id'    => 'INV-7',
			'merchant_id'   => 'MERCHANT42',
			'final_capture' => 1,
			'event_type'    => 'PAYMENT.CAPTURE.COMPLETED',
			'create_time'   => '2026-09-28T10:00:00Z',
			'environment'   => 'sandbox',
		);
	}

	/**
	 * A PAYMENT.CAPTURE.COMPLETED notification, as PayPal posts it.
	 *
	 * @return array
	 */
	private function capture_completed_event() {
		return array(
			'id'          => 'WH-EVENT-1',
			'event_type'  => 'PAYMENT.CAPTURE.COMPLETED',
			'create_time' => '2026-09-28T10:00:00Z',
			'resource'    => array(
				'id'                 => 'CAPTURE999',
				'status'             => 'COMPLETED',
				'final_capture'      => true,
				'custom_id'          => 'PLB-ORDER1',
				'invoice_id'         => 'INV-7',
				'payee'              => array(
					'merchant_id'   => 'MERCHANT42',
					'email_address' => 'seller@example.com',
				),
				'payer'              => array(
					'email_address' => 'buyer@example.com',
					'name'          => array(
						'given_name' => 'Buyer',
						'surname'    => 'Person',
					),
				),
				'amount'             => array(
					'currency_code' => 'USD',
					'value'         => '30.00',
				),
				'supplementary_data' => array(
					'related_ids' => array( 'order_id' => 'ORDER12345' ),
				),
			),
		);
	}

	public function test_register_stores_the_webhook_paypal_creates() {
		$this->connect_paypal();
		$this->serve_rest_over_https();
		$requests = array();
		$this->mock_http_routes(
			array( '/v1/notifications/webhooks' => $this->http_response( 201, array( 'id' => 'WH-123' ) ) ),
			$requests
		);

		$this->assertSame( 'WH-123', PayPal_Webhooks::register() );

		$this->assertSame(
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			),
			get_option( PayPal_Webhooks::OPTION_KEY )
		);
		$this->assertTrue( PayPal_Webhooks::is_registered() );

		$body = json_decode( end( $requests )['args']['body'], true );
		$this->assertSame( self::LISTENER_URL, $body['url'] );
		$this->assertSame( array( 'name' => 'PAYMENT.CAPTURE.COMPLETED' ), $body['event_types'][0] );
		$this->assertSameSize( PayPal_Webhooks::EVENT_TYPES, $body['event_types'] );
	}

	public function test_register_adopts_the_webhook_paypal_already_has_for_the_url() {
		$this->connect_paypal();
		$this->serve_rest_over_https();
		$calls = 0;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$calls ) {
				if ( false === strpos( $url, '/v1/notifications/webhooks' ) ) {
					return $preempt;
				}
				++$calls;
				if ( 'POST' === $args['method'] ) {
					return $this->http_response( 400, array( 'name' => 'WEBHOOK_URL_ALREADY_EXISTS' ) );
				}
				return $this->http_response(
					200,
					array(
						'webhooks' => array(
							array(
								'id'  => 'WH-OTHER',
								'url' => 'https://elsewhere.example/hook',
							),
							array(
								'id'  => 'WH-MINE',
								'url' => self::LISTENER_URL,
							),
						),
					)
				);
			},
			10,
			3
		);

		$this->assertSame( 'WH-MINE', PayPal_Webhooks::register() );
		$this->assertSame( 2, $calls );
		$this->assertSame( 'WH-MINE', get_option( PayPal_Webhooks::OPTION_KEY )['id'] );
	}

	public function test_register_refuses_a_listener_paypal_cannot_reach() {
		$this->connect_paypal();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$result = PayPal_Webhooks::register();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_webhook_url_not_https', $result->get_error_code() );
		$this->assertSame( array(), $requests );
		$this->assertFalse( get_option( PayPal_Webhooks::OPTION_KEY ) );
	}

	public function test_register_waits_an_hour_after_paypal_refuses() {
		$this->connect_paypal();
		$this->serve_rest_over_https();
		$requests = array();
		$this->mock_http_routes(
			array( '/v1/notifications/webhooks' => $this->http_response( 500, array( 'name' => 'INTERNAL_SERVICE_ERROR' ) ) ),
			$requests
		);

		$this->assertFalse( PayPal_Webhooks::ensure_registered() );
		$attempts = count( $requests );
		$this->assertGreaterThan( 0, $attempts );

		$this->assertFalse( PayPal_Webhooks::ensure_registered() );
		$this->assertCount( $attempts, $requests );
	}

	public function test_ensure_registered_is_a_no_op_once_registered() {
		$this->connect_paypal();
		$this->serve_rest_over_https();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			)
		);
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$this->assertTrue( PayPal_Webhooks::ensure_registered() );
		$this->assertSame( array(), $requests );
	}

	public function test_ensure_registered_re_registers_for_a_new_environment() {
		$this->connect_paypal();
		$this->serve_rest_over_https();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-PROD',
				'environment' => 'production',
				'url'         => self::LISTENER_URL,
			)
		);
		$this->mock_http_routes(
			array( '/v1/notifications/webhooks' => $this->http_response( 201, array( 'id' => 'WH-SANDBOX' ) ) )
		);

		$this->assertTrue( PayPal_Webhooks::ensure_registered() );
		$this->assertSame( 'WH-SANDBOX', get_option( PayPal_Webhooks::OPTION_KEY )['id'] );
	}

	public function test_unregister_deletes_the_webhook_and_forgets_it() {
		$this->connect_paypal();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			)
		);
		$requests = array();
		$this->mock_http_routes(
			array( '/v1/notifications/webhooks/WH-123' => $this->http_response( 204, array() ) ),
			$requests
		);

		PayPal_Webhooks::unregister();

		$this->assertSame( 'DELETE', end( $requests )['args']['method'] );
		$this->assertFalse( get_option( PayPal_Webhooks::OPTION_KEY ) );
	}

	public function test_unregister_without_a_webhook_asks_paypal_nothing() {
		$this->connect_paypal();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		PayPal_Webhooks::unregister();

		$this->assertSame( array(), $requests );
	}

	/**
	 * The signature headers PayPal sends, keyed as the controller hands them over.
	 *
	 * @return array
	 */
	private function signature_headers() {
		return array(
			'paypal-auth-algo'         => 'SHA256withRSA',
			'paypal-cert-url'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1',
			'paypal-transmission-id'   => 'TRANSMISSION-1',
			'paypal-transmission-sig'  => 'c2ln',
			'paypal-transmission-time' => '2026-09-28T10:00:00Z',
		);
	}

	public function test_verify_hands_paypal_the_headers_and_the_event_as_signed() {
		$this->connect_paypal();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			)
		);
		$requests = array();
		$this->mock_http_routes(
			array( '/v1/notifications/verify-webhook-signature' => $this->http_response( 200, array( 'verification_status' => 'SUCCESS' ) ) ),
			$requests
		);
		$raw_body = wp_json_encode( $this->capture_completed_event(), JSON_UNESCAPED_SLASHES );

		$this->assertTrue( PayPal_Webhooks::verify( $this->signature_headers(), $raw_body ) );

		$body = json_decode( end( $requests )['args']['body'], true );
		$this->assertSame( 'WH-123', $body['webhook_id'] );
		$this->assertSame( 'TRANSMISSION-1', $body['transmission_id'] );
		$this->assertSame( 'c2ln', $body['transmission_sig'] );
		$this->assertSame( 'SHA256withRSA', $body['auth_algo'] );
		$this->assertSame( 'WH-EVENT-1', $body['webhook_event']['id'] );
	}

	public function test_verify_refuses_a_signature_paypal_does_not_recognize() {
		$this->connect_paypal();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			)
		);
		$this->mock_http_routes(
			array( '/v1/notifications/verify-webhook-signature' => $this->http_response( 200, array( 'verification_status' => 'FAILURE' ) ) )
		);

		$result = PayPal_Webhooks::verify( $this->signature_headers(), wp_json_encode( $this->capture_completed_event(), JSON_UNESCAPED_SLASHES ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_webhook_invalid_signature', $result->get_error_code() );
	}

	public function test_verify_refuses_a_delivery_without_signature_headers() {
		$this->connect_paypal();
		update_option(
			PayPal_Webhooks::OPTION_KEY,
			array(
				'id'          => 'WH-123',
				'environment' => 'sandbox',
				'url'         => self::LISTENER_URL,
			)
		);
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$headers = $this->signature_headers();
		unset( $headers['paypal-transmission-sig'] );
		$result = PayPal_Webhooks::verify( $headers, wp_json_encode( $this->capture_completed_event(), JSON_UNESCAPED_SLASHES ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_webhook_missing_headers', $result->get_error_code() );
		$this->assertSame( array(), $requests );
	}

	public function test_verify_refuses_a_delivery_when_no_webhook_is_registered() {
		$this->connect_paypal();

		$result = PayPal_Webhooks::verify( $this->signature_headers(), wp_json_encode( $this->capture_completed_event(), JSON_UNESCAPED_SLASHES ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_webhook_not_registered', $result->get_error_code() );
	}

	public function test_handle_records_a_capture_as_a_tracks_event() {
		$this->connect_paypal();
		$this->set_up_connection_owner();
		$requests = array();
		$this->mock_http_routes( array( 'pixel.wp.com' => $this->http_response( 200, array() ) ), $requests );

		$this->assertSame( 'capture_completed', PayPal_Webhooks::handle( $this->capture_completed_event() ) );

		$events = $this->tracks_events( $requests );
		$this->assertCount( 1, $events );
		$event = $events[0];
		$this->assertSame( 'jetpack_paypal_capture_completed', $event['_en'] );
		$this->assertSame( 'WH-EVENT-1', $event['event_id'] );
		$this->assertSame( 'CAPTURE999', $event['capture_id'] );
		$this->assertSame( 'COMPLETED', $event['status'] );
		$this->assertSame( '30.00', $event['amount'] );
		$this->assertSame( 'USD', $event['currency'] );
		$this->assertSame( 'ORDER12345', $event['order_id'] );
		$this->assertSame( 'PLB-ORDER1', $event['custom_id'] );
		$this->assertSame( 'INV-7', $event['invoice_id'] );
		$this->assertSame( 'MERCHANT42', $event['merchant_id'] );
		$this->assertSame( '1', $event['final_capture'] );
		$this->assertSame( 'sandbox', $event['environment'] );
		$this->assertSame( '1234', $event['blog_id'] );
	}

	public function test_handle_forwards_the_capture_to_wordpress_com() {
		$this->connect_paypal();
		$this->set_up_connection_owner();
		$this->connect_to_wordpress_com();
		$requests = array();
		$this->mock_http_routes(
			array(
				'pixel.wp.com'                      => $this->http_response( 200, array() ),
				PayPal_Webhooks::WPCOM_EVENTS_ROUTE => $this->http_response( 200, array( 'logged' => true ) ),
			),
			$requests
		);

		PayPal_Webhooks::handle( $this->capture_completed_event() );

		$forwarded = $this->forwarded_events( $requests );
		$this->assertCount( 1, $forwarded );
		$this->assertSame( 'POST', $forwarded[0]['args']['method'] );
		$this->assertStringContainsString( '/wpcom/v2/paypal/webhook-events', $forwarded[0]['url'] );
		$this->assertSame(
			array(
				'event_id'      => 'WH-EVENT-1',
				'capture_id'    => 'CAPTURE999',
				'status'        => 'COMPLETED',
				'amount'        => '30.00',
				'currency'      => 'USD',
				'order_id'      => 'ORDER12345',
				'custom_id'     => 'PLB-ORDER1',
				'invoice_id'    => 'INV-7',
				'merchant_id'   => 'MERCHANT42',
				'final_capture' => 1,
				'event_type'    => 'PAYMENT.CAPTURE.COMPLETED',
				'create_time'   => '2026-09-28T10:00:00Z',
				'environment'   => 'sandbox',
			),
			json_decode( $forwarded[0]['args']['body'], true )
		);
	}

	public function test_handle_forwards_nothing_from_a_site_without_a_wordpress_com_connection() {
		$this->connect_paypal();
		$this->set_up_connection_owner();
		$requests = array();
		$this->mock_http_routes( array( 'pixel.wp.com' => $this->http_response( 200, array() ) ), $requests );

		PayPal_Webhooks::handle( $this->capture_completed_event() );

		$this->assertSame( array(), $this->forwarded_events( $requests ) );
		$this->assertFalse( wp_next_scheduled( PayPal_Webhooks::FORWARD_RETRY_HOOK, array( $this->forwarded_payload(), 2 ) ) );
	}

	public function test_forward_tries_again_later_when_wordpress_com_is_down() {
		$this->connect_paypal();
		$this->connect_to_wordpress_com();
		$this->mock_http_routes( array( PayPal_Webhooks::WPCOM_EVENTS_ROUTE => $this->http_response( 503, array() ) ) );

		$this->assertFalse( PayPal_Webhooks::forward( $this->forwarded_payload() ) );

		$this->assertNotFalse( wp_next_scheduled( PayPal_Webhooks::FORWARD_RETRY_HOOK, array( $this->forwarded_payload(), 2 ) ) );
	}

	public function test_forward_tries_again_later_when_wordpress_com_cannot_be_reached() {
		$this->connect_paypal();
		$this->connect_to_wordpress_com();
		$this->mock_http_routes( array( PayPal_Webhooks::WPCOM_EVENTS_ROUTE => new \WP_Error( 'http_request_failed', 'Timed out' ) ) );

		$this->assertFalse( PayPal_Webhooks::forward( $this->forwarded_payload() ) );

		$this->assertNotFalse( wp_next_scheduled( PayPal_Webhooks::FORWARD_RETRY_HOOK, array( $this->forwarded_payload(), 2 ) ) );
	}

	public function test_forward_takes_a_rejection_from_wordpress_com_as_final() {
		$this->connect_paypal();
		$this->connect_to_wordpress_com();
		$this->mock_http_routes( array( PayPal_Webhooks::WPCOM_EVENTS_ROUTE => $this->http_response( 400, array( 'error' => 'invalid' ) ) ) );

		$this->assertFalse( PayPal_Webhooks::forward( $this->forwarded_payload() ) );

		$this->assertFalse( wp_next_scheduled( PayPal_Webhooks::FORWARD_RETRY_HOOK, array( $this->forwarded_payload(), 2 ) ) );
	}

	public function test_retry_forward_gives_up_after_the_last_attempt() {
		$this->connect_paypal();
		$this->connect_to_wordpress_com();
		$requests = array();
		$this->mock_http_routes( array( PayPal_Webhooks::WPCOM_EVENTS_ROUTE => $this->http_response( 503, array() ) ), $requests );

		PayPal_Webhooks::retry_forward( $this->forwarded_payload(), PayPal_Webhooks::FORWARD_MAX_ATTEMPTS );

		$this->assertCount( 1, $this->forwarded_events( $requests ) );
		$this->assertFalse( wp_next_scheduled( PayPal_Webhooks::FORWARD_RETRY_HOOK, array( $this->forwarded_payload(), PayPal_Webhooks::FORWARD_MAX_ATTEMPTS + 1 ) ) );
	}

	public function test_handle_records_a_notification_once() {
		$this->connect_paypal();
		$this->set_up_connection_owner();
		$requests = array();
		$this->mock_http_routes( array( 'pixel.wp.com' => $this->http_response( 200, array() ) ), $requests );

		PayPal_Webhooks::handle( $this->capture_completed_event() );
		$this->assertFalse( PayPal_Webhooks::handle( $this->capture_completed_event() ) );

		$this->assertCount( 1, $this->tracks_events( $requests ) );
	}

	public function test_handle_ignores_an_event_it_did_not_subscribe_to() {
		$this->connect_paypal();
		$this->set_up_connection_owner();
		$requests = array();
		$this->mock_http_routes( array( 'pixel.wp.com' => $this->http_response( 200, array() ) ), $requests );

		$event               = $this->capture_completed_event();
		$event['event_type'] = 'CHECKOUT.ORDER.APPROVED';

		$this->assertFalse( PayPal_Webhooks::handle( $event ) );
		$this->assertSame( array(), $requests );
	}

	public function test_handle_records_nothing_without_a_connection_owner() {
		$this->connect_paypal();
		$requests = array();
		$this->mock_http_routes( array( 'pixel.wp.com' => $this->http_response( 200, array() ) ), $requests );

		$this->assertSame( 'capture_completed', PayPal_Webhooks::handle( $this->capture_completed_event() ) );
		$this->assertSame( array(), $requests );
	}
}
