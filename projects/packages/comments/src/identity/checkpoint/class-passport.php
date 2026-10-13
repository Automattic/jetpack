<?php
/**
 * The passport: a first-party cookie that lets a commenter back in without the popup.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * Signed with the site's own salt, so it is this site's and nobody else's.
 */
class Passport {

	const COOKIE         = 'jetpack_comment_identity';
	const DISPLAY_COOKIE = 'jetpack_comment_identity_display';
	const FIELDS         = array( 'site_commenter_id', 'name', 'email', 'avatar' );
	const LIFETIME       = 30 * DAY_IN_SECONDS;

	/**
	 * Read the passport the browser sent, if it is intact and unexpired.
	 *
	 * @return array|null Keyed by FIELDS.
	 */
	public static function read() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Verified against its signature below.
		$cookie = isset( $_COOKIE[ self::COOKIE ] ) ? wp_unslash( $_COOKIE[ self::COOKIE ] ) : '';

		if ( ! is_string( $cookie ) || '' === $cookie || substr_count( $cookie, '.' ) !== 1 ) {
			return null;
		}

		list( $encoded, $signature ) = explode( '.', $cookie, 2 );

		if ( ! hash_equals( self::signature( $encoded ), $signature ) ) {
			return null;
		}

		$payload = json_decode( (string) base64_decode( strtr( $encoded, '-_', '+/' ) ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- base64url is the cookie format.

		if ( ! is_array( $payload ) || empty( $payload['site_commenter_id'] ) ) {
			return null;
		}

		if ( (int) ( $payload['expires_at'] ?? 0 ) <= time() ) {
			return null;
		}

		if ( (int) ( $payload['blog_id'] ?? 0 ) !== Checkpoint::blog_id() ) {
			return null;
		}

		$identity = array();
		foreach ( self::FIELDS as $field ) {
			$identity[ $field ] = (string) ( $payload[ $field ] ?? '' );
		}

		return $identity;
	}

	/**
	 * Hand the browser a passport.
	 *
	 * @param array $identity From Checkpoint::exchange().
	 * @return void
	 */
	public static function issue( array $identity ) {
		$expires = time() + self::LIFETIME;
		$payload = array();

		foreach ( self::FIELDS as $field ) {
			$payload[ $field ] = (string) ( $identity[ $field ] ?? '' );
		}

		$payload['expires_at'] = $expires;
		$payload['blog_id']    = Checkpoint::blog_id();

		$encoded = rtrim( strtr( base64_encode( (string) wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- base64url is the cookie format.

		self::set_cookie( self::COOKIE, $encoded . '.' . self::signature( $encoded ), $expires, true );

		// The display cookie is URL-encoded JSON the page's script decodes.
		$shown = array();

		foreach ( array( 'name', 'avatar' ) as $field ) {
			$shown[ $field ] = (string) ( $identity[ $field ] ?? '' );
		}

		$shown['blog_id'] = Checkpoint::blog_id();

		self::set_cookie( self::DISPLAY_COOKIE, rawurlencode( (string) wp_json_encode( $shown, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ), $expires, false );
	}

	/**
	 * Take the passport back.
	 *
	 * @return void
	 */
	public static function revoke() {
		unset( $_COOKIE[ self::COOKIE ], $_COOKIE[ self::DISPLAY_COOKIE ] );
		self::set_cookie( self::COOKIE, '', time() - YEAR_IN_SECONDS, true );
		self::set_cookie( self::DISPLAY_COOKIE, '', time() - YEAR_IN_SECONDS, false );
	}

	/**
	 * HMAC over the encoded payload, keyed with the site's auth salt.
	 *
	 * @param string $encoded The base64url payload.
	 * @return string
	 */
	private static function signature( $encoded ) {
		return hash_hmac( 'sha256', 'jetpack-comment-passport|' . $encoded, wp_salt( 'auth' ) );
	}

	/**
	 * Send a cookie. Raw, so the display value reaches the script exactly as encoded.
	 *
	 * @param string $name     Cookie name.
	 * @param string $value    Cookie value.
	 * @param int    $expires  Unix time.
	 * @param bool   $httponly Whether to keep it from the page's script.
	 * @return void
	 */
	private static function set_cookie( $name, $value, $expires, $httponly ) {
		if ( headers_sent() ) {
			return;
		}

		setrawcookie(
			$name,
			$value,
			array(
				'expires'  => $expires,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => is_ssl(),
				'httponly' => $httponly,
				'samesite' => 'Lax',
			)
		);
	}
}
