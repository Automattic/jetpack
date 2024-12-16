<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Fetch information about Publicize connections on a site.
 *
 * @package automattic/jetpack
 */
namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
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

		return array_merge(
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
				'user_id'         => array(
					'type'        => 'integer',
					'description' => __( 'ID of the user the connection belongs to.', 'jetpack-publicize-pkg' ),
				),
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
				$connection_id   = $publicize->get_connection_id( $connection );

				$items[] = array(
					'connection_id'        => $connection_id,
					'display_name'         => $publicize->get_display_name( $service_name, $connection ),
					'external_handle'      => $publicize->get_external_handle( $service_name, $connection ),
					'external_id'          => $connection_meta['external_id'] ?? '',
					'profile_link'         => $publicize->get_profile_link( $service_name, $connection ),
					'profile_picture'      => $publicize->get_profile_picture( $connection ),
					'service_label'        => Publicize::get_service_label( $service_name ),
					'service_name'         => $service_name,
					'shared'               => ! $connection_data['user_id'],
					'user_id'              => (int) $connection_data['user_id'],

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
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		$items = array();

		$connections = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? $this->get_connections() : $this->get_connections_from_wpcom();

		foreach ( $connections as $item ) {
			$items[] = $this->prepare_item_for_response( $item, $request );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', count( $items ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}

	/**
	 * Proxy the request to the WPCOM API
	 *
	 * @return array Connection objects in the same shape as from `get_connections`
	 */
	protected function get_connections_from_wpcom() {
		$site_id = Manager::get_site_id( true );
		if ( ! $site_id ) {
			return array();
		}

		$response = Client::wpcom_json_api_request_as_user( sprintf( '/sites/%d/publicize/connections', $site_id ), 'v2', array( 'method' => 'GET' ) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			// TODO log error.
			return array();
		}

		$body = wp_remote_retrieve_body( $response );

		$items = json_decode( $body, true );
		return $items ? $items : array();
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
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\Publicize\WPCOM_REST_API_V2_Endpoint_List_Publicize_Connections' );
}
