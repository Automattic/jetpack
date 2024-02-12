<?php
/**
 * Register and handle custom action REST API Endpoints for data sync entries.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;

class Action_Endpoint {

	/**
	 * @var Data_Sync_Action  - The class that handles the action.
	 */
	private $action_class;

	/**
	 * @var string $request_schema - The schema for requests to this action.
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
	 *
	 * @param $namespace
	 * @param $key
	 * @param $action_name
	 * @param $action_schema
	 * @param $action_class
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

	public function handle_action( $request ) {
		try {
			$params      = $request->get_json_params();
			$data        = isset( $params['JSON'] ) ? $params['JSON'] : null;
			$parsed_data = $this->request_schema->parse( $data );

			// Delegate to the action handler
			$result = $this->action_class->handle( $parsed_data, $request );
			if ( is_wp_error( $result ) ) {
				throw new \RuntimeException( $result->get_error_message() );
			}

			if ( true === DS_Utils::debug_disable( $this->route ) ) {
				// Return 418 I'm a teapot if this is a debug request to the endpoint.
				return rest_ensure_response( new \WP_Error( 'teapot', "I'm a teapot.", array( 'status' => 418 ) ) );
			}

			return rest_ensure_response(
				array(
					'status' => 'success',
					'JSON'   => $result,
				)
			);
		} catch ( \RuntimeException $e ) {
			return rest_ensure_response(
				array(
					'status'  => 'error',
					'message' => $e->getMessage(),
				)
			);
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
