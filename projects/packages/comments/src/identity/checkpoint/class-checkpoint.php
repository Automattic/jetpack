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

	const PROVIDERS = array( 'google', 'facebook', 'wordpress' );

	const COOKIE_NAME = 'jetpack_comment_passport';

	/**
	 * WordPress.com caps a signed request at 600s.
	 */
	const SIGNATURE_TTL = 300;

	/**
	 * WordPress.com's opaque per-person-per-site id. Never renamed once shipped.
	 */
	const META_SITE_COMMENTER_ID = 'jp_ci_site_commenter_id';

	const META_PROVIDER = 'jp_ci_provider';

	const META_AVATAR = 'jp_ci_avatar';

	/**
	 * Highlander's keys, read as fallbacks for older comments.
	 */
	const OLD_META_PROVIDER = 'hc_post_as';

	const OLD_META_AVATAR = 'hc_avatar';

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
	 * Whether the site is connected and offers at least one provider.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) || ! class_exists( '\Jetpack_Options' ) ) {
			return false;
		}

		return ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->is_connected()
			&& self::blog_id() > 0
			&& count( self::providers() ) > 0;
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
			'https://public-api.wordpress.com/comments/identity/connect'
		);
	}

	/**
	 * A connect URL for one attempt, signed with the blog token over the sorted,
	 * newline-joined params. The challenge is issued here since it is signed.
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
	 * The origin of the connect URL, which is the only origin the browser
	 * accepts a result from. Follows the filter so a sandbox works.
	 *
	 * @return string
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
	 * Whether an origin is one this site is served on.
	 *
	 * This is the impersonation guard: the exchange takes a code from the comment
	 * POST, so a signed URL naming someone else's origin would let them collect a
	 * commenter's code and post as them. Neither check trusts the request about
	 * itself: the host must be home or site URL's (with or without www), and the
	 * browser's own Origin header, sent on every POST and unforgeable, must agree.
	 * HTTP_HOST is deliberately not used; a caller picks that.
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
	 * Everything the front end needs.
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
