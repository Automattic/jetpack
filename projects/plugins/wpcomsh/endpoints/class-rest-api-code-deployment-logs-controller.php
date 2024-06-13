<?php
/**
 * Code Deployment logs REST API endpoint.
 *
 * @package endpoints
 */

/**
 * Code Deployment logs REST API endpoint.
 *
 * @package endpoints
 */
class Rest_Api_Code_Deployment_Logs_Controller extends WP_REST_Controller {

	/**
	 * The API namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wpcomsh/v1';

	/**
	 * The API REST base URL.
	 *
	 * @var string
	 */
	protected $rest_base = 'code-deployments';

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		// Get a single entry from the log file based on the command identifier.
		// GET https://<atomic-site-address>/wp-json/wpcomsh/v1/code-deployments/{deployment_id}/runs/{run_id}/logs/{command_identifier}
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<deployment_id>\d+)/runs/(?P<run_id>\d+)/logs/(?P<command_identifier>[\w-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_log_entry' ),
				'permission_callback' => array( $this, 'verify_xml_rpc_signature' ),
			)
		);
	}

	/**
	 * Get a single entry from the log file based on the command identifier.
	 *
	 * @param WP_Rest_Request $request The request object.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_log_entry( WP_Rest_Request $request ) {
		$log_path = sprintf( '/srv/htdocs/.code-deployments/%s/%s-log.json', $request['deployment_id'], $request['run_id'] );
		if ( ! file_exists( $log_path ) ) {
			return new WP_Error( 'file_not_found', 'The log file was not found.', array( 'status' => 404 ) );
		}

		$logs = json_decode( file_get_contents( $log_path ), true ); //phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ( ! $logs ) {
			return new WP_Error( 'invalid_json', 'The log file is not valid json.', array( 'status' => 500 ) );
		}

		foreach ( $logs as $log ) {
			if ( $log['commandIdentifier'] === $request['command_identifier'] ) {
				return new WP_REST_Response( $log );
			}
		}

		return new WP_Error( 'command_not_found', 'The command identifier was not found in the log.', array( 'status' => 404 ) );
	}

	/**
	 * Checks if a given request has the correct signature. We only
	 * want to accept "internal" requests from WPCOM.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if the request has access, false otherwise.
	 */
	public function verify_xml_rpc_signature( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundInExtendedClass, VariableAnalysis.CodeAnalysis.VariableAnalysis
		return method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' ) && ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature();
	}
}
