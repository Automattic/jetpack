<?php
/**
 * Registers the REST routes behind Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

/**
 * The routes the settings screen reads and saves through, on every platform.
 *
 * `wpcom/v2` because on WordPress.com Simple, wp-admin `apiFetch` goes through public-api,
 * which serves only a fixed set of namespaces: `jetpack/v4` or our own would 404 there.
 */
final class Endpoints {

	/**
	 * REST namespace.
	 */
	public const REST_NAMESPACE = 'wpcom/v2';

	/**
	 * Prefix every route shares.
	 */
	public const BASE = 'sharing-likes';

	/**
	 * Register the routes when the REST server starts.
	 *
	 * Callers must not gate this on module state or options: on Simple the routes
	 * register before public-api switches to the requested site.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register every route.
	 */
	public static function register_routes(): void {
		( new Settings_Controller() )->register_routes();
		( new Status_Controller() )->register_routes();
		( new Services_Controller() )->register_routes();
	}
}
