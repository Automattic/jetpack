<?php
/**
 * REST API endpoint for retrieving JITMs from the WPCOM API via the Jetpack JITM class
 * infrastructure.
 *
 * Replaces projects/packages/jitm/src/class-rest-api-endpoints.php.
 *
 * Available on:
 * - Simple - via Dotcom Public API (https://public-api.wordpress.com/wpcom/v3/sites/{site_id}/jitm).
 * - WoA and Jetpack connected sites - via local site REST API (https://myjetpackconnectedsite.com/wp-json/wpcom/v3/jitm)
 *
 * Utilises Jetpack classes to orchestrate the request and response handling.
 * All JITM configuration happens on the Dotcom Simple codebase.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V3_Endpoint_JITM
 */
class WPCOM_REST_API_V3_Endpoint_JITM extends WP_REST_Controller {

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v3';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jitm';

	/**
	 * WPCOM_REST_API_V3_Endpoint_JITM constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register JITM routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'message_path'        => array(
							'required'          => true,
							'type'              => 'string',
							'description'       => __( 'The message path to fetch JITMs for', 'jetpack' ),
							'validate_callback' => 'rest_validate_request_arg',
						),
						'query'               => array(
							'required'    => false,
							'type'        => 'string',
							'description' => __( 'Additional query parameters', 'jetpack' ),
						),
						'full_jp_logo_exists' => array(
							'required'    => false,
							'type'        => 'boolean',
							'description' => __( 'Whether the full Jetpack logo exists', 'jetpack' ),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'dismiss_item' ),
					'permission_callback' => array( $this, 'dismiss_item_permissions_check' ),
					'args'                => array(
						'id'            => array(
							'required'    => true,
							'type'        => 'string',
							'description' => __( 'The ID of the JITM to dismiss', 'jetpack' ),
						),
						'feature_class' => array(
							'required'    => true,
							'type'        => 'string',
							'description' => __( 'The feature class of the JITM', 'jetpack' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Retrieves the JITMs.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$jitm = Automattic\Jetpack\JITMS\JITM::get_instance();

		if ( ! $jitm->jitms_enabled() ) {
			return rest_ensure_response( array() );
		}

		// add the search term to the query params if it exists
		$query_param = $request['query'] ?? '';

		// Disable the jetpack_user_auth_check filter on Dotcom Simple codebase.
		// This allows the wpcom/v3/jitm endpoint to work for Simple sites.
		// See fbhepr%2Skers%2Sjcpbz%2Sjc%2Qpbagrag%2Serfg%2Qncv%2Qcyhtvaf%2Sraqcbvagf%2Swrgcnpx.cuc%3Se%3Q4580oq59%2374-og.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_filter( 'rest_api_jitm_jetpack_user_auth_check', '__return_true' );
		}

		$messages = $jitm->get_messages(
			$request['message_path'],
			urldecode_deep( array( 'query' => $query_param ) ),
			'true' === $request['full_jp_logo_exists']
		);

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			remove_filter( 'rest_api_jitm_jetpack_user_auth_check', '__return_true' );
		}

		return rest_ensure_response( $messages );
	}

	/**
	 * Checks if a given request has access to get JITMs.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has permission to get JITMs, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'read' ) ) {
			return new WP_Error(
				'invalid_user_permission_jetpack_get_jitm_message',
				REST_Connector::get_user_permissions_error_msg(),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Checks if a given request has access to dismiss JITMs.
	 *
	 * @return true|WP_Error True if the request has permission to dismiss, WP_Error object otherwise.
	 */
	public function dismiss_item_permissions_check() {
		if ( ! current_user_can( 'read' ) ) {
			return new WP_Error(
				'invalid_user_permission_jetpack_delete_jitm_message',
				REST_Connector::get_user_permissions_error_msg(),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Dismisses a JITM message.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function dismiss_item( $request ) {
		$jitm = Automattic\Jetpack\JITMS\JITM::get_instance();

		if ( ! $jitm->jitms_enabled() ) {
			// Boolean return matches return type of $jitm->dismiss().
			// Not returning a WP_Error avoids a 400 response code
			// and allows the dismiss action to be silently ignored.
			return rest_ensure_response( true );
		}

		// Disable the jetpack_user_auth_check filter on Dotcom Simple codebase.
		// This allows the wpcom/v3/jitm endpoint to work for Simple sites.
		// See fbhepr%2Skers%2Sjcpbz%2Sjc%2Qpbagrag%2Serfg%2Qncv%2Qcyhtvaf%2Sraqcbvagf%2Swrgcnpx.cuc%3Se%3Q4580oq59%2374-og.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_filter( 'rest_api_jitm_jetpack_user_auth_check', '__return_true' );
		}

		$result = $jitm->dismiss( $request['id'], $request['feature_class'] );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			remove_filter( 'rest_api_jitm_jetpack_user_auth_check', '__return_true' );
		}

		return rest_ensure_response( $result );
	}
}

// This function is badly named since it works for all versions of the REST API.
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V3_Endpoint_JITM' );
