<?php
/**
 * The first-party cookie carrying a redeemed comment identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * A signed, HttpOnly, first-party cookie holding the identity the site redeemed
 * from WordPress.com. Verifying it is recomputing the HMAC, so a tampered or
 * expired cookie is treated exactly like an absent one; nothing is looked up.
 */
class Passport {

	/**
	 * Read and verify the identity cookie on the current request.
	 *
	 * @return array|false The identity, or false when absent, tampered or expired.
	 */
	public static function read() {
		if ( empty( $_COOKIE[ Checkpoint::COOKIE_NAME ] ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- the HMAC check below is the sanitizer.
		$raw = (string) wp_unslash( $_COOKIE[ Checkpoint::COOKIE_NAME ] );
		if ( 1 !== substr_count( $raw, '.' ) ) {
			return false;
		}

		list( $payload, $signature ) = explode( '.', $raw );

		if ( ! hash_equals( self::sign( $payload ), $signature ) ) {
			return false;
		}

		$identity = json_decode( (string) base64_decode( strtr( $payload, '-_', '+/' ) ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- decoding a signed payload, not obfuscating.

		if ( ! is_array( $identity )
			|| ! isset( $identity['sub'] )
			|| ! isset( $identity['provider'] )
			|| ! isset( $identity['exp'] )
			|| ! in_array( $identity['provider'], Checkpoint::PROVIDERS, true )
			|| ! is_string( $identity['sub'] ) || '' === $identity['sub']
			|| time() >= (int) $identity['exp'] ) {
			return false;
		}

		return array(
			'sub'      => (string) $identity['sub'],
			'provider' => (string) $identity['provider'],
			'name'     => isset( $identity['name'] ) ? (string) $identity['name'] : '',
			'email'    => isset( $identity['email'] ) ? (string) $identity['email'] : '',
			'avatar'   => isset( $identity['avatar'] ) ? (string) $identity['avatar'] : '',
			'exp'      => (int) $identity['exp'],
		);
	}

	/**
	 * Write the identity cookie: HttpOnly, Secure, SameSite=Lax.
	 *
	 * @param array $identity   The redeemed identity: sub, provider, name, email, avatar.
	 * @param int   $expires_at The exchange's expiry. The 30-day cap is the retention limit; don't raise it without a privacy review.
	 * @return void
	 */
	public static function write( array $identity, $expires_at ) {
		$expires_at = (int) $expires_at;
		$ceiling    = time() + 30 * DAY_IN_SECONDS;
		if ( $expires_at <= time() || $expires_at > $ceiling ) {
			$expires_at = $ceiling;
		}

		$stored = array(
			'sub'      => (string) $identity['sub'],
			'provider' => (string) $identity['provider'],
			'name'     => isset( $identity['name'] ) ? (string) $identity['name'] : '',
			'email'    => isset( $identity['email'] ) ? (string) $identity['email'] : '',
			'avatar'   => isset( $identity['avatar'] ) ? (string) $identity['avatar'] : '',
			'exp'      => $expires_at,
		);

		$payload = rtrim( strtr( base64_encode( (string) wp_json_encode( $stored, JSON_UNESCAPED_SLASHES ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- encoding a signed payload, not obfuscating.
		$value   = $payload . '.' . self::sign( $payload );

		self::set( $value, $expires_at );

		// So the same request that redeems can already read it back.
		$_COOKIE[ Checkpoint::COOKIE_NAME ] = $value;
	}

	/**
	 * Clear the identity cookie.
	 *
	 * @return void
	 */
	public static function clear() {
		self::set( '', time() - YEAR_IN_SECONDS );
		unset( $_COOKIE[ Checkpoint::COOKIE_NAME ] );
	}

	/**
	 * HMAC a payload with the site's own secret. The context tag keeps this
	 * signature from being reused to forge another.
	 *
	 * @param string $payload The base64url identity payload.
	 * @return string
	 */
	private static function sign( $payload ) {
		return hash_hmac( 'sha256', 'jetpack-comment-passport-v1|' . $payload, wp_salt( 'auth' ) );
	}

	/**
	 * Send the cookie on the site's own domain.
	 *
	 * @param string $value   The cookie value.
	 * @param int    $expires Expiry timestamp.
	 * @return void
	 */
	private static function set( $value, $expires ) {
		if ( headers_sent() ) {
			return;
		}

		setcookie(
			Checkpoint::COOKIE_NAME,
			$value,
			array(
				'expires'  => $expires,
				'path'     => defined( 'COOKIEPATH' ) ? COOKIEPATH : '/',
				'domain'   => defined( 'COOKIE_DOMAIN' ) ? COOKIE_DOMAIN : '',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			)
		);
	}
}
