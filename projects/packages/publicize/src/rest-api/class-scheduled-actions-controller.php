<?php
/**
 * The Publicize Scheduled Actions Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Scheduled Actions Controller class.
 */
class Scheduled_Actions_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/scheduled-actions';

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
						'post_id' => array(
							'type'        => 'integer',
							'description' => __( 'The post ID to filter the items by.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'post_id'       => array(
							'type'     => 'integer',
							'required' => true,
						),
						'connection_id' => array(
							'type'     => 'integer',
							'required' => true,
						),
						'message'       => array(
							'type' => 'string',
						),
						'share_date'    => array(
							'type'        => 'integer',
							'description' => sprintf(
								/* translators: %s is the new field name */
								__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
								'timestamp'
							),
						),
						'timestamp'     => array(
							'type'        => 'integer',
							'description' => __( 'GMT/UTC Unix timestamp in seconds for the action.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<action_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'message'    => array( 'type' => 'string' ),
						'share_date' => array(
							'type'        => 'integer',
							'description' => sprintf(
								/* translators: %s is the new field name */
								__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
								'timestamp'
							),
						),
						'timestamp'  => array(
							'type'        => 'integer',
							'description' => __( 'GMT/UTC Unix timestamp in seconds for the action.', 'jetpack-publicize-pkg' ),
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
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'publicize-scheduled-action',
			'type'       => 'object',
			'properties' => array(
				'blog_id'       => array(
					'type'        => 'integer',
					'description' => __( 'The blog ID that the action belongs to.', 'jetpack-publicize-pkg' ),
				),
				'connection_id' => array(
					'type'        => 'integer',
					'description' => __( 'The publicize connection ID that the action belongs to.', 'jetpack-publicize-pkg' ),
				),
				'id'            => array(
					'type'        => 'integer',
					'description' => __( 'Action identifier.', 'jetpack-publicize-pkg' ),
				),
				'ID'            => array(
					'type'        => 'integer',
					'description' => __( 'Action identifier.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
						/* translators: %s is the new field name */
						__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
						'id'
					),
				),
				'message'       => array(
					'type'        => 'string',
					'description' => __( 'The result of the action.', 'jetpack-publicize-pkg' ),
				),
				'post_id'       => array(
					'type'        => 'integer',
					'description' => __( 'The post ID that the action belongs to.', 'jetpack-publicize-pkg' ),
				),
				'share_date'    => array(
					'type'        => 'string',
					'description' => __( 'ISO 8601 formatted date for the action.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
						/* translators: %s is the new field name */
						__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
						'timestamp'
					),
				),
				'timestamp'     => array(
					'type'        => 'integer',
					'description' => __( 'GMT/UTC Unix timestamp in seconds for the action.', 'jetpack-publicize-pkg' ),
				),
				'wpcom_user_id' => array(
					'type'        => 'integer',
					'description' => __( 'wordpress.com ID of the user who created the action.', 'jetpack-publicize-pkg' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Check if the user has the basic permissions to access the Publicize scheduled actions.
	 *
	 * @return bool|WP_Error
	 */
	public function basic_permissions_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}
		return $this->publicize_permissions_check();
	}

	/**
	 * Check if the user has the basic permissions
	 * required to perform CRUD operations on an item related to a post
	 *
	 * @param int $post_id The post ID.
	 * @return bool|WP_Error
	 */
	public function basic_post_permissions_check( $post_id ) {

		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				'post_not_found',
				__( 'Post not found.', 'jetpack-publicize-pkg' ),
				array( 'status' => 400 )
			);
		}

		// Ensure that the user can edit the post.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view or scheduled shares for that post.', 'jetpack-publicize-pkg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Verify that the request has access to connectoins list.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		$basic_permissions = $this->basic_permissions_check();

		if ( is_wp_error( $basic_permissions ) || ! $basic_permissions ) {
			return $basic_permissions;
		}

		$post_id = $request->get_param( 'post_id' );

		/**
		 * The post_id is optional only for editors and above.
		 * It means that authors can view the scheduled shares
		 * only for the post they can edit but
		 * cannot view all the scheduled shares for the site.
		 */
		if ( ! $post_id && ! current_user_can( 'edit_others_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You must pass a post ID to list scheduled shares.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $post_id ) {
			return $this->basic_post_permissions_check( $post_id );
		}

		return true;
	}

	/**
	 * Get list of Publicize scheduled actions
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error The response
	 */
	public function get_items( $request ) {

		if ( Utils::is_wpcom() ) {
			$post_id = $request->get_param( 'post_id' );

			require_lib( 'publicize/class.publicize-actions' );

			if ( $post_id ) {
				$scheduled_actions = \Publicize_Actions::get_scheduled_actions_by_blog_and_post_id(
					get_current_blog_id(),
					$post_id
				);
			} else {
				$scheduled_actions = \Publicize_Actions::get_scheduled_actions_by_blog_id(
					get_current_blog_id()
				);
			}

			if ( is_wp_error( $scheduled_actions ) ) {
				return $scheduled_actions;
			}

			return rest_ensure_response(
				$this->prepare_items_for_response( $scheduled_actions, $request )
			);
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request )
		);
	}

	/**
	 * Checks if a given request has access to create a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$basic_permissions = $this->basic_permissions_check();

		if ( is_wp_error( $basic_permissions ) || ! $basic_permissions ) {
			return $basic_permissions;
		}

		$post_id = $request->get_param( 'post_id' );

		$basic_post_permissions = $this->basic_post_permissions_check( $post_id );

		if ( is_wp_error( $basic_post_permissions ) || ! $basic_post_permissions ) {
			return $basic_post_permissions;
		}

		$post = get_post( $post_id );

		// Ensure that the post is published.
		if ( 'publish' !== $post->post_status ) {
			return new WP_Error(
				'post_not_published',
				__( 'The post must be published to schedule it for sharing.', 'jetpack-publicize-pkg' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * We need to validate the passed connection_id
		 * to ensure that it's valid and the user has access to the connection.
		 */
		$connection = Connections::get_by_id( (string) $request->get_param( 'connection_id' ) );

		if ( ! $connection ) {
			return new WP_Error(
				'connection_not_found',
				__( 'That connection does not exist.', 'jetpack-publicize-pkg' ),
				array( 'status' => 400 )
			);
		}

		if ( current_user_can( 'edit_others_posts' ) ) {
			return true;
		}

		/**
		 * If the user is not an editor or above, they can create
		 * actions only for the connections they have access to.
		 * So, we need to check if the user has access to the connection
		 * that they are trying to use to create the action.
		 */
		if ( ! Connections::is_shared( $connection ) && ! Connections::user_owns_connection( $connection ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you cannot schedule shares to that connection.', 'jetpack-publicize-pkg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Creates a new action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {

		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/class.publicize-actions' );

			$post_id       = $request['post_id'];
			$blog_id       = get_current_blog_id();
			$user_id       = get_current_user_id();
			$connection_id = (int) $request['connection_id'];
			$message       = sanitize_textarea_field( $request['message'] ?? '' );

			$timestamp = time();
			if ( ! empty( $request['timestamp'] ) ) {
				$timestamp = (int) $request['timestamp'];
			} elseif ( ! empty( $request['share_date'] ) ) { // Fallback for deprecated field.
				$timestamp = $request['share_date']; // Calypso sends this as timestamp.
			}

			$action = array(
				'post_id'            => $post_id,
				'blog_id'            => $blog_id,
				'user_id'            => $user_id,
				'connection_id'      => $connection_id,
				'message'            => $message,
				'scheduled_datetime' => $this->format_date_for_db( $timestamp ),
			);

			$action_id = \Publicize_Actions::add_scheduled_action( $action );
			if ( is_wp_error( $action_id ) ) {
				return $action_id;
			}
			$action['publicize_scheduled_action_id'] = $action_id;

			$response = rest_ensure_response(
				$this->prepare_action_for_response( $action )
			);

			$response->set_status( 201 );

			return $response;
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request )
		);
	}

	/**
	 * Checks if a given request has access to read an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object or false otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$basic_permissions = $this->basic_permissions_check();

		if ( is_wp_error( $basic_permissions ) || ! $basic_permissions ) {
			return $basic_permissions;
		}

		if ( ! Utils::is_wpcom() ) {
			// On Jetpack sites, we need to just check for basic permissions.
			return true;
		}

		$action = $this->wpcom_get_action( $request['action_id'] );

		if ( is_wp_error( $action ) ) {
			return $action;
		}

		// Ensure that the action is for the current blog.
		if ( get_current_blog_id() !== $action['blog_id'] ) {
			return false;
		}

		return $this->basic_post_permissions_check( $action['post_id'] );
	}

	/**
	 * Retrieves a single action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$action_id = $request['action_id'];

		if ( Utils::is_wpcom() ) {

			return rest_ensure_response(
				$this->wpcom_get_action( $action_id )
			);
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request, $action_id )
		);
	}

	/**
	 * Checks if a given request has access to update an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		// If a user can view an item, they can update it.
		return $this->get_item_permissions_check( $request );
	}

	/**
	 * Update an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {

		$action_id = $request['action_id'];

		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/class.publicize-actions' );

			$action = $this->wpcom_get_action( $action_id );

			if ( is_wp_error( $action ) ) {
				return $action;
			}
			$action['message'] = ! empty( $request['message'] ) ? sanitize_textarea_field( $request['message'] ) : $action['message'];

			// Retain the original timestamp by default.
			$timestamp = $action['timestamp'];
			if ( ! empty( $request['timestamp'] ) ) {
				$timestamp = (int) $request['timestamp'];
			} elseif ( ! empty( $request['share_date'] ) ) { // Fallback for deprecated field.
				$timestamp = strtotime( $request['share_date'] );
			}
			$action['scheduled_datetime'] = $this->format_date_for_db( $timestamp );

			$action['publicize_scheduled_action_id'] = $action['id'];

			$save_result = \Publicize_Actions::edit_scheduled_action( $action['id'], $action );
			if ( is_wp_error( $save_result ) ) {
				return $save_result;
			}
			return rest_ensure_response(
				$this->prepare_action_for_response( $action )
			);
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request, $action_id )
		);
	}

	/**
	 * Checks if a given request has access to delete an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		// If a user can update an item, they can delete it.
		return $this->update_item_permissions_check( $request );
	}

	/**
	 * Delete an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {

		$action_id = $request['action_id'];

		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/class.publicize-actions' );

			$action = $this->wpcom_get_action( $action_id );
			if ( is_wp_error( $action ) ) {
				return $action;
			}
			$delete_result = \Publicize_Actions::delete_scheduled_action(
				$action['id'],
				$action['blog_id']
			);
			if ( is_wp_error( $delete_result ) ) {
				return $delete_result;
			}
			return rest_ensure_response( true );
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request, $action_id )
		);
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $items   Items to prepare.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return array Items.
	 */
	public function prepare_items_for_response( $items, $request ) {

		$output = array();

		foreach ( $items as $raw_item ) {

			$item = $this->prepare_action_for_response( $raw_item );

			$data = $this->prepare_item_for_response( $item, $request );

			$output[] = $this->prepare_response_for_collection( $data );
		}

		return $output;
	}

	/**
	 * Prepare a single action for response, setting the correct field names.
	 *
	 * @param array $raw_action Raw action.
	 *
	 * @return array Items.
	 */
	public function prepare_action_for_response( $raw_action ) {

		return array(
			'blog_id'       => (int) $raw_action['blog_id'],
			'connection_id' => (int) $raw_action['connection_id'],
			'id'            => (int) $raw_action['publicize_scheduled_action_id'],
			'ID'            => (int) $raw_action['publicize_scheduled_action_id'],
			'message'       => (string) $raw_action['message'],
			'post_id'       => (int) $raw_action['post_id'],
			'share_date'    => (string) $this->format_date_for_output( $raw_action['scheduled_datetime'] ),
			'timestamp'     => strtotime( $raw_action['scheduled_datetime'] ),
			'wpcom_user_id' => (int) $raw_action['user_id'],
		);
	}

	/**
	 * Return a formatted action by action_id
	 *
	 * @param int $action_id The action ID.
	 * @return WP_Error|array The action
	 */
	private function wpcom_get_action( $action_id ) {
		// Ensure that we are on WPCOM.
		Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'publicize/class.publicize-actions' );
		$action = \Publicize_Actions::get_scheduled_action( $action_id );
		if ( is_wp_error( $action ) ) {
			return $action;
		}
		if ( ! isset( $action['publicize_scheduled_action_id'] ) ) {
			return new WP_Error( 'not_found', __( 'Could not find that scheduled action.', 'jetpack-publicize-pkg' ), array( 'status' => 404 ) );
		}

		return $this->prepare_action_for_response( $action );
	}

	/**
	 * Returns ISO 8601 formatted datetime: 2011-12-08T01:15:36-08:00
	 *
	 * @param string $date_gmt GMT datetime string.
	 * @return string
	 */
	private function format_date_for_output( $date_gmt ) {
		// phpcs:ignore WordPress.DateTime.RestrictedFunctions.date_date
		return date( 'c', strtotime( $date_gmt ) );
	}

	/**
	 * Returns SQL formatted datetime from unix timestamp
	 *
	 * @param int $timestamp The timestamp.
	 *
	 * @return string
	 */
	private function format_date_for_db( $timestamp ) {
		// Round down to the nearest minute.
		$floored_timestamp = $timestamp - $timestamp % 60;
		return gmdate( 'Y-m-d H:i:s', $floored_timestamp );
	}
}
