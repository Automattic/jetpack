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
	 * Fires on init
	 */
	public function on_init() {
		add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );

		add_filter( 'plupload_default_settings', array( $this, 'videopress_pluploder_config' ) );

		add_filter( 'videopress_shortcode_options', array( $this, 'videopress_shortcode_options' ) );
		add_filter( 'wp_get_attachment_url', array( $this, 'update_attachment_url_for_videopress' ), 10, 2 );

		add_action( 'admin_print_footer_scripts', array( $this, 'print_in_footer_open_media_add_new' ) );

		add_action( 'admin_menu', array( $this,'change_add_new_menu_location' ), 999 );

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
	 * Filters the VideoPress shortcode options, makes sure that
	 * the settings set in Jetpack's VideoPress module are applied.
	 */
	public function videopress_shortcode_options( $options ) {
		$videopress_options = VideoPress_Options::get_options();

		if ( false === $options['freedom'] ) {
			$options['freedom'] = $videopress_options['freedom'];
		}

		$options['hd'] = $videopress_options['hd'];

		return $options;
	}

	/**
	 * Register VideoPress admin scripts.
	 */
	public function enqueue_admin_scripts() {
		if ( did_action( 'videopress_enqueue_admin_scripts' ) ) {
			return;
		}

		if ( $this->should_override_media_uploader() ) {
			// We're going to replace the standard wp-plupload with our own ... messy, I know, but as of now the
			// hooks in it are not good enough for us to be able to override / add in just the code we need.
			// P.S. Please don't take this as an example of good behavior, this is a temporary fix until I
			// can get a more permanent action / filter system added into the core wp-plupload.js to make this
			// type of override unnecessary.
			wp_dequeue_script( 'wp-plupload' );

			wp_enqueue_script(
				'videopress-plupload',
				plugins_url( 'js/videopress-plupload.js', __FILE__ ),
				array(
					'jquery'
				),
				$this->version
			);

			wp_enqueue_script(
				'videopress-uploader',
				plugins_url( 'js/videopress-uploader.js', __FILE__ ),
				array(
					'videopress-plupload'
				),
				$this->version
			);
		}

		wp_enqueue_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), $this->version );

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

		if ( ! isset ( $_GET['action'] ) || $_GET['action'] !== 'add-new' ) {
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
	 * Changes the add new menu location, so that VideoPress will be enabled
	 * when a user clicks that button.
	 */
	public function change_add_new_menu_location() {
		$page = remove_submenu_page( 'upload.php', 'media-new.php' );

		add_submenu_page( 'upload.php', $page[0], $page[0], 'upload_files', 'upload.php?action=add-new');
	}
}

// Initialize the module.
Jetpack_VideoPress::init();
