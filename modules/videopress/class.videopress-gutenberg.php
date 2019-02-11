<?php
/**
 * Block Editor functionality for VideoPress users.
 *
 * @package Jetpack
 */

/**
 * Register a VideoPress extension to replace the default Core Video block.
 */
class VideoPress_Gutenberg {

	/**
	 * Initialize the VideoPress Gutenberg extension
	 */
	public static function init() {
		// Should not initialize if Gutenberg is not available or if Jetpack is not active.
		if (
			( function_exists( 'register_block_type' ) )
			&& (
				( method_exists( 'Jetpack', 'is_active' ) && Jetpack::is_active() )
				|| ( defined( 'IS_WPCOM' ) && IS_WPCOM )
			)
		) {
			add_action( 'init', array( __CLASS__, 'register_video_block_with_videopress' ) );
		}
	}

	/**
	 * Register the Jetpack Gutenberg extension that adds VideoPress support to the core video block.
	 */
	public static function register_video_block_with_videopress() {
		jetpack_register_block_type(
			'core/video',
			array(
				'render_callback' => array( __CLASS__, 'render_video_block_with_videopress' ),
			)
		);
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
		if ( ! isset( $attributes['id'] ) || isset( $attributes['guid'] ) ) {
			return $content;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		$post_id         = absint( $attributes['id'] );
		$videopress_id   = video_get_info_by_blogpostid( $blog_id, $post_id )->guid;
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
