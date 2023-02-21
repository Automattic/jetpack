<?php
/**
 * Social_Image_Generator class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;

/**
 * Class for Social Image Generator-related functionality.
 */
class Social_Image_Generator {
	/**
	 * Initialise SIG-related functionality.
	 */
	public function init() {
		add_action( 'save_post', array( $this, 'generate_token' ) );
	}

	/**
	 * Get the SIG settings for a post.
	 *
	 * @param int $post_id ID of the post to get settings for.
	 * @return ?string
	 */
	public function get_post_settings( $post_id ) {
		$social_options = get_post_meta( $post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

		if ( empty( $social_options ) || empty( $social_options['image_generator_settings'] ) ) {
			return array();
		}

		return $social_options['image_generator_settings'];
	}

	/**
	 * Get the text to use for the generated image.
	 *
	 * @param int $post_id ID of the post to get the text for.
	 * @return string
	 */
	public function get_generated_image_text( $post_id ) {
		$settings = $this->get_post_settings( $post_id );

		if ( ! empty( $settings['custom_text'] ) ) {
			return $settings['custom_text'];
		}

		return get_the_title( $post_id );
	}

	/**
	 * Get the background image to use for the generated image.
	 *
	 * @param int $post_id ID of the post to get the image for.
	 * @return ?string
	 */
	public function get_generated_image_background_image_url( $post_id ) {
		$settings = $this->get_post_settings( $post_id );

		if ( empty( $settings['image_id'] ) ) {
			return null;
		}

		$image = wp_get_attachment_image_url( $settings['image_id'] );

		return ! empty( $image ) ? $image : null;
	}

	/**
	 * Get an image token for a post.
	 *
	 * @param int $post_id Post to get the token for.
	 * @return ?string
	 */
	public function get_token( $post_id ) {
		$settings = $this->get_post_settings( $post_id );

		return ! empty( $settings['token'] ) ? $settings['token'] : null;
	}

	/**
	 * Set an image token for a post.
	 *
	 * @param string $token The image token for the post.
	 * @param int    $post_id Post to update the meta for.
	 */
	public function set_token( $token, $post_id ) {
		$social_options = get_post_meta( $post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

		if ( empty( $social_options ) ) {
			$social_options = array();
		}

		$updated_options = array_merge_recursive( $social_options, array( 'image_generator_settings' => array( 'token' => sanitize_text_field( $token ) ) ) );

		update_post_meta( $post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, $updated_options );
	}

	/**
	 * Get the image url for a post.
	 *
	 * @param int $post_id The post to get the URL for.
	 * @return ?string
	 */
	public function get_image_url( $post_id ) {
		$token = $this->get_token( $post_id );

		if ( empty( $token ) ) {
			return null;
		}

		// TODO: update URL
		return 'https://example.com/' . $token;
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

		$settings = $this->get_post_settings( $post_id );

		if ( empty( $settings['enabled'] ) ) {
			return;
		}

		$body = array(
			'text' => $this->get_generated_image_text( $post_id ),
		);

		$url = $this->get_generated_image_background_image_url( $post_id );

		if ( ! empty( $url ) ) {
			$body['image_url'] = $url;
		}

		$rest_controller = new REST_Controller();
		$response        = Client::wpcom_json_api_request_as_blog(
			sprintf( 'sites/%d/jetpack-social/generate-image-token', absint( \Jetpack_Options::get_option( 'id' ) ) ),
			'2',
			array(
				'headers' => array( 'content-type' => 'application/json' ),
				'method'  => 'POST',
			),
			wp_json_encode( $body ),
			'wpcom'
		);
		$token           = $rest_controller->make_proper_response( $response );

		if ( is_wp_error( $token ) ) {
			return;
		}

		$this->set_token( $token, $post_id );
	}
}
