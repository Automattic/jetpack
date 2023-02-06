<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * WPCOM Add Featured Media URL
 * Adds `jetpack_featured_media_url` to post responses
 *
 * @package automattic/jetpack
 */

/**
 * Add featured media url to API post responses.
 */
class WPCOM_REST_API_V2_Sites_Posts_Add_Featured_Media_URL {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'add_featured_media_url' ) );
	}

	/**
	 * Add featured media url to post responses.
	 */
	public function add_featured_media_url() {
		register_rest_field(
			'post',
			'jetpack_featured_media_url',
			array(
				'get_callback'    => array( $this, 'get_featured_media_url' ),
				'update_callback' => null,
				'schema'          => null,
			)
		);
	}

	/**
	 * Get featured media url.
	 *
	 * @param mixed           $object      What the endpoint returns.
	 * @param string          $field_name  Should always match `->field_name`.
	 * @param WP_REST_Request $request     WP API request.
	 */
	public function get_featured_media_url( $object, $field_name, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$featured_media_url = '';
		$image_attributes   = wp_get_attachment_image_src(
			get_post_thumbnail_id( $object['id'] ),
			'full'
		);
		if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) ) {
			$featured_media_url = (string) $image_attributes[0];
		}
		return $featured_media_url;
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Sites_Posts_Add_Featured_Media_URL' );
