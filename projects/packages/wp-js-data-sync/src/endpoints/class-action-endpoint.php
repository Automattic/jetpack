<?php
/**
 * Register and handle custom action REST API Endpoints for data sync entries.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;

class Action_Endpoint {

	/**
	 * @var Data_Sync_Action  - The class that handles the action.
	 */
	private $action_class;
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
	 * @param $namespace
	 * @param $route
	 * @param $action_class
	 */
	public function __construct( $namespace, $key, $action_name, $action_class ) {
		$this->action_class   = $action_class;
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
			$params = $request->get_json_params();
			$data   = isset( $params['JSON'] ) ? $params['JSON'] : null;
			// Delegate to the action handler
			$result = $this->action_class->handle( $data, $request );
			if ( is_wp_error( $result ) ) {
				throw new \RuntimeException( $result->get_error_message() );
			}
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
