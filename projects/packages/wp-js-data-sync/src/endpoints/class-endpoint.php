<?php
/**
 * Register and handle REST API Endpoints for each data sync entry.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Can_Update;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;

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
	 * @var string[] - Available HTTP Methods for this instance.
	 */
	private $methods = array( 'GET' => 'handle_get' );

	/**
	 * @param string                                          $namespace - The namespace for the REST API endpoint.
	 * @param string                                          $route     - The route for the REST API endpoint.
	 * @param Data_Sync_Entry & Can_Set|Can_Update|Can_Delete $entry     The data sync entry to register the endpoint for.
	 */
	public function __construct( $namespace, $key, $entry ) {
		$this->entry          = $entry;
		$this->rest_namespace = $namespace;
		$this->route          = $key;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$key}" );

		if ( $entry instanceof Can_Set ) {
			$this->methods['PUT'] = 'handle_put';
			// Even though technically incorrect, at the moment we're using POST as patch
			// so for backwards compatibility, I'm adding this here
			// @TODO: Before merge, create an issue:
			$this->methods['POST'] = 'handle_put';
		}

		if ( $entry instanceof Can_Update ) {
			$this->methods['PATCH'] = 'handle_patch';
		}

		if ( $entry instanceof Can_Delete ) {
			$this->methods['DELETE'] = 'handle_delete';
		}
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
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handler( $request ) {
		$http_method = $request->get_method();
		if ( ! isset( $this->methods[ $http_method ] ) ) {
			return new \WP_Error( 'invalid_method', 'Invalid method.', array( 'status' => 400 ) );
		}

		$method_name = $this->methods[ $http_method ];
		if ( ! method_exists( $this, $method_name ) ) {
			return new \WP_Error( 'invalid_method', 'Method missing.', array( 'status' => 500 ) );
		}

		return rest_ensure_response( $this->$method_name( $request ) );
	}

	/**
	 * Handle GET Requests
	 *
	 * @param \WP_REST_Request $request
	 */
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function handle_get( $request ) {
		try {
			return array(
				'status' => 'success',
				'JSON'   => $this->entry->get(),
			);
		} catch ( \Error $e ) {
			return new \WP_Error( 500, $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * @param $request \WP_REST_Request - The request object.
	 *
	 * @return mixed|\WP_Error
	 */
	public function handle_put( $request ) {
		$input = $request->get_json_params();
		try {
			$this->entry->set( $input['JSON'] );
			return array(
				'status' => 'success',
				'JSON'   => $this->entry->get(),
			);
		} catch ( \Error $e ) {
			return new \WP_Error( 500, $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function handle_patch( $request ) {
		$input = $request->get_json_params();
		try {
			$this->entry->update( $input['JSON'] );
			return array(
				'status' => 'success',
				'JSON'   => $this->entry->get(),
			);
		} catch ( \Error $e ) {
			return new \WP_Error( 500, $e->getMessage(), array( 'status' => 500 ) );
		}

	}

	public function handle_delete( $request ) {
		try {
			$this->entry->delete();
			return array(
				'status' => 'success',
				'JSON'   => $this->entry->get(),
			);
		} catch ( \Error $e ) {
			return new \WP_Error( 500, $e->getMessage(), array( 'status' => 500 ) );
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
