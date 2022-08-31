<?php

namespace Automattic\Jetpack\Packages\Async_Option;

class Endpoint {

	/**
	 * @var Async_Option $option
	 */
	private $option;

	/**
	 * @var string $rest_namespace
	 */
	private $rest_namespace;


	/**
	 * @var string $route
	 */
	private $route;

	/**
	 * @var Authenticated_Nonce
	 */
	private $nonce;

	/**
	 * @param string       $namespace
	 * @param Async_Option $option
	 */
	public function __construct( $namespace, $route, Async_Option $option ) {
		$this->option         = $option;
		$this->rest_namespace = $namespace;
		$this->route          = $route;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$option->key()}" );
	}

	public function register_rest_route() {
		register_rest_route(
			$this->rest_namespace,
			$this->route,
			array(
				'methods'             => \WP_REST_Server::ALLMETHODS,
				'callback'            => array( $this, 'handler' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);
	}

	/**
	 * Route the request to the apropriate handler.
	 *
	 * @param \WP_REST_Request $request
	 */
	public function handler( $request ) {
		$methods = [
			'GET'    => 'handle_get',
			'POST'   => 'handle_post',
			'DELETE' => 'handle_delete',
		];

		if ( ! isset( $methods[ $request->get_method() ] ) ) {
			return new \WP_Error( 'invalid_method', 'Invalid method.', array( 'status' => 400 ) );
		}

		$method = $methods[ $request->get_method() ];

		return rest_ensure_response( $this->$method( $request ) );
	}



	/**
	 * Handle GET Requests
	 *
	 * @param \WP_REST_Request $request
	 */
	public function handle_get( $request ) {
		return $this->option->get();
	}

	/**
	 * Handle POST Requests
	 *
	 * @param \WP_REST_Request $request
	 */
	public function handle_post( $request ) {
		$this->option->set( $request->get_body() );
		if ( $this->option->has_errors() ) {
			return new \WP_Error( 400, $this->option->get_errors(), array( 'status' => 400 ) );
		}
		return $this->option->get();
	}

	/**
	 * @param \WP_REST_Request $request
	 */
	public function handle_delete( $request ) {
		$this->option->delete();
		return $this->option->get();
	}

	/**
	 * Create a nonce for this endpoint
	 *
	 * @return false|string
	 */
	public function create_nonce() {
		return $this->nonce->create();
	}

	/**
	 * @param \WP_REST_Request $request
	 */
	public function permissions( $request ) {
		return current_user_can( 'manage_options' ) && $this->nonce->verify( $request->get_header( 'X-Async-Options-Nonce' ) );
	}
}
