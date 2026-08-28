<?php
/**
 * The first-party cookie carrying an exchanged comment identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Signed with the site's own salt, HttpOnly, 30 days at most. A tampered or
 * expired cookie reads as absent; nothing is looked up.
 */
class Passport {

	/**
	 * Read and verify the cookie.
	 *
	 * @return array|false The identity, or false.
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
			|| ! isset( $identity['site_commenter_id'] )
			|| ! isset( $identity['provider'] )
			|| ! isset( $identity['exp'] )
			|| ! in_array( $identity['provider'], Checkpoint::PROVIDERS, true )
			|| ! is_string( $identity['site_commenter_id'] ) || '' === $identity['site_commenter_id']
			|| time() >= (int) $identity['exp'] ) {
			return false;
		}

		return array(
			'site_commenter_id' => (string) $identity['site_commenter_id'],
			'provider'          => (string) $identity['provider'],
			'name'              => isset( $identity['name'] ) ? (string) $identity['name'] : '',
			'email'             => isset( $identity['email'] ) ? (string) $identity['email'] : '',
			'avatar'            => isset( $identity['avatar'] ) ? (string) $identity['avatar'] : '',
			'exp'               => (int) $identity['exp'],
		);
	}

	/**
	 * Write the cookie.
	 *
	 * @param array $identity   site_commenter_id, provider, name, email, avatar.
	 * @param int   $expires_at The exchange's expiry. Capped at 30 days, the retention limit; a privacy review before raising it.
	 * @return void
	 */
	public static function write( array $identity, $expires_at ) {
		$expires_at = (int) $expires_at;
		$ceiling    = time() + 30 * DAY_IN_SECONDS;
		if ( $expires_at <= time() || $expires_at > $ceiling ) {
			$expires_at = $ceiling;
		}

		$stored = array(
			'site_commenter_id' => (string) $identity['site_commenter_id'],
			'provider'          => (string) $identity['provider'],
			'name'              => isset( $identity['name'] ) ? (string) $identity['name'] : '',
			'email'             => isset( $identity['email'] ) ? (string) $identity['email'] : '',
			'avatar'            => isset( $identity['avatar'] ) ? (string) $identity['avatar'] : '',
			'exp'               => $expires_at,
		);

		$payload = rtrim( strtr( base64_encode( (string) wp_json_encode( $stored, JSON_UNESCAPED_SLASHES ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- encoding a signed payload, not obfuscating.
		$value   = $payload . '.' . self::sign( $payload );

		self::set( $value, $expires_at );

		// So the same request can read it back.
		$_COOKIE[ Checkpoint::COOKIE_NAME ] = $value;
	}

	/**
	 * Clear the cookie.
	 *
	 * @return void
	 */
	public static function clear() {
		self::set( '', time() - YEAR_IN_SECONDS );
		unset( $_COOKIE[ Checkpoint::COOKIE_NAME ] );
	}

	/**
	 * HMAC a payload. The context tag keeps the signature from being reused elsewhere.
	 *
	 * @param string $payload The base64url payload.
	 * @return string
	 */
	private static function sign( $payload ) {
		return hash_hmac( 'sha256', 'jetpack-comment-passport-v1|' . $payload, wp_salt( 'auth' ) );
	}

	/**
	 * Send the cookie.
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
