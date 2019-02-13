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
		add_action( 'init', array( $this, 'register_video_block_with_videopress' ) );
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'set_extension_availability' ) );
	}

	/**
	 * Used to check whether VideoPress is enabled for given site.
	 *
	 * @todo Create a global `jetpack_check_module_availability( $module )` helper so we can re-use it on other modules.
	 *       This global helper should be created in a file synced with WordPress.com so we can use it there too.
	 * @see https://github.com/Automattic/jetpack/pull/11321#discussion_r255477815
	 *
	 * @return array Associative array indicating if the module is available (key `available`) and the reason why it is
	 * unavailable (key `unavailable_reason`)
	 */
	public function check_videopress_availability() {
		// It is available on Simple Sites having the appropriate a plan.
		if (
			defined( 'IS_WPCOM' ) && IS_WPCOM
			&& method_exists( 'Store_Product_List', 'get_site_specific_features_data' )
		) {
			$features = Store_Product_List::get_site_specific_features_data();
			if ( in_array( 'videopress', $features['active'], true ) ) {
				return array( 'available' => true );
			} else {
				return array(
					'available'          => false,
					'unavailable_reason' => 'missing_plan',
				);
			}
		}

		// It is available on Jetpack Sites having the module active.
		if (
			method_exists( 'Jetpack', 'is_active' ) && Jetpack::is_active()
			&& method_exists( 'Jetpack', 'is_module_active' )
			&& method_exists( 'Jetpack', 'active_plan_supports' )
		) {
			if ( Jetpack::is_module_active( 'videopress' ) ) {
				return array( 'available' => true );
			} elseif ( ! Jetpack::active_plan_supports( 'videopress' ) ) {
				return array(
					'available'          => false,
					'unavailable_reason' => 'missing_plan',
				);
			} else {
				return array(
					'available'          => false,
					'unavailable_reason' => 'missing_module',
				);
			}
		}

		return array(
			'available'          => false,
			'unavailable_reason' => 'unknown',
		);
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 */
	public function set_extension_availability() {
		$availability = $this->check_videopress_availability();
		if ( $availability['available'] ) {
			Jetpack_Gutenberg::set_extension_available( 'jetpack/videopress' );
		} else {
			Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/videopress', $availability['unavailable_reason'] );
		}
	}

	/**
	 * Register the core video block as a dynamic block.
	 *
	 * It defines a server-side rendering that adds VideoPress support to the core video block.
	 */
	public function register_video_block_with_videopress() {
		jetpack_register_block_type(
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
			/**
			 * We're intentionally not using `get_current_blog_id` because it was returning unexpected values.
			 *
			 * @see https://github.com/Automattic/jetpack/pull/11193#issuecomment-457883886
			 * @see https://github.com/Automattic/jetpack/pull/11193/commits/215cf789f3d8bd03ff9eb1bbdb693acb8831d273
			 */
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
