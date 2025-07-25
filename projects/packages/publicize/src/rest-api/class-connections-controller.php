<?php
/**
 * The Publicize Connections Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Connections Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Connections_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/connections';

		$this->allow_requests_as_blog = true;

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
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'test_connections' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to test connections.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'keyring_connection_ID' => array(
							'description' => __( 'Keyring connection ID.', 'jetpack-publicize-pkg' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'external_user_ID'      => array(
							'description' => __( 'External User Id - in case of services like Facebook.', 'jetpack-publicize-pkg' ),
							'type'        => 'string',
						),
						'shared'                => array(
							'description' => __( 'Whether the connection is shared with other users.', 'jetpack-publicize-pkg' ),
							'type'        => 'boolean',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<connection_id>[0-9]+)',
			array(
				'args'   => array(
					'connection_id' => array(
						'description' => __( 'Unique identifier for the connection.', 'jetpack-publicize-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'shared' => array(
							'description' => __( 'Whether the connection is shared with other users.', 'jetpack-publicize-pkg' ),
							'type'        => 'boolean',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),

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
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
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
				self::get_the_item_schema()
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get the schema for the connection item.
	 *
	 * @return array
	 */
	public static function get_the_item_schema() {
		return array(
			'connection_id'   => array(
				'type'        => 'string',
				'description' => __( 'Connection ID of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'display_name'    => array(
				'type'        => 'string',
				'description' => __( 'Display name of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'external_handle' => array(
				'type'        => array( 'string', 'null' ),
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
				'type'        => array( 'string', 'null' ),
				'description' => __( 'The connection status.', 'jetpack-publicize-pkg' ),
				'enum'        => array(
					'ok',
					'broken',
					'must_reauth',
					null,
				),
			),
			'wpcom_user_id'   => array(
				'type'        => 'integer',
				'description' => __( 'wordpress.com ID of the user the connection belongs to.', 'jetpack-publicize-pkg' ),
			),
		);
	}

	/**
	 * Verify that the request has access to connectoins list.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->publicize_permissions_check();
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( Publicize_Utils::is_wpcom() ) {
			$args = array(
				'context'          => self::is_authorized_blog_request() ? 'blog' : 'user',
				'test_connections' => $request->get_param( 'test_connections' ),
			);

			$connections = Connections::wpcom_get_connections( $args );
		} else {
			$connections = $this->proxy_request_to_wpcom_as_user( $request );
		}

		if ( is_wp_error( $connections ) ) {
			return $connections;
		}

		$items = array();

		foreach ( $connections as $item ) {
			$data = $this->prepare_item_for_response( $item, $request );

			$items[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}

	/**
	 * Checks if a given request has access to create a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$permissions = parent::publicize_permissions_check();

		if ( is_wp_error( $permissions ) ) {
			return $permissions;
		}

		return current_user_can( 'publish_posts' );
	}

	/**
	 * Creates a new connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( Publicize_Utils::is_wpcom() ) {

			$input = array(
				'keyring_connection_ID' => $request->get_param( 'keyring_connection_ID' ),
				'shared'                => $request->get_param( 'shared' ),
			);

			$external_user_id = $request->get_param( 'external_user_ID' );
			if ( ! empty( $external_user_id ) ) {
				$input['external_user_ID'] = $external_user_id;
			}

			$result = Connections::wpcom_create_connection( $input );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$connection = Connections::get_by_id( $result );

			$response = $this->prepare_item_for_response( $connection, $request );
			$response = rest_ensure_response( $response );

			$response->set_status( 201 );

			return $response;

		}

		$response = $this->proxy_request_to_wpcom_as_user( $request, '', array( 'timeout' => 120 ) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'jp_connection_update_failed',
				__( 'Something went wrong while creating a connection.', 'jetpack-publicize-pkg' ),
				$response->get_error_message()
			);
		}

		$response = rest_ensure_response( $response );

		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Checks if a given request has access to update a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$permissions = parent::publicize_permissions_check();

		if ( is_wp_error( $permissions ) ) {
			return $permissions;
		}

		// If the user cannot manage the connection, they can't update it either.
		if ( ! $this->manage_connection_permission_check( $request ) ) {
			return new WP_Error(
				'rest_cannot_edit',
				__( 'Sorry, you are not allowed to update this connection.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// If the connection is being marked/unmarked as shared.
		if ( $request->has_param( 'shared' ) ) {
			// Only editors and above can mark a connection as shared.
			return current_user_can( 'edit_others_posts' );
		}

		return current_user_can( 'publish_posts' );
	}

	/**
	 * Update a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$connection_id = $request->get_param( 'connection_id' );

		if ( Publicize_Utils::is_wpcom() ) {

			$input = array(
				'shared' => $request->get_param( 'shared' ),
			);

			$result = Connections::wpcom_update_connection( $connection_id, $input );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$connection = Connections::get_by_id( $connection_id );

			$response = $this->prepare_item_for_response( $connection, $request );
			$response = rest_ensure_response( $response );

			$response->set_status( 201 );

			return $response;
		}

		$response = $this->proxy_request_to_wpcom_as_user( $request, $connection_id, array( 'timeout' => 120 ) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'jp_connection_updation_failed',
				__( 'Something went wrong while updating the connection.', 'jetpack-publicize-pkg' ),
				$response->get_error_message()
			);
		}

		$response = rest_ensure_response( $response );

		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Checks if a given request has access to delete a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$permissions = parent::publicize_permissions_check();

		if ( is_wp_error( $permissions ) ) {
			return $permissions;
		}

		return $this->manage_connection_permission_check( $request );
	}

	/**
	 * Delete a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$connection_id = $request->get_param( 'connection_id' );

		if ( Publicize_Utils::is_wpcom() ) {

			$result = Connections::wpcom_delete_connection( $connection_id );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$response = rest_ensure_response( $result );

			$response->set_status( 201 );

			return $response;
		}

		$response = $this->proxy_request_to_wpcom_as_user( $request, $connection_id, array( 'timeout' => 120 ) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'jp_connection_deletion_failed',
				__( 'Something went wrong while deleting the connection.', 'jetpack-publicize-pkg' ),
				$response->get_error_message()
			);
		}

		$response = rest_ensure_response( $response );

		$response->set_status( 201 );

		return $response;
	}
}
