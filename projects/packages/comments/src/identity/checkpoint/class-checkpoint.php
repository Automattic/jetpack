<?php
/**
 * The comment identity checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Sign-in through WordPress.com: this server signs a connect request as the
 * blog, a popup collects a one-time code, the code rides back with the comment,
 * and the server exchanges it then. Shared constants, URLs and signing live here.
 */
class Checkpoint {

	/**
	 * Providers WordPress.com can vouch through. Only read back, to validate a
	 * stored identity; the connect page picks the provider itself.
	 */
	const PROVIDERS = array( 'wordpress', 'facebook', 'google' );

	/**
	 * The wp_ prefix is load-bearing: Batcache, WP Super Cache and most host
	 * caches bypass for cookies starting wp/wordpress/comment_author, which is
	 * what keeps a recognised commenter off cached pages (stale nonce, stale
	 * identity) and their identity out of the cache for everyone else. Core
	 * names its commenter cookies comment_author_* for the same reason.
	 */
	const COOKIE_NAME = 'wp_jetpack_comment_passport';

	/**
	 * A signed request is minted with the page and has to outlive a reader
	 * writing a long comment. WordPress.com caps it at two hours.
	 */
	const SIGNATURE_TTL = 2 * HOUR_IN_SECONDS;

	/**
	 * WordPress.com's opaque per-person-per-site id. Never renamed once shipped.
	 */
	const META_SITE_COMMENTER_ID = 'jp_ci_site_commenter_id';

	const META_PROVIDER = 'jp_ci_provider';

	const META_AVATAR = 'jp_ci_avatar';

	/**
	 * Register the checkpoint's hooks.
	 *
	 * @return void
	 */
	public static function init() {
		Comment_Hooks::init();
		REST_Controller::init();
	}

	/**
	 * Whether the site is connected.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) || ! class_exists( '\Jetpack_Options' ) ) {
			return false;
		}

		return ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->is_connected()
			&& self::blog_id() > 0;
	}

	/**
	 * The WordPress.com blog ID.
	 *
	 * @return int
	 */
	public static function blog_id() {
		return class_exists( '\Jetpack_Options' ) ? (int) \Jetpack_Options::get_option( 'id' ) : 0;
	}

	/**
	 * WordPress.com's connect endpoint.
	 *
	 * @return string
	 */
	public static function connect_url() {
		/**
		 * Filter the base URL of the WordPress.com connect endpoint.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $url WordPress.com's connect endpoint.
		 */
		return (string) apply_filters(
			'jetpack_comment_identity_connect_url',
			'https://public-api.wordpress.com/connect/'
		);
	}

	/**
	 * A connect URL for one attempt, signed with the blog token over the sorted,
	 * newline-joined params. The challenge is issued here since it is signed.
	 *
	 * @param string $origin The page origin WordPress.com posts the result to.
	 * @return array|\WP_Error The url, the challenge, when the signature expires, and the origin it was signed for.
	 */
	public static function signed_connect_url( $origin ) {
		if ( ! self::is_site_origin( $origin ) ) {
			return new \WP_Error( 'invalid_origin', __( 'That origin is not this site.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$token = ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->get_tokens()->get_access_token();
		if ( ! is_object( $token ) || empty( $token->secret ) ) {
			return new \WP_Error( 'not_connected', __( 'This site is not connected to WordPress.com.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$expires = time() + self::SIGNATURE_TTL;
		$params  = array(
			'blog_id'   => (string) self::blog_id(),
			'challenge' => bin2hex( random_bytes( 24 ) ),
			'expires'   => (string) $expires,
			'origin'    => $origin,
		);

		// The signature is over the sorted params; alphabetical order above is
		// incidental, this is what WordPress.com verifies against.
		ksort( $params );

		$parts = array();
		foreach ( $params as $key => $value ) {
			$parts[] = $key . '=' . $value;
		}

		$params['signature'] = hash_hmac( 'sha256', implode( "\n", $parts ), (string) $token->secret );

		// Selects the handler behind /connect/ and nothing more, so not signed.
		// The browser appends prompt=1 for "not you?" the same way.
		$params['comment_identity'] = '1';

		return array(
			'url'       => add_query_arg( array_map( 'rawurlencode', $params ), self::connect_url() ),
			'challenge' => $params['challenge'],
			'expires'   => $expires,
			'origin'    => $origin,
		);
	}

	/**
	 * The origin of the connect URL, which is the only origin the browser
	 * accepts a result from. Follows the filter so a sandbox works.
	 *
	 * @return string
	 */
	public static function connect_origin() {
		return self::origin_of( self::connect_url() );
	}

	/**
	 * The origin the site's pages are served from, for the request minted with
	 * the page. A page reached on another of the site's hosts re-mints from the
	 * browser, which sends the origin it is actually on.
	 *
	 * @return string
	 */
	public static function site_origin() {
		return self::origin_of( home_url() );
	}

	/**
	 * The scheme, host and port of a URL.
	 *
	 * @param string $url The URL.
	 * @return string
	 */
	private static function origin_of( $url ) {
		$parts  = wp_parse_url( $url );
		$origin = ( $parts['scheme'] ?? 'https' ) . '://' . ( $parts['host'] ?? '' );

		if ( isset( $parts['port'] ) ) {
			$origin .= ':' . $parts['port'];
		}

		return $origin;
	}

	/**
	 * Whether an origin is one this site is served on.
	 *
	 * This is the impersonation guard: the exchange takes a code from the comment
	 * POST, so a signed URL naming someone else's origin would let them collect a
	 * commenter's code and post as them. The host must be home or site URL's,
	 * with or without www. HTTP_HOST is deliberately not used; a caller picks that.
	 *
	 * @param mixed $origin The origin, as window.location.origin gives it.
	 * @return bool
	 */
	public static function is_site_origin( $origin ) {
		if ( ! is_string( $origin ) || strlen( $origin ) > 255
			|| ! preg_match( '#^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$#', $origin ) ) {
			return false;
		}

		$host    = strtolower( (string) wp_parse_url( $origin, PHP_URL_HOST ) );
		$allowed = array();

		foreach ( array( home_url(), site_url() ) as $url ) {
			$known = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
			if ( '' === $known ) {
				continue;
			}
			$allowed[] = $known;
			$allowed[] = str_starts_with( $known, 'www.' ) ? substr( $known, 4 ) : 'www.' . $known;
		}

		return in_array( $host, $allowed, true );
	}

	/**
	 * Everything the front end needs, a signed request for the first attempt
	 * included.
	 *
	 * @return array
	 */
	public static function settings() {
		if ( ! self::is_available() ) {
			return array( 'enabled' => false );
		}

		$signed = self::signed_connect_url( self::site_origin() );
		if ( is_wp_error( $signed ) ) {
			return array( 'enabled' => false );
		}

		return array(
			'enabled'       => true,
			'connect'       => $signed,
			'connectOrigin' => self::connect_origin(),
			'signUrl'       => rest_url( REST_Controller::NAMESPACE . '/identity/connect' ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'codeField'     => Comment_Hooks::CODE_FIELD,
		);
	}
}
