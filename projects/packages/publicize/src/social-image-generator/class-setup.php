<?php
/**
 * Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

use Automattic\Jetpack\Connection\Client;

/**
 * Class for setting up Social Image Generator-related functionality.
 */
class Setup {
	/**
	 * Initialise SIG-related functionality.
	 */
	public function init() {
		add_action( 'save_post', array( $this, 'generate_token' ) );
	}

	/**
	 * Set an image token.
	 *
	 * @param int    $post_id The post ID to set the token for.
	 * @param string $token The image token for the post.
	 */
	public function set_token( $post_id, $token ) {
		$social_options = get_post_meta( $post_id, \Automattic\Jetpack\Publicize\Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

		if ( empty( $social_options ) ) {
			$social_options = array();
		}

		$updated_options = array_merge_recursive( $social_options, array( 'image_generator_settings' => array( 'token' => sanitize_text_field( $token ) ) ) );

		update_post_meta( $post_id, \Automattic\Jetpack\Publicize\Publicize::POST_JETPACK_SOCIAL_OPTIONS, $updated_options );
	}

	/**
	 * Get a token from WPCOM to generate the social image for the post, and save it locally.
	 *
	 * @param int $post_id Post ID.
	 */
	public function generate_token( $post_id ) {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$extractor = new Extractor( $post_id );

		if ( ! $extractor->is_enabled() ) {
			return;
		}

		$body = array(
			'text'      => $extractor->get_generated_image_text(),
			'image_url' => $extractor->get_generated_image_background_image_url(),
		);

		$rest_controller = new \Automattic\Jetpack\Publicize\REST_Controller();
		$response        = Client::wpcom_json_api_request_as_blog(
			sprintf( 'sites/%d/jetpack-social/generate-image-token', absint( \Jetpack_Options::get_option( 'id' ) ) ),
			'2',
			array(
				'headers' => array( 'content-type' => 'application/json' ),
				'method'  => 'POST',
			),
			wp_json_encode( array_filter( $body ) ),
			'wpcom'
		);
		$token           = $rest_controller->make_proper_response( $response );

		if ( is_wp_error( $token ) ) {
			return;
		}

		$this->set_token( $post_id, $token );
	}
}
