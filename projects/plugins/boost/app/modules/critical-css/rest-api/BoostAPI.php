<?php
/**
 * Boost REST API handler.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

/**
 * Class Boost API.
 */
class BoostAPI {

	/**
	 * Available route classes.
	 *
	 * @var string[]
	 */
	protected $available_routes = array(
		GeneratorStatus::class,
		GeneratorRequest::class,
		GeneratorSuccess::class,
		GeneratorError::class,
		RecommendationsDismiss::class,
		RecommendationsReset::class,
	);

	/**
	 * Route instances.
	 *
	 * @var array
	 */
	protected $routes = array();

	/**
	 * Protected route instances.
	 *
	 * @var array
	 */
	protected $protected_routes = array();

	/**
	 * Constructor.
	 */
	public function __construct() {

		foreach ( $this->available_routes as $route_class ) {
			$route                          = new $route_class();
			$this->routes[ $route->name() ] = $route;

			if ( $route instanceof NonceProtection ) {
				$this->protected_routes[] = $route->name();
			}
		}
	}

	/**
	 * Register all routes.
	 */
	public function register_routes() {
		foreach ( $this->routes as $route ) {
			$this->register_route( $route );
		}
	}

	/**
	 * Get nonces for protected routes.
	 *
	 * @return array
	 */
	public function get_nonces() {
		return array_combine( $this->protected_routes, array_map( 'wp_create_nonce', $this->protected_routes ) );
	}

	/**
	 * Register route for given route class instance.
	 *
	 * @param BoostEndpoint $route Route instance.
	 */
	public function register_route( $route ) {
		// Developer Mode:
		// Make sure routes don't accidentally start with a slash.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			if ( '/' === substr( $route->name(), 0, 1 ) ) {
				return;
			}
		}

		// Allow the endpoint to handle permissions by default.
		$permission_callback = array( $route, 'permission_callback' );

		// But if a class requires NonceProtection,
		// Wrap it in a NonceProtection class.
		if ( $route instanceof NonceProtection ) {
			$nonce_wrapper       = new NonceProtectedEndpoint( $route );
			$permission_callback = array( $nonce_wrapper, 'permission_callback' );
		}

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/' . $route->name(),
			array(
				'methods'             => $route->request_methods(),
				'callback'            => array( $route, 'response' ),
				'permission_callback' => $permission_callback,
			)
		);
	}

}
