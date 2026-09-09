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

	/**
	 * The passport itself: signed, httponly, read only by the server.
	 */
	const COOKIE = 'jetpack_comment_identity';

	/**
	 * What the form may show: provider, name and avatar, readable by the page's
	 * script. Nothing here is trusted; the server reads COOKIE.
	 *
	 * A page cache serves one logged-out page to everyone, so who is holding a
	 * passport can never be rendered into HTML. It has to come from the browser.
	 */
	const DISPLAY_COOKIE = 'jetpack_comment_identity_display';

	/**
	 * The fields the display cookie carries.
	 */
	const DISPLAY_FIELDS = array( 'provider', 'name', 'avatar' );

	/**
	 * What the cookie carries, in order. The blog id is added at signing time,
	 * so a passport issued on one site of a network, or of WordPress.com, is
	 * refused on every other.
	 */
	const FIELDS = array( 'site_commenter_id', 'provider', 'name', 'email', 'avatar', 'expires_at' );

	/**
	 * Domain-separates the signature from anything else keyed with the same salt.
	 */
	const SIGNING_PURPOSE = 'jetpack-comment-passport-v1';

	/**
	 * Read the passport the browser sent, if it is intact and unexpired.
	 *
	 * @return array|null Keyed by FIELDS.
	 */
	public static function read() {
		if ( empty( $_COOKIE[ self::COOKIE ] ) || ! is_string( $_COOKIE[ self::COOKIE ] ) ) {
			return null;
		}

		return self::decode( wp_unslash( $_COOKIE[ self::COOKIE ] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Verified against its signature in decode().
	}

	/**
	 * Hand the browser a passport.
	 *
	 * @param array $identity From Checkpoint::exchange().
	 * @return void
	 */
	public static function issue( array $identity ) {
		$expires = (int) $identity['expires_at'];

		if ( $expires <= time() ) {
			return;
		}

		self::set_cookie( self::COOKIE, self::encode( $identity ), $expires, true );
		self::set_cookie( self::DISPLAY_COOKIE, self::display( $identity ), $expires, false );
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
	 * The display cookie's value: URL-encoded JSON the page's script decodes.
	 *
	 * @param array $identity Keyed by FIELDS.
	 * @return string
	 */
	public static function display( array $identity ) {
		$shown = array();

		foreach ( self::DISPLAY_FIELDS as $field ) {
			$shown[ $field ] = (string) ( $identity[ $field ] ?? '' );
		}

		return rawurlencode( (string) wp_json_encode( $shown, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
	}

	/**
	 * Encode and sign an identity.
	 *
	 * @param array $identity Keyed by FIELDS.
	 * @return string
	 */
	public static function encode( array $identity ) {
		$payload = array();

		foreach ( self::FIELDS as $field ) {
			$payload[ $field ] = 'expires_at' === $field ? (int) ( $identity[ $field ] ?? 0 ) : (string) ( $identity[ $field ] ?? '' );
		}

		$payload['blog_id'] = Checkpoint::blog_id();

		$encoded = rtrim( strtr( base64_encode( (string) wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- base64url is the cookie format.

		return $encoded . '.' . self::signature( $encoded );
	}

	/**
	 * Verify and decode a passport. Tampered, malformed and expired all read as absent.
	 *
	 * @param string $cookie The cookie value.
	 * @return array|null Keyed by FIELDS.
	 */
	public static function decode( $cookie ) {
		if ( ! is_string( $cookie ) || substr_count( $cookie, '.' ) !== 1 ) {
			return null;
		}

		list( $encoded, $signature ) = explode( '.', $cookie, 2 );

		if ( ! hash_equals( self::signature( $encoded ), $signature ) ) {
			return null;
		}

		$payload = json_decode( (string) base64_decode( strtr( $encoded, '-_', '+/' ) ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- base64url is the cookie format.

		if ( ! is_array( $payload ) || empty( $payload['site_commenter_id'] ) || empty( $payload['provider'] ) ) {
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
			$identity[ $field ] = 'expires_at' === $field ? (int) $payload[ $field ] : (string) ( $payload[ $field ] ?? '' );
		}

		return $identity;
	}

	/**
	 * HMAC over the encoded payload, keyed with the site's auth salt.
	 *
	 * @param string $encoded The base64url payload.
	 * @return string
	 */
	private static function signature( $encoded ) {
		return hash_hmac( 'sha256', self::SIGNING_PURPOSE . '|' . $encoded, wp_salt( 'auth' ) );
	}

	/**
	 * Send a cookie. Raw, because both values are already cookie-safe and the
	 * display one must reach the script exactly as encoded.
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
