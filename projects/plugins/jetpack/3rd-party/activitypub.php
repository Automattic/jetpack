<?php
/**
 * Compatibility shim so Jetpack-signed admin requests can reach the
 * ActivityPub plugin's auth-gated client-to-server endpoints, used by the
 * Jetpack-connected site's wp.com Reader to read the timeline and publish
 * notes.
 *
 * Scope:
 * - Three routes, with method affinity (inbox GET, proxy POST, outbox POST).
 * - Blog-mode AP sites only; user-mode is out of scope.
 * - Real OAuth flows are never overridden — when a Bearer is present we
 *   defer to the plugin's normal verification.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// The upstream filter passes a third `$scope` arg; the shim deliberately
// drops it (`accepted_args = 2`) because a Jetpack-signed admin grants full
// client-to-server access by design.
add_filter( 'activitypub_oauth_check_permission', 'jetpack_activitypub_reader_auth_check_permission', 10, 2 );

/**
 * Filter callback for `activitypub_oauth_check_permission`.
 *
 * Returns `true` to authorise the request without an AP OAuth bearer when
 * every scope predicate holds. Returns the incoming `$result` (typically
 * null) otherwise, letting the plugin's normal OAuth check run.
 *
 * `$request` is typed `mixed` rather than `\WP_REST_Request` because the
 * WordPress filter ABI provides no guarantee — `is_target_route()` performs
 * the shape check before any method is dispatched on the argument.
 *
 * @since 15.9
 *
 * @param mixed $result  Result from a previous filter, or null.
 * @param mixed $request The REST request being checked, expected to be a `\WP_REST_Request`.
 * @return mixed `true` when authorised; `$result` otherwise.
 */
function jetpack_activitypub_reader_auth_check_permission( $result, $request ) {
	if ( null !== $result ) {
		return $result;
	}

	// Only run on sites where the wp.com Reader actually needs the bridge:
	// connected, non-offline Jetpack sites that aren't wpcom Simple. Simple
	// sites already share the AP OAuth datastore with the plugin and pass the
	// standard verify_authentication path.
	if (
		( new Host() )->is_wpcom_simple()
		|| ! ( new Connection_Manager() )->is_connected()
		|| ( new Status() )->is_offline_mode()
	) {
		return $result;
	}

	// A real OAuth client beat us here. Let the plugin handle it normally.
	if ( jetpack_activitypub_reader_auth_is_oauth_request() ) {
		return $result;
	}

	if ( ! jetpack_activitypub_reader_auth_is_target_route( $request ) ) {
		return $result;
	}

	if ( ! jetpack_activitypub_reader_auth_is_jetpack_signed() ) {
		return $result;
	}

	// Must follow the signing check: Rest_Authentication installs the wpcom
	// user on user-token signed requests, so the current user is only trustworthy
	// after that gate has passed.
	if ( ! current_user_can( 'manage_options' ) ) {
		return $result;
	}

	if ( ! jetpack_activitypub_reader_auth_is_blog_mode() ) {
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
 * @since 15.9
 *
 * @return bool
 */
function jetpack_activitypub_reader_auth_is_oauth_request(): bool {
	if ( ! class_exists( 'Activitypub\OAuth\Server' ) ) {
		return false;
	}
	return \Activitypub\OAuth\Server::is_oauth_request();
}

/**
 * Whether the current request was Jetpack-signed (blog or user token).
 *
 * Both signing flavours are accepted: the wpcom bridge signs outbound calls
 * with the user's Jetpack token when one is available and falls back to the
 * blog token otherwise. Either is sufficient evidence the call originated
 * from a wpcom shadow request the destination already trusts.
 *
 * @since 15.9
 *
 * @return bool
 */
function jetpack_activitypub_reader_auth_is_jetpack_signed(): bool {
	if ( ! class_exists( Rest_Authentication::class ) ) {
		return false;
	}
	return Rest_Authentication::is_signed_with_user_token()
		|| Rest_Authentication::is_signed_with_blog_token();
}

/**
 * Whether the destination AP plugin is configured to expose a blog actor.
 *
 * Accepts both `'blog'` (blog-only) and `'actor_blog'` (per-user + blog).
 * On `'actor_blog'` sites the blog actor behaves identically to pure
 * blog-mode and is the only actor the wpcom Reader operates on — the
 * route patterns are pinned to `user_id=0`, so widening the grant to
 * arbitrary user actors is not possible here.
 *
 * Pure user-mode (`'actor'`) is still rejected: the blog actor doesn't
 * exist on those sites, so authorizing `user_id=0` routes would be
 * nonsensical.
 *
 * Uses a `null` sentinel default so an unset option is treated as
 * "unknown, deny" rather than implicitly accepted — the AP plugin's own
 * option default is `ACTIVITYPUB_ACTOR_MODE` (i.e. `'actor'`), so
 * falling back to a blog-accepting mode here would silently widen the
 * grant surface on fresh installs.
 *
 * @since 15.9
 *
 * @return bool
 */
function jetpack_activitypub_reader_auth_is_blog_mode(): bool {
	$mode = get_option( 'activitypub_actor_mode', null );
	return 'blog' === $mode || 'actor_blog' === $mode;
}

/**
 * Whether the request targets one of the three Reader auth-gated routes.
 *
 * Each pattern is anchored to the AP namespace and includes a method affinity,
 * so callers can't widen the shim by sending an unexpected verb at an allowed
 * path (e.g. POSTing to inbox).
 *
 * @since 15.9
 *
 * @param \WP_REST_Request $request The REST request.
 * @return bool
 */
function jetpack_activitypub_reader_auth_is_target_route( $request ): bool {
	if ( ! is_object( $request )
		|| ! method_exists( $request, 'get_route' )
		|| ! method_exists( $request, 'get_method' )
	) {
		return false;
	}

	$route  = (string) $request->get_route();
	$method = strtoupper( (string) $request->get_method() );

	// Patterns are pinned to the blog actor (user_id 0) on purpose: the wpcom
	// Reader only operates on the blog actor, and granting the OAuth bypass
	// for arbitrary user ids would silently widen the surface if the AP
	// plugin ever loosened its downstream `verify_owner` check.
	static $patterns = array(
		'GET'  => array(
			'#^/activitypub/\d+\.\d+/(?:users|actors)/0/inbox/?$#',
		),
		'POST' => array(
			'#^/activitypub/\d+\.\d+/proxy/?$#',
			'#^/activitypub/\d+\.\d+/(?:users|actors)/0/outbox/?$#',
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
