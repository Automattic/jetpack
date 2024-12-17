<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Fetch information about Publicize connections on a site.
 *
 * @package automattic/jetpack
 */
namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Publicize\Publicize;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Publicize: List Connections
 *
 * [
 *   { # Connection Object. See schema for more detail.
 *     id:           (string)  Connection unique_id
 *     service_name: (string)  Service slug
 *     display_name: (string)  User name/display name of user/connection on Service
 *     global:       (boolean) Is the Connection available to all users of the site?
 *   },
 *   ...
 * ]
 *
 * @since 6.8
 */
class Connections_Controller extends WP_REST_Controller {
	/**
	 * Flag to help WordPress.com decide where it should look for
	 * Publicize data. Ignored for direct requests to Jetpack sites.
	 *
	 * @var bool $wpcom_is_wpcom_only_endpoint
	 */
	public $wpcom_is_wpcom_only_endpoint = true;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/connections';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE, // @phan-suppress-current-line PhanPluginMixedKeyNoKey
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
	 * Helper for generating schema. Used by this endpoint and by the
	 * Connection Test Result endpoint.
	 *
	 * @internal
	 * @return array
	 */
	protected function get_connection_schema_properties() {
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

		$connection_fields = array(
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
			'user_id'         => array(
				'type'        => 'integer',
				'description' => __( 'ID of the user the connection belongs to.', 'jetpack-publicize-pkg' ),
			),
		);

		$test_fields = array(
			'status'       => array(
				'type'        => 'string',
				'description' => __( 'The connection status.', 'jetpack-publicize-pkg' ),
				'enum'        => array(
					'ok',
					'broken',
				),
			),
			'test_success' => array(
				'description' => __( 'Did the Jetpack Social connection test pass?', 'jetpack-publicize-pkg' ),
				'type'        => 'boolean',
			),
			'error_code'   => array(
				'description' => __( 'Jetpack Social connection error code', 'jetpack-publicize-pkg' ),
				'type'        => 'string',
			),
			'test_message' => array(
				'description' => __( 'Jetpack Social connection success or error message', 'jetpack-publicize-pkg' ),
				'type'        => 'string',
			),
			'can_refresh'  => array(
				'description' => __( 'Can the current user refresh the Jetpack Social connection?', 'jetpack-publicize-pkg' ),
				'type'        => 'boolean',
			),
			'refresh_text' => array(
				'description' => __( 'Message instructing the user to refresh their Connection to the Jetpack Social service', 'jetpack-publicize-pkg' ),
				'type'        => 'string',
			),
			'refresh_url'  => array(
				'description' => __( 'URL for refreshing the Connection to the Jetpack Social service', 'jetpack-publicize-pkg' ),
				'type'        => 'string',
				'format'      => 'uri',
			),
		);

		return array_merge(
			$deprecated_fields,
			$connection_fields,
			$test_fields
		);
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => $this->get_connection_schema_properties(),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Helper for retrieving Connections. Used by this endpoint and by
	 * the Connection Test Result endpoint.
	 *
	 * @internal
	 * @param bool $run_tests Whether to run the tests to check the health of the connections.
	 * @return array
	 */
	protected static function get_connections( $run_tests = false ) {
		global $publicize;

		$items        = array();
		$test_results = $run_tests ? self::get_connections_test_status() : array();

		foreach ( (array) $publicize->get_services( 'connected' ) as $service_name => $connections ) {
			foreach ( $connections as $connection ) {
				$connection_meta = $publicize->get_connection_meta( $connection );
				$connection_data = $connection_meta['connection_data'];
				$connection_id   = $publicize->get_connection_id( $connection );
				$username        = $publicize->get_username( $service_name, $connection );
				$item            = array_merge(
					array(
						'connection_id'        => $connection_id,
						'display_name'         => $publicize->get_display_name( $service_name, $connection ),
						'external_handle'      => $username,
						'external_id'          => $connection_meta['external_id'] ?? '',
						'profile_link'         => $publicize->get_profile_link( $service_name, $connection ),
						'profile_picture'      => $publicize->get_profile_picture( $connection ),
						'service_label'        => Publicize::get_service_label( $service_name ),
						'service_name'         => $service_name,
						'shared'               => ! $connection_data['user_id'],
						'user_id'              => (int) $connection_data['user_id'],

						// Deprecated fields.
						'id'                   => (string) $publicize->get_connection_unique_id( $connection ),
						'username'             => $username,
						'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
						// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
						'global'               => 0 == $connection_data['user_id'],
					),
					$test_results[ $connection_id ] ?? array()
				);
				$items[]         = $item;
			}
		}

		return $items;
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
		$mapping          = array(
			'test_success'  => 'connectionTestPassed',
			'test_message'  => 'connectionTestMessage',
			'error_code'    => 'connectionTestErrorCode',
			'can_refresh'   => 'userCanRefresh',
			'refresh_text'  => 'refreshText',
			'refresh_url'   => 'refreshURL',
			'connection_id' => 'connectionID',
		);

		foreach ( $test_results as $test_result ) {
			$result_fields = array(
				// Compare to `true` because the API returns a 'must_reauth' for LinkedIn.
				'status' => true === $test_result['connectionTestPassed'] ? 'ok' : 'broken',
			);
			foreach ( $mapping as $field => $test_result_field ) {
				$result_fields[ $field ] = $test_result[ $test_result_field ];
			}
			$test_results_map[ $test_result['connectionID'] ] = $result_fields;
		}

		return $test_results_map;
	}

	/**
	 * Get the connections data, either directly or by calling the WPCOM API
	 *
	 * @param bool $run_tests Whether to run the tests to check the health of the connections.
	 *
	 * @return array Connection objects in the same shape as from `get_connections`
	 */
	public static function get_connections_data( $run_tests = false ) {
		// TODO decide on caching
		return ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? self::get_connections( $run_tests ) : self::get_connections_from_wpcom( $run_tests );
	}

	/**
	 * Proxy the request to the WPCOM API
	 *
	 * @param bool $run_tests Whether to run the tests to check the health of the connections.
	 *
	 * @return array Connection objects in the same shape as from `get_connections`
	 */
	protected static function get_connections_from_wpcom( $run_tests = false ) {
		$site_id = Manager::get_site_id( true );
		if ( ! $site_id ) {
			return array();
		}

		$path = add_query_arg(
			array( 'test_connections' => $run_tests ),
			sprintf( '/sites/%d/publicize/connections', $site_id )
		);

		$response = Client::wpcom_json_api_request_as_user( sprintf( $path, $site_id ), 'v2', array( 'method' => 'GET' ) );

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

		$connections = self::get_connections_data( $request->get_param( 'test_connections' ) );

		foreach ( $connections as $item ) {
			$items[] = $this->prepare_item_for_response( $item, $request );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $connection Array of info about a specific Publicize connection.
	 * @param WP_REST_Request $request    Full details about the request.
	 *
	 * @return array filtered $connection
	 */
	public function prepare_item_for_response( $connection, $request ) {
		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $connection as $field => $value ) {
			if ( rest_is_field_included( $field, $fields ) ) {
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
	// @phan-suppress-next-line PhanUndeclaredFunction
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\Publicize\REST_API\Connections_Controller' );
}
