<?php
/**
 * Register and handle REST API Endpoints for each data sync entry.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamName
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
// phpcs:disable Squiz.Commenting.FunctionComment.MissingReturn
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.Missing
// phpcs:disable Squiz.Commenting.ClassComment.Missing
// phpcs:disable Squiz.Commenting.FileComment.Missing

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
	public function __construct( $namespace, $route, $entry ) {
		$this->entry          = $entry;
		$this->rest_namespace = $namespace;
		$this->route          = $route;
		$this->nonce          = new Authenticated_Nonce( "{$namespace}_{$entry->key()}" );
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
		$methods = array(
			'GET'    => 'handle_get',
			'POST'   => 'handle_post',
			'DELETE' => 'handle_delete',
		);

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
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function handle_get( $request ) {
		return array(
			'status' => 'success',
			'JSON'   => $this->entry->get(),
		);
	}

	/**
	 * @param $request \WP_REST_Request - The request object.
	 *
	 * @return mixed|\WP_Error
	 */
	public function handle_post( $request ) {

		$input = $request->get_json_params();
		$this->entry->set( $input['JSON'] );

		if ( $this->entry->has_errors() ) {
			return new \WP_Error( 400, $this->entry->get_errors(), array( 'status' => 400 ) );
		}

		return array(
			'status' => 'success',
			'JSON'   => $this->entry->get(),
		);
	}

	public function handle_delete() {
		$this->entry->delete();

		if ( $this->entry->has_errors() ) {
			return new \WP_Error( 400, $this->entry->get_errors(), array( 'status' => 400 ) );
		}

		return array(
			'status' => 'success',
			'JSON'   => $this->entry->get(),
		);
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
