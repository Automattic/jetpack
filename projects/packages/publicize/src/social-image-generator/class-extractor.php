<?php
/**
 * Extractor class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

use Automattic\Jetpack\Publicize\Publicize;

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
	 * The post's settings.
	 *
	 * @var array $settings;
	 */
	public $settings;

	/**
	 * Constructor.
	 *
	 * @param int $post_id Post to get information from.
	 */
	public function __construct( $post_id ) {
		$this->post_id  = $post_id;
		$this->settings = $this->get_post_settings();
	}

	/**
	 * Get the SIG settings for a post.
	 *
	 * @return array
	 */
	private function get_post_settings() {
		$social_options = get_post_meta( $this->post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

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
		return ! empty( $this->settings['enabled'] );
	}

	/**
	 * Get the text to use for the generated image.
	 *
	 * @return string
	 */
	public function get_generated_image_text() {
		if ( ! empty( $this->settings['custom_text'] ) ) {
			return $this->settings['custom_text'];
		}

		return get_the_title( $this->post_id );
	}

	/**
	 * Get the background image to use for the generated image.
	 *
	 * @return string
	 */
	public function get_generated_image_background_image_url() {
		if ( empty( $this->settings['image_id'] ) ) {
			return '';
		}

		$image = wp_get_attachment_image_url( $this->settings['image_id'] );

		return $image ? $image : '';
	}

	/**
	 * Get an image token.
	 *
	 * @return string
	 */
	public function get_token() {
		return ! empty( $this->settings['token'] ) ? $this->settings['token'] : '';
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
