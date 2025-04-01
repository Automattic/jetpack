<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Fetch information about Publicize connections on a site, including tests and connection status.
 *
 * @package automattic/jetpack
 */

/**
 * Publicize: List Connection Test Result Data
 *
 * All the same data as the Publicize Connections Endpoint, plus test results.
 *
 * @deprecated 14.4 Deprecated in favor of /wpcom/v2/publicize/connections?test_connections=1
 *
 * @since 6.8
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Connection_Test_Results extends WP_REST_Controller {

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
		$this->rest_base = 'publicize/connection-test-results';

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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Adds the test results properties to the Connection schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection-test-results',
			'type'       => 'object',
			'properties' => $this->get_connection_schema_properties() + array(
				'test_success' => array(
					'description' => __( 'Did the Jetpack Social connection test pass?', 'jetpack' ),
					'type'        => 'boolean',
				),
				'error_code'   => array(
					'description' => __( 'Jetpack Social connection error code', 'jetpack' ),
					'type'        => 'string',
				),
				'test_message' => array(
					'description' => __( 'Jetpack Social connection success or error message', 'jetpack' ),
					'type'        => 'string',
				),
				'can_refresh'  => array(
					'description' => __( 'Can the current user refresh the Jetpack Social connection?', 'jetpack' ),
					'type'        => 'boolean',
				),
				'refresh_text' => array(
					'description' => __( 'Message instructing the user to refresh their Connection to the Jetpack Social service', 'jetpack' ),
					'type'        => 'string',
				),
				'refresh_url'  => array(
					'description' => __( 'URL for refreshing the Connection to the Jetpack Social service', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Helper for generating schema. Used by this endpoint and by the
	 * Connection Test Result endpoint.
	 *
	 * @internal
	 * @return array
	 */
	protected function get_connection_schema_properties() {
		return array(
			'id'                   => array(
				'description' => __( 'Unique identifier for the Jetpack Social connection', 'jetpack' ),
				'type'        => 'string',
			),
			'service_name'         => array(
				'description' => __( 'Alphanumeric identifier for the Jetpack Social service', 'jetpack' ),
				'type'        => 'string',
			),
			'display_name'         => array(
				'description' => __( 'Display name of the connected account', 'jetpack' ),
				'type'        => 'string',
			),
			'username'             => array(
				'description' => __( 'Username of the connected account', 'jetpack' ),
				'type'        => 'string',
			),
			'profile_display_name' => array(
				'description' => __( 'The name to display in the profile of the connected account', 'jetpack' ),
				'type'        => 'string',
			),
			'profile_picture'      => array(
				'description' => __( 'Profile picture of the connected account', 'jetpack' ),
				'type'        => 'string',
			),
			'global'               => array(
				'description' => __( 'Is this connection available to all users?', 'jetpack' ),
				'type'        => 'boolean',
			),
			'external_id'          => array(
				'description' => __( 'The external ID of the connected account', 'jetpack' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Helper for retrieving Connections. Used by this endpoint and by
	 * the Connection Test Result endpoint.
	 *
	 * @internal
	 * @return array
	 */
	protected function get_connections() {
		global $publicize;

		$items = array();

		foreach ( (array) $publicize->get_services( 'connected' ) as $service_name => $connections ) {
			foreach ( $connections as $connection ) {
				$connection_meta = $publicize->get_connection_meta( $connection );
				$connection_data = $connection_meta['connection_data'];

				$items[] = array(
					'id'                   => (string) $publicize->get_connection_unique_id( $connection ),
					'connection_id'        => (string) $publicize->get_connection_id( $connection ),
					'service_name'         => $service_name,
					'display_name'         => $publicize->get_display_name( $service_name, $connection ),
					'username'             => $publicize->get_username( $service_name, $connection ),
					'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
					'profile_picture'      => ! empty( $connection_meta['profile_picture'] ) ? $connection_meta['profile_picture'] : '',
					// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
					'global'               => 0 == $connection_data['user_id'],
					'external_id'          => $connection_meta['external_id'] ?? '',
				);
			}
		}

		return $items;
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
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Get list of Publicize Connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @see Publicize::get_publicize_conns_test_results()
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $publicize;

		$items = $this->get_connections();

		$test_results              = $publicize->get_publicize_conns_test_results();
		$test_results_by_unique_id = array();
		foreach ( $test_results as $test_result ) {
			$test_results_by_unique_id[ $test_result['connectionID'] ] = $test_result;
		}

		$mapping = array(
			'test_success'  => 'connectionTestPassed',
			'test_message'  => 'connectionTestMessage',
			'error_code'    => 'connectionTestErrorCode',
			'can_refresh'   => 'userCanRefresh',
			'refresh_text'  => 'refreshText',
			'refresh_url'   => 'refreshURL',
			'connection_id' => 'connectionID',
		);

		foreach ( $items as &$item ) {
			$test_result = $test_results_by_unique_id[ $item['connection_id'] ];

			foreach ( $mapping as $field => $test_result_field ) {
				$item[ $field ] = $test_result[ $test_result_field ];
			}
		}

		if (
			isset( $item['id'] )
			&& 'linkedin' === $item['id']
			&& 'must_reauth' === $test_result['connectionTestPassed']
		) {
			$item['test_success'] = 'must_reauth';
		}

		$response = rest_ensure_response( $items );

		$response->header( 'X-WP-Total', count( $items ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Connection_Test_Results' );
