<?php

/**
 * VideoPress in Jetpack
 *
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
			$instance = new Jetpack_VideoPress;
		}

		return $instance;
	}

	/**
	 * Jetpack_VideoPress constructor.
	 *
	 * Sets up the initializer and makes sure that videopress activates and deactivates properly.
	 */
	private function __construct() {
		//$this->version = time(); // <s>ghost</s> cache busters!
		add_action( 'init', array( $this, 'on_init' ) );
		add_action( 'jetpack_deactivate_module_videopress', array( $this, 'jetpack_module_deactivated' ) );
	}

	/**
	 * Fires on init since is_connection_owner should wait until the user is initialized by $wp->init();
	 */
	public function on_init() {
		add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );
		add_filter( 'plupload_default_settings', array( $this, 'videopress_pluploder_config' ) );
		add_filter( 'wp_get_attachment_url', array( $this, 'update_attachment_url_for_videopress' ), 10, 2 );

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
	 * Register VideoPress admin scripts.
	 */
	public function enqueue_admin_scripts() {
		if ( did_action( 'videopress_enqueue_admin_scripts' ) ) {
			return;
		}

		if ( $this->should_override_media_uploader() ) {
			wp_enqueue_script( 'videopress-uploader', plugins_url( 'js/videopress-uploader.js', __FILE__ ), array(
				'jquery',
				'wp-plupload'
			), $this->version );
		}

		wp_enqueue_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), $this->version );

		$caps = array();
		foreach ( array( 'edit_videos', 'delete_videos' ) as $cap ) {
			$caps[ $cap ] = $this->can( $cap );
		}

		// Leaving these as we may need to encorporate them somewhere else
		$l10n = array(
			'selectVideoFile'         => __( 'Please select a video file to upload.', 'jetpack' ),
			'videoUploading'          => __( 'Your video is uploading... Please do not close this window.', 'jetpack' ),
			'unknownError'            => __( 'An unknown error has occurred. Please try again later.', 'jetpack' ),
			'videoUploaded'           => __( 'Your video has successfully been uploaded. It will appear in your VideoPress Library shortly.', 'jetpack' ),
			'VideoPressLibraryRouter' => __( 'VideoPress Library', 'jetpack' ),
			'uploadVideoRouter'       => __( 'Upload a Video', 'jetpack' ),
			'insertVideoButton'       => __( 'Insert Video', 'jetpack' ),
		);

		/**
		 * Fires after VideoPress scripts are enqueued in the dashboard.
		 *
		 * @since 2.5.0
		 */
		do_action( 'videopress_enqueue_admin_scripts' );
	}

	/**
	 * An override for the attachment url, which returns back the WPCOM videopress original url,
	 * if it is set to the the objects metadata. this allows us to show the original uploaded
	 * file on the WPCOM architecture, instead of the locally uplodaded file,
	 * which doeasn't exist.
	 *
	 * @param string $url
	 * @param int $post_id
	 *
	 * @return mixed
	 */
	public function update_attachment_url_for_videopress( $url, $post_id ) {

		if ( get_post_mime_type( $post_id ) === 'video/videopress' ) {
			$meta = wp_get_attachment_metadata( $post_id );

			if ( isset( $meta['original']['url'] ) ) {
				$url = $meta['original']['url'];
			}
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

		// Only load on the post, new post, or upload pages.
		if ( $pagenow !== 'post-new.php' && $pagenow !== 'post.php' && $pagenow !== 'upload.php' ) {
			return false;
		}

		$options = VideoPress_Options::get_options();

		return $options['shadow_blog_id'] > 0;
	}

}

// Initialize the module.
Jetpack_VideoPress::init();
