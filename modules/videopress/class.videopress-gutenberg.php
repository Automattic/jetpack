<?php

class VideoPress_Gutenberg {

	/**
	 * Initialize the VideoPress Gutenberg extension
	 */
	public static function init() {
		if ( self::should_initialize() ) {
			add_action( 'init', array( __CLASS__, 'register_video_block_with_videopress' ) );
		}
	}

	/**
	 * Check whether conditions indicate the VideoPress Gutenberg extension should be initialized
	 *
	 * @return bool
	 */
	public static function should_initialize() {
		// Should not initialize if Gutenberg is not available
		if ( ! function_exists( 'register_block_type' ) ) {
			return false;
		}

		// Should initialize if this is a WP.com site
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		// Should not initialize if this is a Jetpack site but Jetpack is not active (unless the dev mode is enabled)
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			return false;
		}

		// Should initialize by default
		return true;
	}

	/**
	 * Register the Jetpack Gutenberg extension that adds VideoPress support to the core video block.
	 */
	public static function register_video_block_with_videopress() {
		// We intentionally don't use `jetpack_register_block` because the current Jetpack extensions
		// registration doesn't fit our needs. Right now, any extension registered with `jetpack_register_block`
		// needs to have a name that is equal to the name of the registered block (our extension name would be
		// "videopress" and the name of the block we need to register "core/video").
		register_block_type( 'core/video', array(
			'render_callback' => array( __CLASS__, 'render_video_block_with_videopress' ),
		) );
	}

	/**
	 * Render the core video block replacing the src attribute with the VideoPress URL
	 *
	 * @param array  $attributes Array containing the video block attributes.
	 * @param string $content    String containing the video block content.
	 *
	 * @return string
	 */
	public static function render_video_block_with_videopress( $attributes, $content ) {
		if ( ! isset( $attributes['id'] ) ) {
			return $content;
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		$post_id = absint( $attributes['id'] );
		$videopress_id = video_get_info_by_blogpostid( $blog_id, $post_id )->guid;
		$videopress_data = videopress_get_video_details( $videopress_id );

		if ( empty( $videopress_data->file_url_base->https ) || empty( $videopress_data->files->hd->mp4 ) ) {
			return $content;
		}

		$videopress_url = $videopress_data->file_url_base->https . $videopress_data->files->hd->mp4;

		$pattern = '/(\s)src=([\'"])(?:(?!\2).)+?\2/';

		return preg_replace(
			$pattern,
			sprintf(
				'\1src="%1$s"',
				esc_url_raw( $videopress_url )
			),
			$content,
			1
		);
	}
}

VideoPress_Gutenberg::init();
