<?php
/**
 * Bridges the Woo opt-in hook to WPCOM, which in turn enqueues the
 * landing-page creation job in DSP.
 *
 * Listens for `jetpack_blaze_woo_product_promote_requested` and POSTs
 * a minimal payload to a WPCOM internal endpoint via the canonical
 * `wpcom_json_api_request_as_blog` signed channel.
 *
 * The WPCOM endpoint itself ships separately (Phase 2 — see PR roadmap).
 * Until that endpoint lands the call will 404; the dispatcher logs and
 * swallows the error so it doesn't break the merchant publish flow.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Client as Jetpack_Connection_Client;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use WP_Post;

/**
 * Dispatcher for Blaze landing-page jobs.
 */
class Landing_Page_Dispatcher {

	/**
	 * Path suffix appended to `/sites/{blog_id}/` when calling WPCOM.
	 * The WPCOM endpoint is site-specific, so the blog id segment is required.
	 *
	 * @var string
	 */
	const ENDPOINT_PATH_SUFFIX = '/blaze/landing-pages/enqueue';
	const API_VERSION          = '2';

	/**
	 * Wire hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action(
			'jetpack_blaze_woo_product_promote_requested',
			array( __CLASS__, 'dispatch' ),
			10,
			2
		);
	}

	/**
	 * Enqueue a landing-page job for the given product.
	 *
	 * @param int     $product_id Product ID.
	 * @param WP_Post $product    Product post.
	 * @return void
	 */
	public static function dispatch( $product_id, $product ) {
		$payload = array(
			'mode'       => 'woocommerce',
			'product_id' => (int) $product_id,
			'title'      => $product instanceof WP_Post ? (string) $product->post_title : '',
		);

		/**
		 * Filter the payload sent to WPCOM when enqueueing a Blaze
		 * landing-page job.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $payload    Payload that will be JSON-encoded.
		 * @param int   $product_id Product ID.
		 */
		$payload = (array) apply_filters( 'jetpack_blaze_landing_dispatch_payload', $payload, (int) $product_id );

		$blog_id = Jetpack_Connection::get_site_id();
		if ( is_wp_error( $blog_id ) || ! is_numeric( $blog_id ) ) {
			self::log(
				'no_blog_id',
				is_wp_error( $blog_id ) ? $blog_id->get_error_message() : 'not numeric',
				$product_id
			);
			return;
		}
		$path = '/sites/' . (int) $blog_id . self::ENDPOINT_PATH_SUFFIX;

		$response = Jetpack_Connection_Client::wpcom_json_api_request_as_blog(
			$path,
			self::API_VERSION,
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			self::log( 'wp_error', $response->get_error_message(), $product_id );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code >= 200 && $code < 300 ) {
			return;
		}

		$body = (string) wp_remote_retrieve_body( $response );
		self::log(
			'http_' . $code,
			'' === $body ? '(empty body)' : $body,
			$product_id
		);
	}

	/**
	 * Log a dispatch failure. Uses error_log because Jetpack-blaze does
	 * not currently ship a structured logger, and we want this visible in
	 * `WP_DEBUG_LOG` without crashing the publish request.
	 *
	 * @param string $reason     Short reason code.
	 * @param string $detail     Detail string.
	 * @param int    $product_id Product ID.
	 * @return void
	 */
	private static function log( $reason, $detail, $product_id ) {
		if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
			return;
		}
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Best-effort debug logging guarded by WP_DEBUG.
		error_log(
			sprintf(
				'[jetpack-blaze] landing-page dispatch failed (%s) for product %d: %s',
				$reason,
				(int) $product_id,
				$detail
			)
		);
	}
}
