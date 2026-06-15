<?php
/**
 * Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings;

/**
 * Class for setting up Social Image Generator-related functionality.
 */
class Setup {
	/**
	 * Initialise SIG-related functionality.
	 */
	public function init() {
		if ( ! ( new Settings() )->is_sig_available() ) {
			return;
		}

		// Be wary of any code that you add to this file, since this function is called on plugin load.
		// We're using the `wp_after_insert_post` hook because we need access to the updated post meta. By using the default priority
		// of 10 we make sure that our code runs before Sync processes the post.
		add_action( 'wp_after_insert_post', array( $this, 'generate_token_on_save' ), 10, 3 );
		add_action( 'jetpack_social_sig_warm_image', array( $this, 'warm_social_image' ) );
		add_action( 'rest_api_init', array( new REST_Token_Controller(), 'register_routes' ) );

		// Flagged to be removed after deprecation.
		// @deprecated 0.38.3
		add_action( 'rest_api_init', array( new REST_Settings_Controller(), 'register_routes' ) );
	}

	/**
	 * Get a token from WPCOM to generate the social image for the post, and save it locally.
	 *
	 * @param Post_Settings $post_settings A Post_Settings object that can be used to save the generated token.
	 */
	public function generate_token( $post_settings ) {
		if ( ! $post_settings->is_enabled() ) {
			return;
		}

		$token = fetch_token(
			$post_settings->get_custom_text(),
			$post_settings->get_image_url(),
			$post_settings->get_template(),
			$post_settings->get_font()
		);

		if ( is_wp_error( $token ) ) {
			return;
		}

		$post_settings->update_setting( 'token', sanitize_text_field( $token ) );
	}

	/**
	 * Trigger token generation for a post if SIG is enabled.
	 *
	 * @param int      $post_id     Post ID.
	 * @param \WP_Post $post        The post object being saved.
	 * @param bool     $update      Whether this is an update to a post.
	 */
	public function generate_token_on_save( $post_id, $post, $update ) {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return;
		}

		// If we're not using the block editor for this post, do not continue.
		if ( ! use_block_editor_for_post( $post ) ) {
			return;
		}

		global $publicize;

		if ( ! $publicize->post_type_is_publicizeable( $post->post_type ) ) {
			return;
		}

		$settings = new Settings();

		if ( ! $settings->is_sig_available() ) {
			return;
		}

		if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post_id ) ) {
			return;
		}

		// Set SIG to be enabled by default for new posts if the toggle is on.
		$post_settings = new Post_Settings( $post_id );
		if (
			! $update &&
			'auto-draft' === $post->post_status &&
			! empty( $settings->get_settings()['socialImageGeneratorSettings']['enabled'] ) &&
			empty( $post_settings->get_settings( true ) ) &&
			'jetpack-social-note' !== $post->post_type
		) {
			$post_settings->update_setting( 'enabled', true );
			return;
		}

		if ( $post->post_status === 'auto-draft' ) {
			return;
		}

		if ( ! $post_settings->is_enabled() ) {
			return;
		}

		$this->generate_token( $post_settings );

		// Prime the Social Image Generator cache out-of-band right after publish.
		// SIG renders the preview image on the first request to its URL, so a post
		// shared immediately after publishing can race that cold render and end up
		// with no preview image (notably on X, which does not retry). Warming the
		// URL here means the image is already rendered and edge-cached before any
		// crawler fetches it. Scheduled rather than inline so it never delays the
		// publish request itself.
		if (
			'publish' === $post->post_status &&
			! wp_next_scheduled( 'jetpack_social_sig_warm_image', array( $post_id ) )
		) {
			wp_schedule_single_event( time(), 'jetpack_social_sig_warm_image', array( $post_id ) );
		}
	}

	/**
	 * Warm the edge cache for a post's generated social image.
	 *
	 * Runs from a scheduled single event (see generate_token_on_save) so it never
	 * blocks the publish request. Issues one blocking request to the same URL the
	 * Open Graph tags expose, which forces the on-demand render and lets the full
	 * response populate the edge cache before a crawler fetches it.
	 *
	 * @param int $post_id Post ID whose social image should be primed.
	 */
	public function warm_social_image( $post_id ) {
		$post_settings = new Post_Settings( $post_id );

		if ( ! $post_settings->is_enabled() ) {
			return;
		}

		$image_url = get_image_url( $post_id );

		if ( empty( $image_url ) ) {
			return;
		}

		// Blocking so the rendered response travels back through the edge cache and
		// is stored; redirection is followed to the final image URL the crawler hits.
		wp_remote_get(
			$image_url,
			array(
				'timeout'     => 15,
				'redirection' => 5,
				'blocking'    => true,
				'user-agent'  => 'WordPress.com Social Image Generator cache warmer',
			)
		);
	}
}
