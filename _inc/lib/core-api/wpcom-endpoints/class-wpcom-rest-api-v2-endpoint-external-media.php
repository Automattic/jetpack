<?php
/**
 * REST API endpoint for the External Media.
 *
 * @package Jetpack
 * @since 8.5.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * External Media helper API.
 *
 * @since 8.5
 */
class WPCOM_REST_API_V2_Endpoint_External_Media extends WP_REST_Controller {

	private static $services_regex = '(?P<service>google_photos|pexels)';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'external-media';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/list/' . self::$services_regex,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_external_media' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args' => array(
					'search' => array(
						'description' => __( 'Media collection search term.', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'number' => array(
						'description' => __( 'Number of media items in the request', 'jetpack' ),
						'type'        => 'number',
						'required'    => false,
						'default'     => 20,
					),
					'path' => array(
						'type'     => 'string',
						'required' => false,
					),
					'page_handle' => array(
						'type'     => 'string',
						'required' => false,
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
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'media' => array(
						'description' => __( 'Media data to copy.', 'jetpack' ),
						'type'        => 'array',
						'items'       => array(
							'type' => 'object',
						),
						'required'    => true,
						'default'     => [],
					),
				)
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connection/(?P<service>google_photos)',
			array (
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_connection_details' ),
				'permission_callback' => array( $this, 'permission_callback' ),
			)
		);
	}

	public function permission_callback() {
		return current_user_can( 'edit_posts' );
	}

	public function wp_unique_filename() {
		return $this->name;
	}

	public function get_external_media( \WP_REST_Request $request ) {
		$params     = $request->get_params();
		$wpcom_path = sprintf( '/meta/external-media/%s', urlencode( $params['service'] ) );

		// Build query string to pass to wpcom endpoint.
		$service_args = array_filter( $params, function( $key ) {
			return in_array( $key, array( 'search', 'number', 'path', 'page_handle' ) );
		}, ARRAY_FILTER_USE_KEY );
		if ( ! empty($service_args ) ) {
			$wpcom_path .= '?' . http_build_query( $service_args );
		}

		$response = Client::wpcom_json_api_request_as_user( $wpcom_path, '2' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body );
	}

	public function copy_external_media( \WP_REST_Request $request ) {
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! function_exists( 'media_handle_sideload' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/media.php' );
		}

		if ( ! function_exists( 'wp_read_image_metadata' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/image.php' );
		}

		$media = $request->get_param( 'media' );
		if ( empty( $media ) ) {
			return new \WP_Error( 'external_media_data', 'No media data is provided' );
		}

		$responses = [];
		foreach ( $media as $item ) {
			$caption = '';
			$title   = '';
			$guid    = false;

			if ( isset( $item['guid'] ) ) {
				$guid = $item['guid'];
			}

			if ( isset( $item['caption'] ) ) {
				$caption = $item['caption'];
			}

			if ( isset( $item['title'] ) ) {
				$title = $item['title'];
			}

			if ( ! $guid ) {
				return new \WP_Error( 'external_media_guid', 'No GUID is provided' );
			}

			$guid = json_decode( $guid, true );

//			$this->name = $guid['name'];

			// Download file to temp dir
			$file = [
				'name' => wp_basename( $guid['name'] ),
				'tmp_name' => download_url( $guid['url'] ),
			];

			if ( is_wp_error( $file['tmp_name'] ) ) {
				$responses[] = $file['tmp_name'];
				continue;
			}

			$id = media_handle_sideload( $file, 0, null );
			if ( is_wp_error( $id ) ) {
				@unlink( $file['tmp_name'] );
				$responses[] = $id;
				continue;
			}

			$meta                          = wp_get_attachment_metadata( $id );
			$meta['image_meta']['title']   = $title;
			$meta['image_meta']['caption'] = $caption;

			wp_update_attachment_metadata( $id, $meta );

			update_post_meta( $id, '_wp_attachment_image_alt', $title );
			wp_update_post( [
				'ID'           => $id,
				'post_excerpt' => $caption,
			] );

			$request  = new \WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
			$response = rest_do_request( $request );

			if ( is_wp_error( $response ) ) {
				$responses[] = $response;
			} else {
				$responses[] = [
					'id'      => $id,
					'caption' => $caption,
					'alt'     => $title,
					'url'     => $response->data['source_url'],
				];
			}
		}

		return $responses;
	}

	public function get_connection_details( \WP_REST_Request $request ) {
		$service    = urlencode( $request->get_param( 'service' ) );
		$wpcom_path = sprintf( '/meta/external-services/%s', $service );

		$response = Client::wpcom_json_api_request_as_user( $wpcom_path, '1.1', [], null, 'rest' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body );
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_External_Media' );
