<?php
/**
 * Extractor class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

/**
 * Class for extracting SIG-related settings for a post.
 */
class Extractor {
	/**
	 * Post to get information from.
	 *
	 * @var int $post_id
	 */
	public $post_id;

	/**
	 * Constructor.
	 *
	 * @param int $post_id Post to get information from.
	 */
	public function __construct( $post_id ) {
		$this->post_id = $post_id;
	}

	/**
	 * Get the SIG settings for a post.
	 *
	 * @return array
	 */
	private function get_post_settings() {
		$social_options = get_post_meta( $this->post_id, \Automattic\Jetpack\Publicize\Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

		if ( ! is_array( $social_options ) || empty( $social_options['image_generator_settings'] ) ) {
			return array();
		}

		return $social_options['image_generator_settings'];
	}

	/**
	 * Check if SIG is enabled for a specific post.
	 *
	 * @return bool
	 */
	public function is_enabled() {
		$settings = $this->get_post_settings();

		return ! empty( $settings['is_enabled'] );
	}

	/**
	 * Get the text to use for the generated image.
	 *
	 * @return string
	 */
	public function get_generated_image_text() {
		$settings = $this->get_post_settings();

		if ( ! empty( $settings['custom_text'] ) ) {
			return $settings['custom_text'];
		}

		return get_the_title( $this->post_id );
	}

	/**
	 * Get the background image to use for the generated image.
	 *
	 * @return string
	 */
	public function get_generated_image_background_image_url() {
		$settings = $this->get_post_settings();

		if ( empty( $settings['image_id'] ) ) {
			return '';
		}

		$image = wp_get_attachment_image_url( $settings['image_id'] );

		return $image ? $image : '';
	}

	/**
	 * Get an image token.
	 *
	 * @return string
	 */
	public function get_token() {
		$settings = $this->get_post_settings();

		return ! empty( $settings['token'] ) ? $settings['token'] : '';
	}

	/**
	 * Get the image url for a post.
	 *
	 * @return string
	 */
	public function get_image_url() {
		$token = $this->get_token();

		if ( empty( $token ) ) {
			return '';
		}

		// TODO: update URL
		return 'https://example.com/' . $token;
	}
}
