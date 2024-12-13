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
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Connections Controller class.
 */
class Connections_Controller extends Base_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/connections';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
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
		$deprecated_fields = array(
			'id'                   => array(
				'type'        => 'string',
				'description' => __( 'Unique identifier for the Jetpack Social connection.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'connection_id'
				),
			),
			'username'             => array(
				'type'        => 'string',
				'description' => __( 'Username of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'external_handle'
				),
			),
			'profile_display_name' => array(
				'type'        => 'string',
				'description' => __( 'The name to display in the profile of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'display_name'
				),
			),
			'global'               => array(
				'type'        => 'boolean',
				'description' => __( 'Is this connection available to all users?', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'shared'
				),
			),
		);

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => array_merge(
				$deprecated_fields,
				array(
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
				)
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
	protected static function get_all_connections( $run_tests = false ) {
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

				$connection_meta = Connection_Fields::get_connection_meta( $connection );
				$connection_data = $connection_meta['connection_data'];

				$items[] = array(
					'connection_id'        => $connection_id,
					'display_name'         => Connection_Fields::get_display_name( $service_name, $connection ),
					'external_handle'      => Connection_Fields::get_external_handle( $service_name, $connection ),
					'external_id'          => Connection_Fields::get_external_id( $connection ),
					'profile_link'         => Connection_Fields::get_profile_link( $service_name, $connection ),
					'profile_picture'      => Connection_Fields::get_profile_picture( $connection ),
					'service_label'        => Connection_Fields::get_service_label( $service_name ),
					'service_name'         => $service_name,
					'shared'               => Connection_Fields::is_shared( $connection ),
					'status'               => $test_results[ $connection_id ] ?? 'ok',
					'user_id'              => Connection_Fields::get_user_id( $connection ),

					// Deprecated fields.
					'id'                   => (string) $publicize->get_connection_unique_id( $connection ),
					'username'             => $publicize->get_username( $service_name, $connection ),
					'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
					// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
					'global'               => 0 == $connection_data['user_id'],

				);
			}
		}

		return $items;
	}

	/**
	 * Get a list of publicize connections.
	 *
	 * @param bool $run_tests Whether to run tests on the connections.
	 *
	 * @return array
	 */
	public static function get_connections( $run_tests = false ) {
		if ( self::is_wpcom() ) {
			return self::get_all_connections( $run_tests );
		}

		$site_id = Manager::get_site_id( true );
		if ( ! $site_id ) {
			return array();
		}

		$path = add_query_arg(
			array( 'test_connections' => $run_tests ),
			sprintf( '/sites/%d/publicize/connections', $site_id )
		);

		$response = Client::wpcom_json_api_request_as_user( $path, 'v3', array( 'method' => 'GET' ) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			// TODO log error.
			return array();
		}

		$body = wp_remote_retrieve_body( $response );

		$items = json_decode( $body, true );

		return $items ? $items : array();
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		$items = array();

		$run_tests = $request->get_param( 'test_connections' );

		foreach ( self::get_connections( $run_tests ) as $item ) {
			$data = $this->prepare_item_for_response( $item, $request );

			$items[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
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
}

if ( Base_Controller::is_wpcom() ) {
	wpcom_rest_api_v2_load_plugin( Connections_Controller::class );
}
