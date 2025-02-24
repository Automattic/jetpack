<?php
/**
 * REST API endpoint for retrieving JITMs from the WPCOM API via the Jetpack JITM class
 * infrastructure.
 *
 * Replaces projects/packages/jitm/src/class-rest-api-endpoints.php.
 *
 * Available on:
 * - Simple - via Dotcom Public API (https://public-api.wordpress.com/wpcom/v2/sites/{site_id}/jitm-v2).
 * - WoA and Jetpack connected sites - via local site REST API (https://myjetpackconnectedsite.com/wp-json/wpcom/v2/jitm-v2)
 *
 * Utilises Jetpack classes to orchestrate the request and response handling.
 * All JITM configuration happens on the Dotcom Simple codebase.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;

/**
 * Class WPCOM_REST_API_V2_Endpoint_JITM_V2
 */
class WPCOM_REST_API_V2_Endpoint_JITM_V2 extends WP_REST_Controller {

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jitm-v2';

	/**
	 * WPCOM_REST_API_V2_Endpoint_JITM_V2 constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => '__return_true',
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'dismiss_item' ),
					'permission_callback' => array( $this, 'dismiss_item_permissions_check' ),
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
		// This allows the wpcom/v2/jitm endpoint to work for Simple sites.
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
		// This allows the wpcom/v2/jitm endpoint to work for Simple sites.
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

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_JITM_V2' );
