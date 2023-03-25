<?php
/**
 * Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

/**
 * Class for setting up Social Image Generator-related functionality.
 */
class Setup {
	/**
	 * Initialise SIG-related functionality.
	 */
	public function init() {
		// Be wary of any code that you add to this file, since this function is called on plugin load.
		// We're using the `wp_after_insert_post` hook because we need access to the updated post meta. By using the default priority
		// of 10 we make sure that our code runs before Sync processes the post.
		add_action( 'wp_after_insert_post', array( $this, 'set_meta' ), 10, 2 );
	}

	/**
	 * Get a token from WPCOM to generate the social image for the post, and save it locally.
	 *
	 * @param int $post_id Post ID.
	 */
	public function generate_token( $post_id ) {
		$post_settings = new Post_Settings( $post_id );

		if ( ! $post_settings->is_enabled() ) {
			return;
		}

		$token = fetch_token(
			$post_settings->get_custom_text(),
			$post_settings->get_image_url(),
			$post_settings->get_template()
		);

		if ( is_wp_error( $token ) ) {
			return;
		}

		$post_settings->update_setting( 'token', sanitize_text_field( $token ) );
	}

	/**
	 * Explicitly enable or disable SIG for a post. If it's enabled, also generate a token.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post Post that's being updated.
	 */
	public function set_meta( $post_id, $post ) {
		global $publicize;

		if ( ! $publicize->has_social_image_generator_feature() ) {
			return;
		}

		if ( wp_is_post_autosave( $post ) || $post->post_status === 'auto-draft' ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$post_settings = new Post_Settings( $post_id );
		$settings      = $post_settings->get_settings();

		// If SIG has explicitly been disabled for this post, we don't need to do anything else.
		if ( isset( $settings['enabled'] ) && $settings['enabled'] === false ) {
			return;
		}

		// If we're here, it's safe to assume SIG should be enabled.
		$post_settings->update_setting( 'enabled', true );

		$this->generate_token( $post_id );
	}
}
