<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Fetch information about Publicize connections on a site.
 *
 * @package automattic/jetpack
 */

/**
 * Publicize: List Connections
 *
 * [
 *   { # Connnection Object. See schema for more detail.
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
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Connections extends WP_REST_Controller {
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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
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
		return array(
			'id'                   => array(
				'description' => __( 'Unique identifier for the Publicize Connection', 'jetpack' ),
				'type'        => 'string',
			),
			'service_name'         => array(
				'description' => __( 'Alphanumeric identifier for the Publicize Service', 'jetpack' ),
				'type'        => 'string',
			),
			'display_name'         => array(
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
			'properties' => $this->get_connection_schema_properties(),
		);

		return $this->add_additional_fields_schema( $schema );
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
					'service_name'         => $service_name,
					'display_name'         => $publicize->get_display_name( $service_name, $connection ),
					'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
					'profile_picture'      => ! empty( $connection_meta['profile_picture'] ) ? $connection_meta['profile_picture'] : '',
					// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
					'global'               => 0 == $connection_data['user_id'],
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
		$items = array();

		foreach ( $this->get_connections() as $item ) {
			$items[] = $this->prepare_item_for_response( $item, $request );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', count( $items ) );
		$response->header( 'X-WP-TotalPages', 1 );

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
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return $connection;
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $connection as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return $response_data;
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
				__( 'Sorry, Publicize is not available on your site right now.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Publicize data on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Connections' );
