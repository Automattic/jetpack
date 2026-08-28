<?php
/**
 * Order token minting and verification for Jetpack Forms payments.
 *
 * PROTOTYPE. The token design here is the real one from the design doc: the
 * buyer carries an HMAC signature over the order, never the amount itself, so
 * the amount cannot be edited client-side. What is *not* real in the prototype
 * is where the token goes — production hands it to WPCOM checkout, the
 * prototype hands it to a simulated checkout rendered by us.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Payments;

use WP_Error;

/**
 * Mints and verifies single-use order tokens.
 */
class Order {

	/**
	 * Option holding the site's signing secret.
	 *
	 * @var string
	 */
	const SECRET_OPTION = 'jetpack_forms_payments_secret';

	/**
	 * How long a token stays valid, in seconds.
	 *
	 * @var int
	 */
	const TTL = DAY_IN_SECONDS;

	/**
	 * Get (or lazily create) the site's signing secret.
	 *
	 * @return string
	 */
	private static function get_secret() {
		$secret = get_option( self::SECRET_OPTION );

		if ( ! $secret ) {
			$secret = wp_generate_password( 64, false, false );
			// Autoload off: this is only read on the submit/confirm paths.
			add_option( self::SECRET_OPTION, $secret, '', false );
		}

		return $secret;
	}

	/**
	 * Mint a token for an order.
	 *
	 * @param array $order {
	 *     @type int    $entry_id Feedback post ID the payment belongs to.
	 *     @type int    $amount   Amount in minor units (e.g. cents).
	 *     @type string $currency ISO 4217 currency code.
	 * }
	 * @return string
	 */
	public static function mint( array $order ) {
		$payload = array(
			'entry_id' => (int) $order['entry_id'],
			'amount'   => (int) $order['amount'],
			'currency' => (string) $order['currency'],
			'blog_id'  => (int) get_current_blog_id(),
			'nonce'    => wp_generate_password( 16, false, false ),
			'expires'  => time() + self::TTL,
		);

		$body      = self::b64_encode( (string) wp_json_encode( $payload ) );
		$signature = self::b64_encode( hash_hmac( 'sha256', $body, self::get_secret(), true ) );

		return $body . '.' . $signature;
	}

	/**
	 * Verify a token and return its payload.
	 *
	 * Signature, expiry and blog binding are all checked here. Single-use
	 * enforcement is *not* — that lives with the entry, because only the entry
	 * knows whether this order has already been paid. See Payment_Status.
	 *
	 * @param string $token Token to verify.
	 * @return array|WP_Error
	 */
	public static function verify( $token ) {
		if ( ! is_string( $token ) || substr_count( $token, '.' ) !== 1 ) {
			return new WP_Error( 'invalid_order_token', __( 'Malformed order token.', 'jetpack-forms' ) );
		}

		list( $body, $signature ) = explode( '.', $token );

		$expected = self::b64_encode( hash_hmac( 'sha256', $body, self::get_secret(), true ) );

		if ( ! hash_equals( $expected, $signature ) ) {
			return new WP_Error( 'invalid_order_signature', __( 'Order token signature does not match.', 'jetpack-forms' ) );
		}

		$payload = json_decode( self::b64_decode( $body ), true );

		if ( ! is_array( $payload ) || empty( $payload['entry_id'] ) ) {
			return new WP_Error( 'invalid_order_payload', __( 'Order token payload could not be read.', 'jetpack-forms' ) );
		}

		if ( empty( $payload['expires'] ) || $payload['expires'] < time() ) {
			return new WP_Error( 'expired_order_token', __( 'This payment link has expired.', 'jetpack-forms' ) );
		}

		if ( (int) ( $payload['blog_id'] ?? 0 ) !== (int) get_current_blog_id() ) {
			return new WP_Error( 'foreign_order_token', __( 'Order token was issued for a different site.', 'jetpack-forms' ) );
		}

		return $payload;
	}

	/**
	 * URL-safe base64 encode.
	 *
	 * @param string $value Value to encode.
	 * @return string
	 */
	private static function b64_encode( $value ) {
		return rtrim( strtr( base64_encode( $value ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Not obfuscation; URL-safe transport encoding.
	}

	/**
	 * URL-safe base64 decode.
	 *
	 * @param string $value Value to decode.
	 * @return string
	 */
	private static function b64_decode( $value ) {
		return (string) base64_decode( strtr( $value, '-_', '+/' ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Not obfuscation; URL-safe transport encoding.
	}
}
