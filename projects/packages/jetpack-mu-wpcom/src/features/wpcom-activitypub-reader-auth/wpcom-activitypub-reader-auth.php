<?php
/**
 * Reader Fediverse — destination-side OAuth permission shim for the
 * ActivityPub plugin's auth-gated REST endpoints.
 *
 * Lets wpcom-originated, Jetpack-signed admin calls reach the three AP
 * client-to-server endpoints used by the Reader Fediverse pane on
 * WordPress.com (`/proxy`, `/actors/{id}/inbox`, `/actors/{id}/outbox`)
 * without minting a destination-side OAuth bearer. The companion bridge
 * additions live in the wpcom REST layer; this file is the destination
 * half of that contract.
 *
 * Scope:
 * - Three routes, with method affinity (inbox GET, proxy POST, outbox POST).
 * - Blog-mode AP sites only; user-mode is out of scope for v1.
 * - Real OAuth flows are never overridden — when a Bearer is present we
 *   defer to the plugin's normal verification.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Rest_Authentication;

/**
 * Filter callback for `activitypub_oauth_check_permission`.
 *
 * Returns `true` to authorise the request without an AP OAuth bearer when
 * every scope predicate holds. Returns the incoming `$result` (typically
 * null) otherwise, letting the plugin's normal OAuth check run.
 *
 * @param mixed            $result  Result from a previous filter, or null.
 * @param \WP_REST_Request $request The REST request being checked.
 * @param string|null      $scope   Required scope (unused — gating is by route + method).
 * @return mixed `true` when authorised; `$result` otherwise.
 */
function wpcom_activitypub_reader_auth_check_permission( $result, $request, $scope = null ) {
	if ( null !== $result ) {
		return $result;
	}

	// A real OAuth client beat us here. Let the plugin handle it normally.
	if ( wpcom_activitypub_reader_auth_is_oauth_request() ) {
		return $result;
	}

	if ( ! wpcom_activitypub_reader_auth_is_target_route( $request ) ) {
		return $result;
	}

	if ( ! wpcom_activitypub_reader_auth_is_jetpack_signed() ) {
		return $result;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return $result;
	}

	if ( ! wpcom_activitypub_reader_auth_is_blog_mode() ) {
		return $result;
	}

	return true;
}

/**
 * Whether the current request carries a verified AP OAuth bearer.
 *
 * Wrapped so the `Server` class absence in non-AP environments is a clean
 * `false` rather than a fatal.
 *
 * @return bool
 */
function wpcom_activitypub_reader_auth_is_oauth_request(): bool {
	return class_exists( '\Activitypub\OAuth\Server' )
		&& \Activitypub\OAuth\Server::is_oauth_request();
}

/**
 * Whether the current request was Jetpack-signed (blog or user token).
 *
 * Both signing flavours are accepted: the wpcom bridge signs outbound calls
 * with the user's Jetpack token when one is available and falls back to the
 * blog token otherwise. Either is sufficient evidence the call originated
 * from a wpcom shadow request the destination already trusts.
 *
 * @return bool
 */
function wpcom_activitypub_reader_auth_is_jetpack_signed(): bool {
	if ( ! class_exists( Rest_Authentication::class ) ) {
		return false;
	}
	return Rest_Authentication::is_signed_with_user_token()
		|| Rest_Authentication::is_signed_with_blog_token();
}

/**
 * Whether the destination AP plugin is configured for blog-mode actors.
 *
 * The shim deliberately ignores user-mode sites: the wpcom Reader only
 * operates on the blog actor (`user_id=0`), and short-circuiting OAuth for
 * user-mode routes would let admins act for arbitrary individual actors.
 *
 * @return bool
 */
function wpcom_activitypub_reader_auth_is_blog_mode(): bool {
	return 'blog' === get_option( 'activitypub_actor_mode', 'blog' );
}

/**
 * Whether the request targets one of the three Reader-Fediverse auth-gated routes.
 *
 * Each pattern is anchored to the AP namespace and includes a method affinity,
 * so callers can't widen the shim by sending an unexpected verb at an allowed
 * path (e.g. POSTing to inbox).
 *
 * @param \WP_REST_Request $request The REST request.
 * @return bool
 */
function wpcom_activitypub_reader_auth_is_target_route( $request ): bool {
	if ( ! is_object( $request )
		|| ! method_exists( $request, 'get_route' )
		|| ! method_exists( $request, 'get_method' )
	) {
		return false;
	}

	$route  = (string) $request->get_route();
	$method = strtoupper( (string) $request->get_method() );

	static $patterns = array(
		'GET'  => array(
			'#^/activitypub/\d+\.\d+/(?:users|actors)/-?\d+/inbox/?$#',
		),
		'POST' => array(
			'#^/activitypub/\d+\.\d+/proxy/?$#',
			'#^/activitypub/\d+\.\d+/(?:users|actors)/-?\d+/outbox/?$#',
		),
	);

	if ( ! isset( $patterns[ $method ] ) ) {
		return false;
	}

	foreach ( $patterns[ $method ] as $pattern ) {
		if ( preg_match( $pattern, $route ) ) {
			return true;
		}
	}

	return false;
}

add_filter( 'activitypub_oauth_check_permission', 'wpcom_activitypub_reader_auth_check_permission', 10, 3 );
