<?php
/**
 * Register and handle REST API Endpoints for each data sync entry.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;

class Endpoint {

	/**
	 * @var Data_Sync_Entry $entry - The data sync entry to register the endpoint for.
	 */
	private $entry;

	/**
	 * @var string $rest_namespace - The namespace for the REST API endpoint.
	 */
	private $rest_namespace;

	/**
	 * @var string $route - The route for the REST API endpoint.
	 */
	private $route;

	/**
	 * @var Authenticated_Nonce $nonce - The nonce for the REST API endpoint.
	 */
	private $nonce;

	/**
	 * @param string          $namespace - The namespace for the REST API endpoint.
	 * @param string          $route     - The route for the REST API endpoint.
	 * @param Data_Sync_Entry $entry     The data sync entry to register the endpoint for.
	 */
	public function __construct( $namespace, $key, $entry ) {
		$this->entry          = $entry;
		$this->rest_namespace = $namespace;
		$this->route          = $key;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$key}" );

		$method_map              = array(
			'GET'    => 'get',
			'PUT'    => 'set',
			'POST'   => 'set',
			'PATCH'  => 'merge',
			'DELETE' => 'delete',
		);
		$this->available_methods = array();
		foreach ( $method_map as $http_method => $method_name ) {
			if ( method_exists( $entry, $method_name ) ) {
				$this->available_methods[ $http_method ] = $method_name;
			}
		}
	}

	public function register_rest_route() {
		register_rest_route(
			$this->rest_namespace,
			$this->route,
			array(
				'methods'             => array_keys( $this->available_methods ),
				'callback'            => array( $this, 'handler' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);
	}

	/**
	 * Route the request to the apropriate handler.
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handler( $request ) {
		$http_method = $request->get_method();

		if ( ! isset( $this->available_methods[ $http_method ] ) ) {
			return new \WP_Error( 'invalid_method', 'Invalid method.', array( 'status' => 400 ) );
		}

		try {
			$method_name = $this->available_methods[ $http_method ];
			$params      = $request->get_json_params();
			$result      = $this->entry->$method_name( $params['JSON'] );
			return rest_ensure_response(
				array(
					'status' => 'success',
					'JSON'   => $result,
				)
			);
		} catch ( \Error $e ) {
			return rest_ensure_response(
				new \WP_Error( 500, $e->getMessage(), array( 'status' => 500 ) )
			);
		}
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
		$nonce = $request->get_header( 'X-Jetpack-WP-JS-Sync-Nonce' );
		return $this->nonce->verify( $nonce ) && current_user_can( 'manage_options' );
	}
}
