<?php
/**
 * The Publicize Rest Controller class.
 * Registers the REST routes for Publicize.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Publicize\REST_API\Proxy_Requests;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the REST routes for Search.
 */
class REST_Controller {
	/**
	 * Whether it's run on WPCOM.
	 *
	 * @var bool
	 */
	protected $is_wpcom;

	/**
	 * Social Product Slugs
	 *
	 * @var string
	 */
	const JETPACK_SOCIAL_V1_YEARLY = 'jetpack_social_v1_yearly';

	/**
	 * Constructor
	 *
	 * @param bool $is_wpcom - Whether it's run on WPCOM.
	 */
	public function __construct( $is_wpcom = false ) {
		$this->is_wpcom = $is_wpcom;
	}

	/**
	 * Registers the REST routes for Social.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/publicize/connection-test-results',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_publicize_connection_test_results' ),
				'permission_callback' => array( $this, 'require_author_privilege_callback' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/publicize/connections',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_publicize_connections' ),
				'permission_callback' => array( $this, 'require_author_privilege_callback' ),
			)
		);

		// Get current social product from the product's endpoint.
		register_rest_route(
			'jetpack/v4',
			'/social-product-info',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_social_product_info' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/publicize/(?P<postId>\d+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'share_post' ),
				'permission_callback' => array( $this, 'require_author_privilege_callback' ),
				'args'                => array(
					'message'             => array(
						'description'       => __( 'The message to share.', 'jetpack-publicize-pkg' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'skipped_connections' => array(
						'description'       => __( 'Array of external connection IDs to skip sharing.', 'jetpack-publicize-pkg' ),
						'type'              => 'array',
						'required'          => false,
						'validate_callback' => function ( $param ) {
							return is_array( $param );
						},
						'sanitize_callback' => function ( $param ) {
							if ( ! is_array( $param ) ) {
								return new WP_Error(
									'rest_invalid_param',
									esc_html__( 'The skipped_connections argument must be an array of connection IDs.', 'jetpack-publicize-pkg' ),
									array( 'status' => 400 )
								);
							}
							return array_map( 'absint', $param );
						},
					),
					'async'               => array(
						'description' => __( 'Whether to share the post asynchronously.', 'jetpack-publicize-pkg' ),
						'type'        => 'boolean',
						'default'     => false,
					),
				),
			)
		);

		// Create a Jetpack Social connection.
		register_rest_route(
			'jetpack/v4',
			'/social/connections',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_publicize_connection' ),
				'permission_callback' => array( $this, 'require_author_privilege_callback' ),
				'schema'              => array( $this, 'get_jetpack_social_connections_schema' ),
			)
		);

		// Update a Jetpack Social connection.
		register_rest_route(
			'jetpack/v4',
			'/social/connections/(?P<connection_id>\d+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_publicize_connection' ),
				'permission_callback' => array( $this, 'update_connection_permission_check' ),
				'schema'              => array( $this, 'get_jetpack_social_connections_update_schema' ),
			)
		);

		// Delete a Jetpack Social connection.
		register_rest_route(
			'jetpack/v4',
			'/social/connections/(?P<connection_id>\d+)',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_publicize_connection' ),
				'permission_callback' => array( $this, 'manage_connection_permission_check' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/social/sync-shares/post/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_post_shares' ),
					'permission_callback' => array( Rest_Authentication::class, 'is_signed_with_blog_token' ),
					'args'                => array(
						'meta' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'_publicize_shares' => array(
									'type'     => 'array',
									'required' => true,
								),
							),
						),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/social/share-status/(?P<post_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_post_share_status' ),
					'permission_callback' => array( $this, 'require_author_privilege_callback' ),
				),
			)
		);
	}

	/**
	 * Manage connection permission check
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 *
	 * @return bool True if the user can manage the connection, false otherwise.
	 */
	public function manage_connection_permission_check( WP_REST_Request $request ) {

		if ( current_user_can( 'edit_others_posts' ) ) {
			return true;
		}

		/**
		 * Publicize instance.
		 *
		 * @var Publicize $publicize Publicize instance.
		 */
		global $publicize;

		$connection = $publicize->get_connection_for_user( $request->get_param( 'connection_id' ) );

		$owns_connection = isset( $connection['user_id'] ) && get_current_user_id() === (int) $connection['user_id'];

		return $owns_connection;
	}

	/**
	 * Update connection permission check.
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 *
	 * @return bool True if the user can update the connection, false otherwise.
	 */
	public function update_connection_permission_check( WP_REST_Request $request ) {

		// If the user cannot manage the connection, they can't update it either.
		if ( ! $this->manage_connection_permission_check( $request ) ) {
			return false;
		}

		// If the connection is being marked/unmarked as shared.
		if ( $request->has_param( 'shared' ) ) {
			// Only editors and above can mark a connection as shared.
			return current_user_can( 'edit_others_posts' );
		}

		return $this->require_author_privilege_callback();
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Only Authors can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_author_privilege_callback() {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Retrieves the JSON schema for creating a jetpack social connection.
	 *
	 * @return array Schema data.
	 */
	public function get_jetpack_social_connections_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-social-connection',
			'type'       => 'object',
			'properties' => array(
				'keyring_connection_ID' => array(
					'description' => __( 'Keyring connection ID', 'jetpack-publicize-pkg' ),
					'type'        => 'integer',
					'required'    => true,
				),
				'external_user_ID'      => array(
					'description' => __( 'External User Id - in case of services like Facebook', 'jetpack-publicize-pkg' ),
					'type'        => 'string',
				),
				'shared'                => array(
					'description' => __( 'Whether the connection is shared with other users', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}

	/**
	 * Retrieves the JSON schema for updating a jetpack social connection.
	 *
	 * @return array Schema data.
	 */
	public function get_jetpack_social_connections_update_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-social-connection',
			'type'       => 'object',
			'properties' => array(
				'external_user_ID' => array(
					'description' => __( 'External User Id - in case of services like Facebook', 'jetpack-publicize-pkg' ),
					'type'        => 'string',
				),
				'shared'           => array(
					'description' => __( 'Whether the connection is shared with other users', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}

	/**
	 * Gets the current Publicize connections, with the resolt of testing them, for the site.
	 *
	 * GET `jetpack/v4/publicize/connection-test-results`
	 *
	 * @deprecated 0.61.1
	 */
	public function get_publicize_connection_test_results() {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4, jetpack-social-6.2.0',
			'jetpack/v4/publicize/connection-test-results',
			'wpcom/v2/publicize/connections?test_connections=1'
		);

		$proxy = new Proxy_Requests( 'publicize/connections' );

		$request = new WP_REST_Request( 'GET' );

		$request->set_param( 'test_connections', '1' );

		return rest_ensure_response( $proxy->proxy_request_to_wpcom_as_user( $request ) );
	}

	/**
	 * Gets the current Publicize connections for the site.
	 *
	 * GET `jetpack/v4/publicize/connections`
	 *
	 * @deprecated 0.61.1
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 */
	public function get_publicize_connections( $request ) {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4, jetpack-social-6.2.0',
			'jetpack/v4/publicize/connections',
			'wpcom/v2/publicize/connections?test_connections=1'
		);

		if ( $request->get_param( 'test_connections' ) ) {

			$proxy = new Proxy_Requests( 'publicize/connections' );

			return rest_ensure_response( $proxy->proxy_request_to_wpcom_as_user( $request ) );
		}

		return rest_ensure_response( Connections::get_all_for_user() );
	}

	/**
	 * Create a publicize connection
	 *
	 * @deprecated 0.61.1
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 * @return WP_REST_Response|WP_Error True if the request was successful, or a WP_Error otherwise.
	 */
	public function create_publicize_connection( $request ) {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4, jetpack-social-6.2.0',
			'jetpack/v4/social/connections',
			'wpcom/v2/publicize/connections'
		);

		$proxy = new Proxy_Requests( 'publicize/connections' );

		return rest_ensure_response(
			$proxy->proxy_request_to_wpcom_as_user( $request, '', array( 'timeout' => 120 ) )
		);
	}

	/**
	 * Calls the WPCOM endpoint to update the publicize connection.
	 *
	 * POST jetpack/v4/social/connections/{connection_id}
	 *
	 * @deprecated 0.61.1
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 */
	public function update_publicize_connection( $request ) {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4, jetpack-social-6.2.0',
			'jetpack/v4/social/connections/:connection_id',
			'wpcom/v2/publicize/connections/:connection_id'
		);

		$proxy = new Proxy_Requests( 'publicize/connections' );

		$path = $request->get_param( 'connection_id' );

		return rest_ensure_response(
			$proxy->proxy_request_to_wpcom_as_user( $request, $path, array( 'timeout' => 120 ) )
		);
	}

	/**
	 * Calls the WPCOM endpoint to delete the publicize connection.
	 *
	 * DELETE jetpack/v4/social/connections/{connection_id}
	 *
	 * @deprecated 0.61.1
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 */
	public function delete_publicize_connection( $request ) {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4, jetpack-social-6.2.0',
			'jetpack/v4/social/connections/:connection_id',
			'wpcom/v2/publicize/connections/:connection_id'
		);

		$proxy = new Proxy_Requests( 'publicize/connections' );

		$path = $request->get_param( 'connection_id' );

		return rest_ensure_response(
			$proxy->proxy_request_to_wpcom_as_user( $request, $path, array( 'timeout' => 120 ) )
		);
	}

	/**
	 * Gets information about the current social product plans.
	 *
	 * @deprecated 0.63.0 Swapped to using the /my-jetpack/v1/site/products endpoint instead.
	 *
	 * @return string|WP_Error A JSON object of the current social product being if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_social_product_info() {
		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.6, jetpack-social-6.4.0',
			'jetpack/v4/social-product-info',
			'my-jetpack/v1/site/products?products=social'
		);

		$request_url   = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );

		if ( 200 !== $response_code ) {
			// Something went wrong so we'll just return the response without caching.
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack-publicize-pkg' ),
				array(
					'status'  => $response_code,
					'request' => $wpcom_request,
				)
			);
		}

		$products = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		return array(
			'v1' => $products->{self::JETPACK_SOCIAL_V1_YEARLY},
		);
	}

	/**
	 * Calls the WPCOM endpoint to reshare the post.
	 *
	 * POST jetpack/v4/publicize/(?P<postId>\d+)
	 *
	 * @deprecated 0.61.2
	 *
	 * @param WP_REST_Request $request The request object, which includes the parameters.
	 */
	public function share_post( $request ) {
		$post_id = $request->get_param( 'postId' );

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.4.1, jetpack-social-6.2.0',
			'jetpack/v4/publicize/:postId',
			'wpcom/v2/publicize/share-post/:postId'
		);

		$proxy = new Proxy_Requests( 'publicize/share-post' );

		return rest_ensure_response(
			$proxy->proxy_request_to_wpcom_as_user( $request, $post_id )
		);
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	public function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}

	/**
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Update the post with information about shares.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function update_post_shares( $request ) {

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.6, jetpack-social-6.4.0',
			'jetpack/v4/social/sync-shares/post/:id',
			'wpcom/v2/publicize/share-status/sync'
		);

		$request_body = $request->get_json_params();

		$post_id   = $request->get_param( 'id' );
		$post_meta = $request_body['meta'];
		$post      = get_post( $post_id );

		if ( $post && 'publish' === $post->post_status && isset( $post_meta[ Share_Status::SHARES_META_KEY ] ) ) {
			update_post_meta( $post_id, Share_Status::SHARES_META_KEY, $post_meta[ Share_Status::SHARES_META_KEY ] );
			$urls = array();
			foreach ( $post_meta[ Share_Status::SHARES_META_KEY ] as $share ) {
				if ( isset( $share['status'] ) && 'success' === $share['status'] ) {
					$urls[] = array(
						'url'     => $share['message'],
						'service' => $share['service'],
					);
				}
			}
			/**
			 * Fires after Publicize Shares post meta has been saved.
			 *
			 * @param array $urls {
			 *     An array of social media shares.
			 *     @type array $url URL to the social media post.
			 *     @type string $service Social media service shared to.
			 * }
			 */
			do_action( 'jetpack_publicize_share_urls_saved', $urls );
			return rest_ensure_response( new WP_REST_Response() );
		}

		return new WP_Error(
			'rest_cannot_edit',
			__( 'Failed to update the post meta', 'jetpack-publicize-pkg' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Gets the share status for a post.
	 *
	 * GET `jetpack/v4/social/share-status/<post_id>`
	 *
	 * @deprecated 0.63.0
	 *
	 * @param WP_REST_Request $request The request object.
	 */
	public function get_post_share_status( WP_REST_Request $request ) {
		$post_id = $request->get_param( 'post_id' );

		Publicize_Utils::endpoint_deprecated_warning(
			__METHOD__,
			'jetpack-14.6, jetpack-social-6.4.0',
			'jetpack/v4/social/share-status/:postId',
			'wpcom/v2/publicize/share-status'
		);

		return rest_ensure_response( Share_Status::get_post_share_status( $post_id ) );
	}
}
