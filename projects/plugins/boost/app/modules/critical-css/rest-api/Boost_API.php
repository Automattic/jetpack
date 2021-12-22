<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

class Boost_API {

	protected $available_routes = [
		Generator_Status::class,
		Generator_Request::class,
		Generator_Success::class,
		Generator_Error::class,
		Recommendations_Dismiss::class,
		Recommendations_Reset::class,
	];

	protected $routes           = [];
	protected $public_routes    = [];
	protected $protected_routes = [];

	public function __construct() {

		foreach ( $this->available_routes as $route_class ) {
			$route                          = new $route_class();
			$this->routes[ $route->name() ] = $route;

			if ( $route instanceof Nonce_Protection ) {
				$this->protected_routes[] = $route->name();
			} else {
				$this->public_routes[] = $route->name();
			}

		}
	}

	public function register_routes() {
		foreach ( $this->routes as $name => $route ) {
			$this->register_route( $route );
		}
	}

	public function get_nonces() {
		return array_combine( $this->protected_routes, array_map( 'wp_create_nonce', $this->protected_routes ) );
	}

	public function register_route( Boost_Endpoint $route ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			if ( '/' === substr( $route->name(), 0, 1 ) ) {
				error_log( "Endpoint method shouldn't start with a slash" );
			}
		}

		// Allow the endpoint to handle permissions by default
		$permission_callback = array( $route, 'permission_callback' );

		// But if a class requires Nonce_Protection,
		// Wrap it in a Nonce_Protection class
		if ( $route instanceof Nonce_Protection ) {
			$nonce_wrapper       = new Nonce_Protected_Endpoint( $route );
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
