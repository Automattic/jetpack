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
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new VideoPress_Gutenberg();
		}

		return $instance;
	}

	/**
	 * VideoPress_Gutenberg constructor.
	 *
	 * Initialize the VideoPress Gutenberg extension
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'set_extension_availability' ) );
		add_action( 'init', array( $this, 'register_video_block_with_videopress' ) );
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 */
	public function set_extension_availability() {
		// It is available on Simple Sites having the appropriate a plan.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( '1' === get_option( 'video_upgrade' ) ) {
				Jetpack_Gutenberg::set_extension_available( 'jetpack/videopress' );
			} else {
				Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/videopress', 'missing_plan' );
			}
			return;
		}

		// It is available on Jetpack Sites having the VideoPress module active.
		if ( method_exists( 'Jetpack', 'is_active' ) && Jetpack::is_active() ) {
			if ( Jetpack::is_module_active( 'videopress' ) ) {
				Jetpack_Gutenberg::set_extension_available( 'jetpack/videopress' );
			} elseif ( ! Jetpack::active_plan_supports( 'videopress' ) ) {
				Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/videopress', 'missing_plan' );
			} else {
				Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/videopress', 'missing_module' );
			}
		}
	}

	/**
	 * Register the core video block as a dynamic block.
	 *
	 * It defines a server-side rendering that adds VideoPress support to the core video block.
	 */
	public function register_video_block_with_videopress() {
		// Early return if Gutenberg is not available.
		if ( function_exists( 'register_block_type' ) ) {
			return;
		}

		register_block_type(
			'core/video',
			array(
				'render_callback' => array( $this, 'render_video_block_with_videopress' ),
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
	public function render_video_block_with_videopress( $attributes, $content ) {
		if ( ! isset( $attributes['id'] ) || isset( $attributes['guid'] ) ) {
			return $content;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} elseif ( method_exists( 'Jetpack', 'is_active' ) && Jetpack::is_active() ) {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		if ( ! isset( $blog_id ) ) {
			return $content;
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
