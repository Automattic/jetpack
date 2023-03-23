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
		add_action( 'wp_after_insert_post', array( $this, 'generate_token_on_save' ), 10, 3 );
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
	 * Trigger token generation for a post if SIG is enabled.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post that's being updated.
	 * @param bool     $update  Whether this is an existing post being updated.
	 */
	public function generate_token_on_save( $post_id, $post, $update ) {
		// If we're not using the block editor for this post, do not continue.
		if ( ! use_block_editor_for_post( $post ) ) {
			return;
		}

		global $publicize;

		$post_settings = new Post_Settings( $post_id );
		$settings      = $post_settings->get_settings();

		// This is a new post. Set SIG to enabled if it wasn't set specifically.
		if ( ! $update && $publicize->post_type_is_publicizeable( $post->post_type ) && ! isset( $settings['enabled'] ) ) {
			$post_settings->update_setting( 'enabled', true );
		}

		if ( wp_is_post_autosave( $post ) || $post->post_status === 'auto-draft' ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		if ( ! $post_settings->is_enabled() ) {
			return;
		}

		$this->generate_token( $post_id );
	}
}
