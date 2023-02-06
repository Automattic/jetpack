<?php
/**
 * REST API endpoint for the External Media.
 *
 * @package automattic/jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * External Media helper API.
 *
 * @since 8.7.0
 */
class WPCOM_REST_API_V2_Endpoint_External_Media extends WP_REST_Controller {

	/**
	 * Media argument schema for /copy endpoint.
	 *
	 * @var array
	 */
	public $media_schema = array(
		'type'  => 'array',
		'items' => array(
			'type'       => 'object',
			'required'   => true,
			'properties' => array(
				'caption' => array(
					'type' => 'string',
				),
				'guid'    => array(
					'type'       => 'object',
					'properties' => array(
						'caption' => array(
							'type' => 'string',
						),
						'name'    => array(
							'type' => 'string',
						),
						'title'   => array(
							'type' => 'string',
						),
						'url'     => array(
							'format' => 'uri',
							'type'   => 'string',
						),
					),
				),
				'title'   => array(
					'type' => 'string',
				),
				'meta'    => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'vertical_id'   => array(
							'type'   => 'string',
							'format' => 'text-field',
						),
						'pexels_object' => array(
							'type' => 'object',
						),
					),
				),
			),
		),
	);

	/**
	 * Service regex.
	 *
	 * @var string
	 */
	private static $services_regex = '(?P<service>google_photos|openverse|pexels)';

	/**
	 * Temporary filename.
	 *
	 * Needed to cope with Google's very long file names.
	 *
	 * @var string
	 */
	private $tmp_name;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'external-media';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for external media.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/list/' . self::$services_regex,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_external_media' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'search'      => array(
						'description' => __( 'Media collection search term.', 'jetpack' ),
						'type'        => 'string',
					),
					'number'      => array(
						'description' => __( 'Number of media items in the request', 'jetpack' ),
						'type'        => 'number',
						'default'     => 20,
					),
					'path'        => array(
						'type' => 'string',
					),
					'page_handle' => array(
						'type' => 'string',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/copy/' . self::$services_regex,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'copy_external_media' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
				'args'                => array(
					'media'   => array(
						'description'       => __( 'Media data to copy.', 'jetpack' ),
						'items'             => $this->media_schema,
						'required'          => true,
						'type'              => 'array',
						'sanitize_callback' => array( $this, 'sanitize_media' ),
						'validate_callback' => array( $this, 'validate_media' ),
					),
					'post_id' => array(
						'description' => __( 'The post ID to attach the upload to.', 'jetpack' ),
						'type'        => 'number',
						'minimum'     => 0,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connection/(?P<service>google_photos)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_connection_details' ),
				'permission_callback' => array( $this, 'permission_callback' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connection/(?P<service>google_photos)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_connection' ),
				'permission_callback' => array( $this, 'permission_callback' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to external media libraries.
	 */
	public function permission_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Checks if a given request has access to create an attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! empty( $request['id'] ) ) {
			return new WP_Error(
				'rest_post_exists',
				__( 'Cannot create existing post.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$post_type = get_post_type_object( 'attachment' );

		if ( ! current_user_can( $post_type->cap->create_posts ) ) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create posts as this user.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to upload media on this site.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Sanitization callback for media parameter.
	 *
	 * @param array $param Media parameter.
	 * @return true|\WP_Error
	 */
	public function sanitize_media( $param ) {
		$param = $this->prepare_media_param( $param );

		return rest_sanitize_value_from_schema( $param, $this->media_schema );
	}

	/**
	 * Validation callback for media parameter.
	 *
	 * @param array $param Media parameter.
	 * @return true|\WP_Error
	 */
	public function validate_media( $param ) {
		$param = $this->prepare_media_param( $param );

		return rest_validate_value_from_schema( $param, $this->media_schema, 'media' );
	}

	/**
	 * Decodes guid json and sets parameter defaults.
	 *
	 * @param array $param Media parameter.
	 * @return array
	 */
	private function prepare_media_param( $param ) {
		foreach ( $param as $key => $item ) {
			if ( ! empty( $item['guid'] ) ) {
				$param[ $key ]['guid'] = json_decode( $item['guid'], true );
			}

			if ( empty( $param[ $key ]['caption'] ) ) {
				$param[ $key ]['caption'] = '';
			}
			if ( empty( $param[ $key ]['title'] ) ) {
				$param[ $key ]['title'] = '';
			}
		}

		return $param;
	}

	/**
	 * Retrieves media items from external libraries.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array|\WP_Error|mixed
	 */
	public function get_external_media( \WP_REST_Request $request ) {
		$params     = $request->get_params();
		$wpcom_path = sprintf( '/meta/external-media/%s', rawurlencode( $params['service'] ) );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$request = new \WP_REST_Request( 'GET', '/' . $this->namespace . $wpcom_path );
			$request->set_query_params( $params );

			return rest_do_request( $request );
		}

		// Build query string to pass to wpcom endpoint.
		$service_args = array_filter(
			$params,
			function ( $key ) {
				return in_array( $key, array( 'search', 'number', 'path', 'page_handle', 'filter' ), true );
			},
			ARRAY_FILTER_USE_KEY
		);
		if ( ! empty( $service_args ) ) {
			$wpcom_path .= '?' . http_build_query( $service_args );
		}

		$response = Client::wpcom_json_api_request_as_user( $wpcom_path );

		switch ( wp_remote_retrieve_response_code( $response ) ) {
			case 200:
				$response = json_decode( wp_remote_retrieve_body( $response ), true );
				break;

			case 401:
				$response = new WP_Error(
					'authorization_required',
					__( 'You are not connected to that service.', 'jetpack' ),
					array( 'status' => 403 )
				);
				break;

			case 403:
				$error    = json_decode( wp_remote_retrieve_body( $response ) );
				$response = new WP_Error( $error->code, $error->message, $error->data );
				break;

			default:
				if ( is_wp_error( $response ) ) {
					$response->add_data( array( 'status' => 400 ) );
					break;
				}
				$response = new WP_Error(
					'rest_request_error',
					__( 'An unknown error has occurred. Please try again later.', 'jetpack' ),
					array( 'status' => wp_remote_retrieve_response_code( $response ) )
				);
		}

		return $response;
	}

	/**
	 * Saves an external media item to the media library.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array|\WP_Error|mixed
	 */
	public function copy_external_media( \WP_REST_Request $request ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$post_id = $request->get_param( 'post_id' );

		$responses = array();
		foreach ( $request->get_param( 'media' ) as $item ) {
			// Download file to temp dir.
			$download_url = $this->get_download_url( $item['guid'] );
			if ( is_wp_error( $download_url ) ) {
				$responses[] = $download_url;
				continue;
			}

			$id = $this->sideload_media( $item['guid']['name'], $download_url, $post_id );
			if ( is_wp_error( $id ) ) {
				$responses[] = $id;
				continue;
			}

			$this->update_attachment_meta( $id, $item );

			// Add attachment data or WP_Error.
			$responses[] = $this->get_attachment_data( $id, $item );
		}

		return $responses;
	}

	/**
	 * Gets connection authorization details.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array|\WP_Error|mixed
	 */
	public function get_connection_details( \WP_REST_Request $request ) {
		$service    = rawurlencode( $request->get_param( 'service' ) );
		$wpcom_path = sprintf( '/meta/external-media/connection/%s', $service );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$internal_request = new \WP_REST_Request( 'GET', '/' . $this->namespace . $wpcom_path );
			$internal_request->set_query_params( $request->get_params() );

			return rest_do_request( $internal_request );
		}

		$response = Client::wpcom_json_api_request_as_user( $wpcom_path );

		return json_decode( wp_remote_retrieve_body( $response ), true );
	}

	/**
	 * Deletes a Google Photos connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error|WP_REST_Response
	 */
	public function delete_connection( WP_REST_Request $request ) {
		$service    = rawurlencode( $request->get_param( 'service' ) );
		$wpcom_path = sprintf( '/meta/external-media/connection/%s', $service );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$internal_request = new WP_REST_Request( Requests::DELETE, '/' . $this->namespace . $wpcom_path );
			$internal_request->set_query_params( $request->get_params() );

			return rest_do_request( $internal_request );
		}

		$response = Client::wpcom_json_api_request_as_user(
			$wpcom_path,
			'2',
			array(
				'method' => Requests::DELETE,
			)
		);

		return json_decode( wp_remote_retrieve_body( $response ), true );
	}

	/**
	 * Filter callback to provide a shorter file name for google images.
	 *
	 * @return string
	 */
	public function tmp_name() {
		return $this->tmp_name;
	}

	/**
	 * Returns a download URL, dealing with Google's long file names.
	 *
	 * @param array $guid Media information.
	 * @return string|\WP_Error
	 */
	public function get_download_url( $guid ) {
		$this->tmp_name = $guid['name'];
		add_filter( 'wp_unique_filename', array( $this, 'tmp_name' ) );
		$download_url = download_url( $guid['url'] );
		remove_filter( 'wp_unique_filename', array( $this, 'tmp_name' ) );

		if ( is_wp_error( $download_url ) ) {
			$download_url->add_data( array( 'status' => 400 ) );
		}

		return $download_url;
	}

	/**
	 * Uploads media file and creates attachment object.
	 *
	 * @param string $file_name    Name of media file.
	 * @param string $download_url Download URL.
	 * @param int    $post_id      The ID of the post to attach the image to.
	 *
	 * @return int|\WP_Error
	 */
	public function sideload_media( $file_name, $download_url, $post_id = 0 ) {
		$file = array(
			'name'     => wp_basename( $file_name ),
			'tmp_name' => $download_url,
		);

		$id = media_handle_sideload( $file, $post_id, null );
		if ( is_wp_error( $id ) ) {
			wp_delete_file( $file['tmp_name'] );
			$id->add_data( array( 'status' => 400 ) );
		}

		return $id;
	}

	/**
	 * Updates attachment meta data for media item.
	 *
	 * @param int   $id   Attachment ID.
	 * @param array $item Media item.
	 */
	public function update_attachment_meta( $id, $item ) {
		$meta                          = wp_get_attachment_metadata( $id );
		$meta['image_meta']['title']   = $item['title'];
		$meta['image_meta']['caption'] = $item['caption'];

		wp_update_attachment_metadata( $id, $meta );

		update_post_meta( $id, '_wp_attachment_image_alt', $item['title'] );
		wp_update_post(
			array(
				'ID'           => $id,
				'post_excerpt' => $item['caption'],
			)
		);

		if ( ! empty( $item['meta'] ) ) {
			foreach ( $item['meta'] as $meta_key => $meta_value ) {
				update_post_meta( $id, $meta_key, $meta_value );
			}
		}
	}

	/**
	 * Retrieves attachment data for media item.
	 *
	 * @param int   $id   Attachment ID.
	 * @param array $item Media item.
	 *
	 * @return array|\WP_REST_Response Attachment data on success, WP_Error on failure.
	 */
	public function get_attachment_data( $id, $item ) {
		$image_src = wp_get_attachment_image_src( $id, 'full' );

		if ( empty( $image_src[0] ) ) {
			$response = new WP_Error(
				'rest_upload_error',
				__( 'Could not retrieve source URL.', 'jetpack' ),
				array( 'status' => 400 )
			);
		} else {
			$response = array(
				'id'      => $id,
				'caption' => $item['caption'],
				'alt'     => $item['title'],
				'type'    => 'image',
				'url'     => $image_src[0],
			);
		}

		return $response;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_External_Media' );
