<?php
/**
 * Register and handle REST API Endpoints for each data sync entry.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;

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
	 * @var string $route_base - The route for the REST API endpoint.
	 */
	private $route_base;

	/**
	 * @var Authenticated_Nonce $nonce - The nonce for the REST API endpoint.
	 */
	private $nonce;

	/**
	 * @param string          $namespace - The namespace for the REST API endpoint.
	 * @param string          $route     - The route for the REST API endpoint.
	 * @param Data_Sync_Entry $entry     The data sync entry to register the endpoint for.
	 */
	public function __construct( $namespace, $route, $entry ) {
		$this->entry          = $entry;
		$this->rest_namespace = $namespace;
		$this->route_base     = $route;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$route}" );
	}

	public function register_rest_routes() {

		register_rest_route(
			$this->rest_namespace,
			$this->route_base,
			array(
				'methods'             => 'GET, POST',
				'callback'            => array( $this, 'handle_get' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);

		if ( $this->entry->is( Entry_Can_Set::class ) ) {
			register_rest_route(
				$this->rest_namespace,
				$this->route_base . '/set',
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'handle_set' ),
					'permission_callback' => array( $this, 'permissions' ),
				)
			);
		}

		if ( $this->entry->is( Entry_Can_Merge::class ) ) {
			register_rest_route(
				$this->rest_namespace,
				$this->route_base . '/merge',
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'handle_merge' ),
					'permission_callback' => array( $this, 'permissions' ),
				)
			);
		}

		if ( $this->entry->is( Entry_Can_Delete::class ) ) {
			register_rest_route(
				$this->rest_namespace,
				$this->route_base . '/delete',
				array(
					'methods'             => 'POST, DELETE',
					'callback'            => array( $this, 'handle_delete' ),
					'permission_callback' => array( $this, 'permissions' ),
				)
			);
		}
	}

	/**
	 * Handle GET Requests on /wp-json/<namespace>/<route>
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handle_get( $request ) {
		return $this->handler( $request, 'get' );
	}

	/**
	 * Handle POST, PUT, PATCH Requests on /wp-json/<namespace>/<route>/set
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handle_set( $request ) {
		return $this->handler( $request, 'set' );
	}

	/**
	 * Handle POST, PUT, PATCH Requests on /wp-json/<namespace>/<route>/merge
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handle_merge( $request ) {
		return $this->handler( $request, 'merge' );
	}

	/**
	 * Handle POST, DELETE Requests on /wp-json/<namespace>/<route>/delete
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	public function handle_delete( $request ) {
		return $this->handler( $request, 'delete' );
	}

	private function response_error( $message, $code ) {
		return rest_ensure_response(
			array(
				'status'  => 'error',
				'message' => $message,
				'code'    => $code,
			)
		);
	}

	private function response_success( $data ) {
		$response = array(
			'status' => 'success',
			'JSON'   => $data,
		);
		if ( true === DS_Utils::is_debug() ) {
			$response['log'] = $this->entry->get_parser()->get_log();
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Route the request to the apropriate handler.
	 *
	 * @param \WP_REST_Request $request - The request object.
	 */
	private function handler( $request, $entry_method = 'get' ) {

		$available_methods = array(
			'get'    => Entry_Can_Get::class,
			'set'    => Entry_Can_Set::class,
			'merge'  => Entry_Can_Merge::class,
			'delete' => Entry_Can_Delete::class,
		);
		if ( ! isset( $available_methods[ $entry_method ] ) ) {
			// Set status 400 because an unsupported method was used.
			return rest_ensure_response( new \WP_Error( 'invalid_method', 'Invalid method.', array( 'status' => 400 ) ) );
		}

		if ( ! $this->entry->is( $available_methods[ $entry_method ] ) ) {
			// Set Status 500 because the method is valid but is missing in Data_Sync_Entry.
			return rest_ensure_response( new \WP_Error( 'invalid_method', 'Invalid method. "' . $entry_method . '" ' ) );
		}

		try {
			$params = $request->get_json_params();
			$data   = isset( $params['JSON'] ) ? $params['JSON'] : null;
			$result = $this->entry->$entry_method( $data );

			if ( true === DS_Utils::debug_disable( $this->route_base ) ) {
				// Return 418 I'm a teapot if this is a debug request to the endpoint.
				return rest_ensure_response( new \WP_Error( 'teapot', "I'm a teapot.", array( 'status' => 418 ) ) );
			}

			if ( is_wp_error( $result ) ) {
				return $this->response_error( $result->get_error_message(), $result->get_error_code() );
			}

			return $this->response_success( $result );
		} catch ( \RuntimeException $e ) {
			return $this->response_error( $e->getMessage(), 500 );
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
