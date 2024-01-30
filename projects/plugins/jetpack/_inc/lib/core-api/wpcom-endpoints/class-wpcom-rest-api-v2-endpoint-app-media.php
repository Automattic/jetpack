<?php
/**
 * REST API endpoint for the media uploaded by the Jetpack app.
 *
 * @package automattic/jetpack
 * @since 13.1
 */

/**
 * Media uploaded by the Jetpack app helper API.
 *
 * @since 13.1
 */
class WPCOM_REST_API_V2_Endpoint_App_Media extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'app-media';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for external media.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_media' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'number'      => array(
						'description'       => __( 'Number of media items in the request', 'jetpack' ),
						'type'              => 'number',
						'default'           => 20,
						'required'          => false,
						'sanitize_callback' => 'absint',

					),
					'page_handle' => array(
						'type'              => 'number',
						'required'          => false,
						'sanitize_callback' => 'absint',

					),
					'after'       => array(
						'description'       => __( 'Timestamp since the media was uploaded', 'jetpack' ),
						'type'              => 'number',
						'default'           => 0,
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Checks if a given request has access to external media libraries.
	 */
	public function permission_callback() {
		return current_user_can( 'upload_files' );
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
	public function get_media( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$number = $params['number'];

		$query_args  = array(
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'number'      => $number,
			'date_query'  => array(
				'after' => gmdate( DATE_RSS, intval( $params['after'] ) ),
			),
			'paged'       => $params['page_handle'],
			'author'      => get_current_user_id(),
			'orderby'     => 'date',
		);
		$media_query = new WP_Query( $query_args );
		$response    = $this->format_response( $media_query );

		wp_reset_postdata();
		return $response;
	}
	/**
	 * Formats api the response.
	 *
	 * @param \WP_Query $media_query Media query.
	 */
	private function format_response( $media_query ) {
		$response          = array();
		$response['media'] = array();
		while ( $media_query->have_posts() ) {
			$media_query->the_post();
			$response['media'][] = $this->format_item( $media_query->post );
		}
		$response['found'] = $media_query->found_posts;
		$response['meta']  = array( 'next_page' => $media_query->paged + 1 );
		return $response;
	}
	/**
	 * Formats a single item.
	 *
	 * @param \WP_Post $item Media item.
	 */
	private function format_item( $item ) {
		return array(
			'ID'         => $item->ID,
			'url'        => get_permalink( $item ),
			'date'       => get_date_from_gmt( $item->post_date_gmt ),
			'name'       => get_the_title( $item ),
			'file'       => basename( wp_get_attachment_image_url( $item->ID, 'full' ) ),
			'title'      => get_the_title( $item ),
			'guid'       => get_the_guid( $item ),
			'type'       => get_post_mime_type( $item ),
			'caption'    => '',
			'thumbnails' => array(
				'thumbnail' => wp_get_attachment_image_url( $item->ID, 'thumbnail' ),
				'large'     => wp_get_attachment_image_url( $item->ID, 'full' ),
			),
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_App_Media' );
