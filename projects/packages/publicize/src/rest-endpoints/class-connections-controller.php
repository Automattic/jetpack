<?php
/**
 * The Publicize Connections Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Rest_Endpoints;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Publicize\Connection_Fields;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the REST routes
 */
class Connections_Controller extends WP_REST_Controller {

	/**
	 * Whether we are on WPCOM.
	 *
	 * @var bool $is_wpcom
	 */
	protected $is_wpcom = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v3';
		$this->rest_base = 'publicize/connections';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		$this->is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

		$this->wpcom_is_wpcom_only_endpoint = true;
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
					'args'                => array(
						'test_connections' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to test connections.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => array(
				'connection_id'   => array(
					'type'        => 'string',
					'description' => __( 'Connection ID of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'display_name'    => array(
					'type'        => 'string',
					'description' => __( 'Display name of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'external_handle' => array(
					'type'        => 'string',
					'description' => __( 'The external handle or username of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'external_id'     => array(
					'type'        => 'string',
					'description' => __( 'The external ID of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'profile_link'    => array(
					'type'        => 'string',
					'description' => __( 'Profile link of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'profile_picture' => array(
					'type'        => 'string',
					'description' => __( 'URL of the profile picture of the connected account.', 'jetpack-publicize-pkg' ),
				),
				'service_label'   => array(
					'type'        => 'string',
					'description' => __( 'Human-readable label for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
				),
				'service_name'    => array(
					'type'        => 'string',
					'description' => __( 'Alphanumeric identifier for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
				),
				'shared'          => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the connection is shared with other users.', 'jetpack-publicize-pkg' ),
				),
				'status'          => array(
					'type'        => 'string',
					'description' => __( 'The connection status.', 'jetpack-publicize-pkg' ),
					'enum'        => array(
						'ok',
						'broken',
					),
				),
				'user_id'         => array(
					'type'        => 'integer',
					'description' => __( 'ID of the user the connection belongs to.', 'jetpack-publicize-pkg' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get all connections. Meant to be called directly only on WPCOM.
	 *
	 * @param bool $run_tests Whether to run tests on the connections.
	 *
	 * @return array
	 */
	public static function get_all_connections( $run_tests = false ) {
		/**
		 * Publicize instance.
		 *
		 * @var \Automattic\Jetpack\Publicize\Publicize $publicize
		 */
		global $publicize;

		$items = array();

		$test_results = $run_tests ? self::get_connections_test_status() : array();

		foreach ( (array) $publicize->get_services( 'connected' ) as $service_name => $connections ) {
			foreach ( $connections as $connection ) {

				$connection_id = Connection_Fields::get_connection_id( $connection );

				$items[] = array(
					'connection_id'   => $connection_id,
					'display_name'    => Connection_Fields::get_display_name( $service_name, $connection ),
					'external_handle' => Connection_Fields::get_external_handle( $service_name, $connection ),
					'external_id'     => Connection_Fields::get_external_id( $connection ),
					'profile_link'    => Connection_Fields::get_profile_link( $service_name, $connection ),
					'profile_picture' => Connection_Fields::get_profile_picture( $connection ),
					'service_label'   => Connection_Fields::get_service_label( $service_name ),
					'service_name'    => $service_name,
					'shared'          => Connection_Fields::is_shared( $connection ),
					'status'          => $test_results[ $connection_id ] ?? 'ok',
					'user_id'         => Connection_Fields::get_user_id( $connection ),
				);
			}
		}

		return $items;
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( $this->is_wpcom ) {
			$items = array();

			$run_tests = $request->get_param( 'test_connections' );

			$connections = self::get_all_connections( $run_tests );

			foreach ( $connections as $item ) {
				$items[] = $this->prepare_item_for_response( $item, $request );
			}

			return rest_ensure_response( $items );

		} else {
			$site_id = Manager::get_site_id( true );
			if ( ! $site_id ) {
				return rest_ensure_response( array() );
			}

			$path = add_query_arg(
				$request->get_query_params(),
				sprintf( '/sites/%d/' . $this->rest_base, $site_id )
			);

			$response = Client::wpcom_json_api_request_as_user( $path, 'v3', array( 'method' => 'GET' ) );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				// TODO log error.
				return rest_ensure_response( array() );
			}

			return rest_ensure_response(
				json_decode( wp_remote_retrieve_body( $response ), true )
			);
		}
	}

	/**
	 * Get the connections test status.
	 *
	 * @return array
	 */
	protected static function get_connections_test_status() {
		/**
		 * Publicize instance.
		 *
		 * @var \Automattic\Jetpack\Publicize\Publicize $publicize
		 */
		global $publicize;

		$test_results = $publicize->get_publicize_conns_test_results();

		$test_results_map = array();

		foreach ( $test_results as $test_result ) {
			// Compare to `true` because the API returns a 'must_reauth' for LinkedIn.
			$test_results_map[ $test_result['connectionID'] ] = true === $test_result['connectionTestPassed'] ? 'ok' : 'broken';
		}

		return $test_results_map;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $item    Item to prepare.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response filtered item
	 */
	public function prepare_item_for_response( $item, $request ) {
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return rest_ensure_response( $item );
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $item as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return rest_ensure_response( $response_data );
	}

	/**
	 * Verify that user can access Publicize data
	 *
	 * @return true|WP_Error
	 */
	public function get_items_permission_check() {
		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( Connections_Controller::class );
}
