<?php
/**
 * PayPal webhook registration, verification and handling.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Webhooks
 *
 * A payment made through a hosted button, link or QR code never touches the site,
 * so PayPal tells the site about captures through a webhook registered on the
 * merchant's account. Each verified notification becomes a Tracks event and is
 * forwarded to WordPress.com, which logs payments centrally.
 *
 * @since $$next-version$$
 */
class PayPal_Webhooks {

	/**
	 * Option holding the registered webhook: its id, environment and listener URL.
	 *
	 * @var string
	 */
	const OPTION_KEY = 'jetpack_paypal_payment_buttons_webhook';

	/**
	 * Transient that spaces out registration attempts after a failure.
	 *
	 * @var string
	 */
	const RETRY_LOCK_TRANSIENT = 'jetpack_paypal_payment_buttons_webhook_retry';

	/**
	 * How long a failed registration waits before the next attempt, in seconds.
	 *
	 * @var int
	 */
	const RETRY_LOCK_TTL = HOUR_IN_SECONDS;

	/**
	 * Prefix of the transient that remembers a handled notification.
	 *
	 * @var string
	 */
	const SEEN_EVENT_TRANSIENT_PREFIX = 'jetpack_paypal_webhook_event_';

	/**
	 * How long a handled notification is remembered, in seconds. PayPal retries for up to three days.
	 *
	 * @var int
	 */
	const SEEN_EVENT_TTL = 3 * DAY_IN_SECONDS;

	/**
	 * The route PayPal posts to, under the `wpcom/v2` namespace.
	 *
	 * @var string
	 */
	const LISTENER_ROUTE = '/paypal/webhook';

	/**
	 * The WordPress.com route verified notifications are forwarded to, under `wpcom/v2`.
	 *
	 * @var string
	 */
	const WPCOM_EVENTS_ROUTE = '/paypal/webhook-events';

	/**
	 * Cron hook that offers WordPress.com a notification it did not accept earlier.
	 *
	 * @var string
	 */
	const FORWARD_RETRY_HOOK = 'jetpack_paypal_webhook_forward_retry';

	/**
	 * How many times a notification is offered to WordPress.com in all.
	 *
	 * @var int
	 */
	const FORWARD_MAX_ATTEMPTS = 3;

	/**
	 * How long a failed forward waits before the next attempt, in seconds.
	 *
	 * @var int
	 */
	const FORWARD_RETRY_DELAY = 5 * MINUTE_IN_SECONDS;

	/**
	 * The events the webhook subscribes to.
	 *
	 * @var string[]
	 */
	const EVENT_TYPES = array(
		'PAYMENT.CAPTURE.COMPLETED',
		'PAYMENT.CAPTURE.DECLINED',
		'PAYMENT.CAPTURE.PENDING',
		'PAYMENT.CAPTURE.REFUNDED',
		'PAYMENT.CAPTURE.REVERSED',
	);

	/**
	 * The URL PayPal delivers notifications to.
	 *
	 * @return string
	 */
	public static function get_listener_url() {
		return rest_url( PayPal_REST_Controller::REST_NAMESPACE . self::LISTENER_ROUTE );
	}

	/**
	 * The registered webhook, if any.
	 *
	 * @return array|null id, environment and url, or null when none is registered.
	 */
	public static function get_registered() {
		$stored = get_option( self::OPTION_KEY );
		if ( ! is_array( $stored ) || empty( $stored['id'] ) ) {
			return null;
		}

		return $stored;
	}

	/**
	 * Whether the registered webhook is the one this site and environment need.
	 *
	 * @return bool
	 */
	public static function is_registered() {
		$stored = self::get_registered();

		return null !== $stored
			&& PayPal_OAuth::get_environment() === ( $stored['environment'] ?? '' )
			&& self::get_listener_url() === ( $stored['url'] ?? '' );
	}

	/**
	 * Register the webhook on the connected PayPal account.
	 *
	 * A URL PayPal already knows is adopted rather than treated as a failure, so a
	 * site that lost the option, or reconnected the same account, ends up registered.
	 *
	 * @return string|\WP_Error The webhook id.
	 */
	public static function register() {
		$url = self::get_listener_url();

		if ( 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) ) {
			return new \WP_Error(
				'paypal_webhook_url_not_https',
				__( 'PayPal can only notify sites served over HTTPS.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$webhook = PayPal_API_Client::create_webhook( $url, self::EVENT_TYPES );

		if ( is_wp_error( $webhook ) && 'WEBHOOK_URL_ALREADY_EXISTS' === ( $webhook->get_error_data()['paypal_name'] ?? '' ) ) {
			$webhook = self::find_existing( $url );
		}

		if ( is_wp_error( $webhook ) ) {
			set_transient( self::RETRY_LOCK_TRANSIENT, time(), self::RETRY_LOCK_TTL );
			return $webhook;
		}

		$id = sanitize_text_field( $webhook['id'] ?? '' );
		if ( '' === $id ) {
			set_transient( self::RETRY_LOCK_TRANSIENT, time(), self::RETRY_LOCK_TTL );
			return new \WP_Error(
				'paypal_webhook_missing_id',
				__( 'PayPal registered the webhook without returning its id.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		update_option(
			self::OPTION_KEY,
			array(
				'id'          => $id,
				'environment' => PayPal_OAuth::get_environment(),
				'url'         => $url,
			),
			false
		);
		delete_transient( self::RETRY_LOCK_TRANSIENT );

		return $id;
	}

	/**
	 * Register the webhook if the connected account does not have one yet.
	 *
	 * Cheap when the option is in place, so callers on hot paths can afford it.
	 * After a failure it waits before trying again.
	 *
	 * @return bool Whether a webhook is registered afterwards.
	 */
	public static function ensure_registered() {
		if ( self::is_registered() ) {
			return true;
		}

		if ( ! PayPal_OAuth::has_credentials() || get_transient( self::RETRY_LOCK_TRANSIENT ) ) {
			return false;
		}

		return ! is_wp_error( self::register() );
	}

	/**
	 * Delete the registered webhook from PayPal and forget it.
	 *
	 * Runs before the credentials go, since PayPal needs them to accept the deletion.
	 *
	 * @return void
	 */
	public static function unregister() {
		$stored = self::get_registered();
		if ( $stored ) {
			PayPal_API_Client::delete_webhook( $stored['id'] );
		}

		delete_option( self::OPTION_KEY );
		delete_transient( self::RETRY_LOCK_TRANSIENT );
	}

	/**
	 * Check a notification's signature with PayPal.
	 *
	 * @param array  $headers  The delivery's `PAYPAL-*` headers, keyed by lowercase name.
	 * @param string $raw_body The delivery's body, byte for byte as received.
	 * @return true|\WP_Error True when PayPal confirms the signature.
	 */
	public static function verify( array $headers, $raw_body ) {
		$stored = self::get_registered();
		if ( ! $stored ) {
			return new \WP_Error(
				'paypal_webhook_not_registered',
				__( 'This site has no PayPal webhook to verify against.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$required = array( 'paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time' );
		foreach ( $required as $name ) {
			if ( empty( $headers[ $name ] ) ) {
				return new \WP_Error(
					'paypal_webhook_missing_headers',
					__( 'The notification is missing PayPal\'s signature headers.', 'jetpack-paypal-payments' ),
					array( 'status' => 400 )
				);
			}
		}

		// PayPal verifies the event as it signed it, so the body goes back decoded, not re-encoded.
		$event = json_decode( $raw_body, true );
		if ( ! is_array( $event ) ) {
			return new \WP_Error(
				'paypal_webhook_invalid_body',
				__( 'The notification body is not valid JSON.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$result = PayPal_API_Client::verify_webhook_signature(
			array(
				'auth_algo'         => $headers['paypal-auth-algo'],
				'cert_url'          => $headers['paypal-cert-url'],
				'transmission_id'   => $headers['paypal-transmission-id'],
				'transmission_sig'  => $headers['paypal-transmission-sig'],
				'transmission_time' => $headers['paypal-transmission-time'],
				'webhook_id'        => $stored['id'],
				'webhook_event'     => $event,
			)
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( 'SUCCESS' !== ( $result['verification_status'] ?? '' ) ) {
			return new \WP_Error(
				'paypal_webhook_invalid_signature',
				__( 'PayPal did not recognize the notification\'s signature.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Turn a verified notification into a Tracks event and forward it to WordPress.com.
	 *
	 * A notification PayPal delivers twice is recorded once.
	 *
	 * @param array $event The notification, decoded.
	 * @return string|false The event name recorded, without the `jetpack_paypal_` prefix, or false.
	 */
	public static function handle( array $event ) {
		$type = (string) ( $event['event_type'] ?? '' );
		if ( ! in_array( $type, self::EVENT_TYPES, true ) ) {
			return false;
		}

		$event_id = sanitize_text_field( $event['id'] ?? '' );
		if ( '' !== $event_id ) {
			$seen_key = self::SEEN_EVENT_TRANSIENT_PREFIX . md5( $event_id );
			if ( get_transient( $seen_key ) ) {
				return false;
			}
			set_transient( $seen_key, 1, self::SEEN_EVENT_TTL );
		}

		$resource   = is_array( $event['resource'] ?? null ) ? $event['resource'] : array();
		$name       = 'capture_' . strtolower( substr( $type, strlen( 'PAYMENT.CAPTURE.' ) ) );
		$properties = array(
			'event_id'      => $event_id,
			'capture_id'    => sanitize_text_field( $resource['id'] ?? '' ),
			'status'        => sanitize_text_field( $resource['status'] ?? '' ),
			'amount'        => sanitize_text_field( $resource['amount']['value'] ?? '' ),
			'currency'      => sanitize_text_field( $resource['amount']['currency_code'] ?? '' ),
			'order_id'      => sanitize_text_field( $resource['supplementary_data']['related_ids']['order_id'] ?? '' ),
			'custom_id'     => sanitize_text_field( $resource['custom_id'] ?? '' ),
			'invoice_id'    => sanitize_text_field( $resource['invoice_id'] ?? '' ),
			'merchant_id'   => sanitize_text_field( $resource['payee']['merchant_id'] ?? '' ),
			'final_capture' => empty( $resource['final_capture'] ) ? 0 : 1,
		);

		PayPal_Tracks::record( $name, $properties );

		self::forward(
			array_merge(
				$properties,
				array(
					'event_type'  => $type,
					'create_time' => sanitize_text_field( $event['create_time'] ?? '' ),
					'environment' => PayPal_OAuth::get_environment(),
				)
			)
		);

		return $name;
	}

	/**
	 * Hand a verified notification to WordPress.com, which logs payments centrally.
	 *
	 * Only the fields the site records go over, never the payer. When WordPress.com
	 * cannot be reached, or answers a server error, the forward is retried from cron.
	 *
	 * @param array $payload The notification's fields, as handle() reduces them.
	 * @param int   $attempt Which attempt this is, counting from 1.
	 * @return bool Whether WordPress.com accepted the notification.
	 */
	public static function forward( array $payload, $attempt = 1 ) {
		if ( ! ( new Manager() )->is_connected() ) {
			return false;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			self::WPCOM_EVENTS_ROUTE,
			'2',
			array(
				'method'  => 'POST',
				'timeout' => 10,
				'headers' => array(
					'Content-Type' => 'application/json',
					'Accept'       => 'application/json',
				),
			),
			wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'wpcom'
		);

		$status = is_wp_error( $response ) ? 0 : (int) wp_remote_retrieve_response_code( $response );
		if ( $status >= 200 && $status < 300 ) {
			return true;
		}

		// A 4xx is WordPress.com's final word on this payload; only outages are worth another try.
		if ( ( 0 === $status || $status >= 500 ) && $attempt < self::FORWARD_MAX_ATTEMPTS ) {
			wp_schedule_single_event( time() + self::FORWARD_RETRY_DELAY, self::FORWARD_RETRY_HOOK, array( $payload, $attempt + 1 ) );
		}

		return false;
	}

	/**
	 * Cron callback for FORWARD_RETRY_HOOK.
	 *
	 * @param array $payload The notification's fields, as handle() reduces them.
	 * @param int   $attempt Which attempt this is, counting from 1.
	 * @return void
	 */
	public static function retry_forward( $payload, $attempt ) {
		if ( is_array( $payload ) ) {
			self::forward( $payload, (int) $attempt );
		}
	}

	/**
	 * Find the webhook PayPal already holds for a listener URL.
	 *
	 * @param string $url The listener URL.
	 * @return array|\WP_Error The webhook, as PayPal lists it.
	 */
	private static function find_existing( $url ) {
		$listed = PayPal_API_Client::list_webhooks();
		if ( is_wp_error( $listed ) ) {
			return $listed;
		}

		foreach ( (array) ( $listed['webhooks'] ?? array() ) as $webhook ) {
			if ( is_array( $webhook ) && $url === ( $webhook['url'] ?? '' ) ) {
				return $webhook;
			}
		}

		return new \WP_Error(
			'paypal_webhook_not_found',
			__( 'PayPal reports a webhook for this site but does not list it.', 'jetpack-paypal-payments' ),
			array( 'status' => 502 )
		);
	}
}
