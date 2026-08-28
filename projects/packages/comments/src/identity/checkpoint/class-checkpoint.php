<?php
/**
 * The comment identity checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * The site's checkpoint for identities carried between sites through WordPress.com.
 *
 * A site cannot read another site's cookie, so WordPress.com vouches for the
 * commenter: a popup opens WordPress.com's connect endpoint on a request this
 * server signed with its Jetpack blog token, and the endpoint posts a one-time
 * code back to the opener, with a name and avatar so the form can say who is
 * commenting. The code rides to this server with the comment, and only then is
 * it traded for the identity over the exchange endpoint, again as the blog. No
 * email and no durable identifier cross the browser, and no token reaches it.
 *
 * This class holds the pieces every other part of the checkpoint shares: the
 * provider list, the meta keys, the URLs the front end needs, and the signing.
 */
class Checkpoint {

	/**
	 * Providers a commenter can identify with, in the order they are shown.
	 */
	const PROVIDERS = array( 'google', 'facebook', 'wordpress' );

	/**
	 * The first-party cookie holding the redeemed identity.
	 */
	const COOKIE_NAME = 'jetpack_comment_passport';

	/**
	 * How long a signed connect request stays good. WordPress.com caps this at
	 * ten minutes; a click to a popup needs seconds.
	 */
	const SIGNATURE_TTL = 300;

	/**
	 * Comment meta holding WordPress.com's opaque per-person-per-site id for the
	 * commenter. Stable on this site, different on every other, not reversible.
	 */
	const META_SITE_COMMENTER_ID = 'jp_ci_site_commenter_id';

	/**
	 * Comment meta holding the provider the commenter identified with. The
	 * Highlander key `hc_post_as` is the backwards-compatible equivalent.
	 */
	const META_PROVIDER = 'jp_ci_provider';

	/**
	 * Comment meta holding the commenter's avatar URL. The Highlander key
	 * `hc_avatar` is the backwards-compatible equivalent.
	 */
	const META_AVATAR = 'jp_ci_avatar';

	/**
	 * Highlander provider key, read as a fallback where the new key is absent.
	 */
	const OLD_META_PROVIDER = 'hc_post_as';

	/**
	 * Highlander avatar key, read as a fallback where the new key is absent.
	 */
	const OLD_META_AVATAR = 'hc_avatar';

	/**
	 * Register the checkpoint's hooks. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		Comment_Hooks::init();
		REST_Controller::init();
		Privacy::init();
	}

	/**
	 * Whether the checkpoint can run: the site is connected, so it holds the blog
	 * token the exchange call is signed with.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) || ! class_exists( '\Jetpack_Options' ) ) {
			return false;
		}

		return ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->is_connected()
			&& (int) \Jetpack_Options::get_option( 'id' ) > 0
			&& count( self::providers() ) > 0;
	}

	/**
	 * The blog WordPress.com mints codes for and the exchange authenticates as.
	 *
	 * @return int
	 */
	public static function blog_id() {
		return class_exists( '\Jetpack_Options' ) ? (int) \Jetpack_Options::get_option( 'id' ) : 0;
	}

	/**
	 * The providers offered on this site.
	 *
	 * @return string[]
	 */
	public static function providers() {
		/**
		 * Filter the identity providers the comment form offers.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $providers Provider slugs, a subset of the PROVIDERS list.
		 */
		$providers = (array) apply_filters( 'jetpack_comment_identity_providers', self::PROVIDERS );

		return array_values( array_intersect( self::PROVIDERS, $providers ) );
	}

	/**
	 * WordPress.com's connect endpoint. Filterable so a sandbox can point it
	 * elsewhere; production is public-api.wordpress.com.
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
			'https://public-api.wordpress.com/comments/identity/connect'
		);
	}

	/**
	 * A connect URL for one attempt, signed as this blog so WordPress.com only
	 * mints codes in a site's name at that site's request. The challenge is
	 * issued here too, since it is signed; the browser compares it on the way
	 * back. The signature covers blog_id, challenge, expires, origin and
	 * provider, sorted and newline-joined, keyed with the blog token.
	 *
	 * @param string $provider One of providers().
	 * @param string $origin   The page origin WordPress.com posts the result to.
	 * @return array|\WP_Error The url and the challenge.
	 */
	public static function signed_connect_url( $provider, $origin ) {
		if ( ! in_array( $provider, self::providers(), true ) ) {
			return new \WP_Error( 'invalid_provider', __( 'That sign-in provider is not offered here.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		if ( ! self::is_site_origin( $origin ) ) {
			return new \WP_Error( 'invalid_origin', __( 'That origin is not this site.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$token = ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->get_tokens()->get_access_token();
		if ( ! is_object( $token ) || empty( $token->secret ) ) {
			return new \WP_Error( 'not_connected', __( 'This site is not connected to WordPress.com.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$params = array(
			'blog_id'   => (string) self::blog_id(),
			'challenge' => bin2hex( random_bytes( 24 ) ),
			'expires'   => (string) ( time() + self::SIGNATURE_TTL ),
			'origin'    => $origin,
			'provider'  => $provider,
		);

		$parts = array();
		foreach ( $params as $key => $value ) {
			$parts[] = $key . '=' . $value;
		}

		$params['signature'] = hash_hmac( 'sha256', implode( "\n", $parts ), (string) $token->secret );

		return array(
			'url'       => add_query_arg( array_map( 'rawurlencode', $params ), self::connect_url() ),
			'challenge' => $params['challenge'],
		);
	}

	/**
	 * The origin the connect page answers from, and so the only origin the
	 * browser accepts a result from. Follows the connect URL filter, so a sandbox
	 * pointed elsewhere still gets its messages through.
	 *
	 * @return string Scheme, host and any port; no path, no trailing slash.
	 */
	public static function connect_origin() {
		$parts  = wp_parse_url( self::connect_url() );
		$origin = ( isset( $parts['scheme'] ) ? $parts['scheme'] : 'https' ) . '://' . ( isset( $parts['host'] ) ? $parts['host'] : '' );

		if ( isset( $parts['port'] ) ) {
			$origin .= ':' . $parts['port'];
		}

		return $origin;
	}

	/**
	 * Whether an origin the browser reports is one this site is served on.
	 *
	 * This is what stops impersonation. The exchange accepts a code from the
	 * comment POST, so a signed URL naming an origin someone else controls would
	 * let them collect a commenter's code from their own page and post as them.
	 * The origin is therefore checked two ways, neither of which the request gets
	 * to assert about itself: the value must name a host this site's home or site
	 * URL names (with or without www), and the request's own Origin header, which
	 * a browser sends on every POST and cannot forge, must say the same. HTTP_HOST
	 * is deliberately not consulted; a caller picks that.
	 *
	 * @param mixed $origin The origin, as window.location.origin gives it.
	 * @return bool
	 */
	private static function is_site_origin( $origin ) {
		if ( ! is_string( $origin ) || strlen( $origin ) > 255
			|| ! preg_match( '#^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$#', $origin ) ) {
			return false;
		}

		$header = isset( $_SERVER['HTTP_ORIGIN'] ) ? (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- compared, never output.
		if ( $header !== $origin ) {
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
	 * Everything the front end needs to run the checkpoint.
	 *
	 * @return array
	 */
	public static function settings() {
		if ( ! self::is_available() ) {
			return array( 'enabled' => false );
		}

		$labels = array(
			'google'    => __( 'Continue with Google', 'jetpack-comments' ),
			'facebook'  => __( 'Continue with Facebook', 'jetpack-comments' ),
			'wordpress' => __( 'Continue with WordPress.com', 'jetpack-comments' ),
		);

		$providers = array();
		foreach ( self::providers() as $provider ) {
			$providers[] = array(
				'id'    => $provider,
				'label' => $labels[ $provider ],
			);
		}

		return array(
			'enabled'       => true,
			'providers'     => $providers,
			'connectOrigin' => self::connect_origin(),
			'signUrl'       => rest_url( REST_Controller::NAMESPACE . '/identity/connect' ),
			'logoutUrl'     => rest_url( REST_Controller::NAMESPACE . '/identity' ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'codeField'     => Comment_Hooks::CODE_FIELD,
			'disclosure'    => __( 'Your name, email address and avatar from the provider you choose are shared with this site and shown with your comment.', 'jetpack-comments' ),
		);
	}
}
