<?php
/**
 * Register and handle custom action REST API Endpoints for data sync entries.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\Schema\Schema_Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;

class Action_Endpoint {

	/**
	 * @var Data_Sync_Action  - The class that handles the action.
	 */
	private $action_class;

	/**
	 * @var Schema_Parser $request_schema - The schema for requests to this action.
	 */
	private $request_schema;

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
	 * This class handles endpoints for DataSync actions.
	 *
	 * @param string           $namespace
	 * @param string           $key
	 * @param string           $action_name
	 * @param Schema_Parser    $request_schema
	 * @param Data_Sync_Action $action_class
	 */
	public function __construct( $namespace, $key, $action_name, $request_schema, $action_class ) {
		$this->action_class   = $action_class;
		$this->request_schema = $request_schema;
		$this->rest_namespace = $namespace;
		$this->route          = $key . '/action/' . $action_name;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$this->route}_action" );
	}

	public function register_rest_routes() {
		register_rest_route(
			$this->rest_namespace,
			$this->route,
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'handle_action' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);
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
		return rest_ensure_response(
			array(
				'status' => 'success',
				'JSON'   => $data,
			)
		);
	}

	public function handle_action( $request ) {
		try {
			$params      = $request->get_json_params();
			$data        = isset( $params['JSON'] ) ? $params['JSON'] : null;
			$parsed_data = $this->request_schema->parse( $data );

			// Delegate to the action handler
			$result = $this->action_class->handle( $parsed_data, $request );
			if ( is_wp_error( $result ) ) {
				return $this->response_error( $result->get_error_message(), $result->get_error_code() );
			}

			if ( true === DS_Utils::debug_disable( $this->route ) ) {
				// This is a debug request - it's ok to return a different shape from the rest.
				// Return 418 I'm a teapot if this is a debug request to the endpoint.
				return rest_ensure_response( new \WP_Error( 'teapot', "I'm a teapot.", array( 'status' => 418 ) ) );
			}

			return $this->response_success( $result );
		} catch ( \RuntimeException $e ) {
			return $this->response_error( $e->getMessage(), 'runtime_error' );
		}
	}

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
