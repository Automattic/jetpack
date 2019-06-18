<?php

use Automattic\Jetpack\Assets;

/**
 * VideoPress in Jetpack
 */
class Jetpack_VideoPress {
	/** @var string */
	public $module = 'videopress';

	/** @var int */
	public $version = 5;

	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_VideoPress();
		}

		return $instance;
	}

	/**
	 * Jetpack_VideoPress constructor.
	 *
	 * Sets up the initializer and makes sure that videopress activates and deactivates properly.
	 */
	private function __construct() {
		// $this->version = time(); // <s>ghost</s> cache busters!
		add_action( 'init', array( $this, 'on_init' ) );
		add_action( 'jetpack_deactivate_module_videopress', array( $this, 'jetpack_module_deactivated' ) );
	}

	/**
	 * Fires on init
	 */
	public function on_init() {
		add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );
		add_filter( 'plupload_default_settings', array( $this, 'videopress_pluploder_config' ) );
		add_filter( 'wp_get_attachment_url', array( $this, 'update_attachment_url_for_videopress' ), 10, 2 );

		if ( Jetpack_Plan::supports( 'videopress' ) ) {
			add_filter( 'upload_mimes', array( $this, 'add_video_upload_mimes' ), 999 );
		}

		add_action( 'admin_print_footer_scripts', array( $this, 'print_in_footer_open_media_add_new' ) );
		add_action( 'admin_head', array( $this, 'enqueue_admin_styles' ) );

		add_filter( 'wp_mime_type_icon', array( $this, 'wp_mime_type_icon' ), 10, 3 );

		add_filter( 'wp_video_extensions', array( $this, 'add_videopress_extenstion' ) );

		VideoPress_Scheduler::init();
		VideoPress_XMLRPC::init();
	}

	/**
	 * Runs when the VideoPress module is deactivated.
	 */
	public function jetpack_module_deactivated() {
		VideoPress_Options::delete_options();
	}

	/**
	 * A can of coke
	 *
	 * Similar to current_user_can, but internal to VideoPress. Returns
	 * true if the given VideoPress capability is allowed by the given user.
	 */
	public function can( $cap, $user_id = false ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		// Connection owners are allowed to do all the things.
		if ( $this->is_connection_owner( $user_id ) ) {
			return true;
		}

		// Additional and internal caps checks
		if ( ! user_can( $user_id, 'upload_files' ) ) {
			return false;
		}

		if ( 'edit_videos' == $cap && ! user_can( $user_id, 'edit_others_posts' ) ) {
			return false;
		}

		if ( 'delete_videos' == $cap && ! user_can( $user_id, 'delete_others_posts' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns true if the provided user is the Jetpack connection owner.
	 */
	public function is_connection_owner( $user_id = false ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$user_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );

		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && $user_id === $user_token->external_user_id;
	}

	/**
	 * Register and enqueue VideoPress admin styles.
	 */
	public function enqueue_admin_styles() {
		wp_register_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), $this->version );
		wp_enqueue_style( 'videopress-admin' );
	}

	/**
	 * Register VideoPress admin scripts.
	 */
	public function enqueue_admin_scripts() {
		if ( did_action( 'videopress_enqueue_admin_scripts' ) ) {
			return;
		}

		if ( $this->should_override_media_uploader() ) {
			wp_enqueue_script(
				'videopress-plupload',
				Assets::get_file_url_for_environment(
					'_inc/build/videopress/js/videopress-plupload.min.js',
					'modules/videopress/js/videopress-plupload.js'
				),
				array(
					'jquery',
					'wp-plupload',
				),
				$this->version
			);

			wp_enqueue_script(
				'videopress-uploader',
				Assets::get_file_url_for_environment(
					'_inc/build/videopress/js/videopress-uploader.min.js',
					'modules/videopress/js/videopress-uploader.js'
				),
				array(
					'videopress-plupload',
				),
				$this->version
			);

			wp_enqueue_script(
				'media-video-widget-extensions',
				Assets::get_file_url_for_environment(
					'_inc/build/videopress/js/media-video-widget-extensions.min.js',
					'modules/videopress/js/media-video-widget-extensions.js'
				),
				array(),
				$this->version,
				true
			);
		}

		/**
		 * Fires after VideoPress scripts are enqueued in the dashboard.
		 *
		 * @since 2.5.0
		 */
		do_action( 'videopress_enqueue_admin_scripts' );
	}

	/**
	 * An override for the attachment url, which returns back the WPCOM VideoPress processed url.
	 *
	 * This is an action proxy to the videopress_get_attachment_url() utility function.
	 *
	 * @param string $url
	 * @param int    $post_id
	 *
	 * @return string
	 */
	public function update_attachment_url_for_videopress( $url, $post_id ) {
		if ( $videopress_url = videopress_get_attachment_url( $post_id ) ) {
			return $videopress_url;
		}

		return $url;
	}

	/**
	 * Modify the default plupload config to turn on videopress specific filters.
	 */
	public function videopress_pluploder_config( $config ) {

		if ( ! isset( $config['filters']['max_file_size'] ) ) {
			$config['filters']['max_file_size'] = wp_max_upload_size() . 'b';
		}

		$config['filters']['videopress_check_uploads'] = $config['filters']['max_file_size'];

		// We're doing our own check in the videopress_check_uploads filter.
		unset( $config['filters']['max_file_size'] );

		return $config;
	}


	/**
	 * Helper function to determine if the media uploader should be overridden.
	 *
	 * The rules are simple, only try to load the script when on the edit post or new post pages.
	 *
	 * @return bool
	 */
	protected function should_override_media_uploader() {
		global $pagenow;

		// Only load in the admin
		if ( ! is_admin() ) {
			return false;
		}

		$acceptable_pages = array(
			'post-new.php',
			'post.php',
			'upload.php',
			'customize.php',
		);

		// Only load on the post, new post, or upload pages.
		if ( ! in_array( $pagenow, $acceptable_pages ) ) {
			return false;
		}

		$options = VideoPress_Options::get_options();

		return $options['shadow_blog_id'] > 0;
	}

	/**
	 * A work-around / hack to make it possible to go to the media library with the add new box open.
	 *
	 * @return bool
	 */
	public function print_in_footer_open_media_add_new() {
		global $pagenow;

		// Only load in the admin
		if ( ! is_admin() ) {
			return false;
		}

		if ( $pagenow !== 'upload.php' ) {
			return false;
		}

		if ( ! isset( $_GET['action'] ) || $_GET['action'] !== 'add-new' ) {
			return false;
		}

		?>
			<script type="text/javascript">
				( function( $ ) {
					window.setTimeout( function() {
						$('#wp-media-grid .page-title-action').click();
					}, 500 );

				}( jQuery ) );
			</script>
		<?php
	}

	/**
	 * Makes sure that all video mimes are added in, as multi site installs can remove them.
	 *
	 * @param array $existing_mimes
	 * @return array
	 */
	public function add_video_upload_mimes( $existing_mimes = array() ) {
		$mime_types  = wp_get_mime_types();
		$video_types = array_filter( $mime_types, array( $this, 'filter_video_mimes' ) );

		foreach ( $video_types as $key => $value ) {
			$existing_mimes[ $key ] = $value;
		}

		// Make sure that videopress mimes are considered videos.
		$existing_mimes['videopress'] = 'video/videopress';

		return $existing_mimes;
	}

	/**
	 * Filter designed to get rid of non video mime types.
	 *
	 * @param string $value
	 * @return int
	 */
	public function filter_video_mimes( $value ) {
		return preg_match( '@^video/@', $value );
	}

	/**
	 * @param string $icon
	 * @param string $mime
	 * @param int    $post_id
	 *
	 * @return string
	 */
	public function wp_mime_type_icon( $icon, $mime, $post_id ) {

		if ( $mime !== 'video/videopress' ) {
			return $icon;
		}

		$status = get_post_meta( $post_id, 'videopress_status', true );

		if ( $status === 'complete' ) {
			return $icon;
		}

		return 'https://wordpress.com/wp-content/mu-plugins/videopress/images/media-video-processing-icon.png';
	}

	/**
	 * @param array $extensions
	 *
	 * @return array
	 */
	public function add_videopress_extenstion( $extensions ) {
		$extensions[] = 'videopress';

		return $extensions;
	}
}

// Initialize the module.
Jetpack_VideoPress::init();
