<?php
/**
 * REST API endpoint for managing VideoPress metadata.
 *
 * @package automattic/jetpack
 * @since 9.3.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * VideoPress wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'videopress';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/meta',
			array(
				'args'                => array(
					'id'            => array(
						'description'       => __( 'The post id for the attachment.', 'jetpack' ),
						'type'              => 'int',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
					'title'         => array(
						'description'       => __( 'The title of the video.', 'jetpack' ),
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description'   => array(
						'description'       => __( 'The description of the video.', 'jetpack' ),
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'rating'        => array(
						'description'       => __( 'The video content rating. One of G, PG-13, R-17 or X-18', 'jetpack' ),
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'display_embed' => array(
						'description'       => __( 'Display the share menu in the player.', 'jetpack' ),
						'type'              => 'boolean',
						'required'          => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_block_update_meta' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Updates attachment meta and video metadata via the WPCOM REST API.
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return object|WP_Error Success object or WP_Error with error details.
	 */
	public function videopress_block_update_meta( $request ) {
		$json_params = $request->get_json_params();
		$post_id     = $json_params['id'];

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$guid = get_post_meta( $post_id, 'videopress_guid', true );
		} else {
			$blog_id = get_current_blog_id();
			$info    = video_get_info_by_blogpostid( $blog_id, $post_id );
			$guid    = $info->guid;
		}

		if ( ! $guid ) {
			return rest_ensure_response(
				new WP_Error(
					'error',
					__( 'This attachment cannot be updated yet.', 'jetpack' )
				)
			);
		}

		$video_request_params = $json_params;
		unset( $video_request_params['id'] );
		$video_request_params['guid'] = $guid;

		$endpoint = 'videos';
		$args     = array(
			'method'  => 'POST',
			'headers' => array( 'content-type' => 'application/json' ),
		);

		$result = Client::wpcom_json_api_request_as_blog(
			$endpoint,
			'2',
			$args,
			wp_json_encode( $video_request_params ),
			'wpcom'
		);

		if ( is_wp_error( $result ) ) {
			return rest_ensure_response( $result );
		}

		$response_body = json_decode( wp_remote_retrieve_body( $result ) );
		if ( is_bool( $response_body ) && $response_body ) {

			// VideoPress data is stored in attachment meta for Jetpack sites, but not on wpcom.
			if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
				$meta               = wp_get_attachment_metadata( $post_id );
				$should_update_meta = false;

				if ( ! $meta ) {
					return rest_ensure_response(
						new WP_Error(
							'error',
							__( 'Attachment meta was not found.', 'jetpack' )
						)
					);
				}

				if ( isset( $json_params['display_embed'] ) && isset( $meta['videopress']['display_embed'] ) ) {
					$meta['videopress']['display_embed'] = $json_params['display_embed'];
					$should_update_meta                  = true;
				}

				if ( isset( $json_params['rating'] ) && isset( $meta['videopress']['rating'] ) && videopress_is_valid_video_rating( $meta['videopress']['rating'] ) ) {
					$meta['videopress']['rating'] = $json_params['rating'];
					$should_update_meta           = true;
				}

				if ( $should_update_meta ) {
					wp_update_attachment_metadata( $post_id, $meta );
				}
			}

			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => __( 'Video meta updated successfully.', 'jetpack' ),
					'data'    => 200,
				)
			);
		} else {
			return rest_ensure_response(
				new WP_Error(
					$response_body->code,
					$response_body->message,
					$response_body->data
				)
			);
		}
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_VideoPress' );
