<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\Options as VideoPress_Options;
use Automattic\Jetpack\VideoPress\XMLRPC;

/**
 * VideoPress in Jetpack
 */
class Jetpack_VideoPress {
	/**
	 * Module name.
	 *
	 * @var string
	 */
	public $module = 'videopress';

	/**
	 * Version number used for cache busting.
	 *
	 * @var string
	 */
	const VERSION = '6';

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
		add_action( 'init', array( $this, 'on_init' ) );
		add_action( 'jetpack_deactivate_module_videopress', array( $this, 'jetpack_module_deactivated' ) );
		VideoPress_Initializer::init();
	}

	/**
	 * Fires on init
	 */
	public function on_init() {
		add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );
		add_filter( 'plupload_default_settings', array( $this, 'videopress_pluploder_config' ) );
		add_filter( 'wp_get_attachment_url', array( $this, 'maybe_get_attached_url_for_videopress' ), 10, 2 );
		add_filter( 'get_attached_file', array( $this, 'maybe_get_attached_url_for_videopress' ), 10, 2 );

		if ( Jetpack_Plan::supports( 'videopress' ) ) {
			add_filter( 'upload_mimes', array( $this, 'add_video_upload_mimes' ), 999 );
		}

		add_action( 'admin_print_footer_scripts', array( $this, 'print_in_footer_open_media_add_new' ) );
		add_action( 'admin_head', array( $this, 'enqueue_admin_styles' ) );

		add_filter( 'pre_delete_attachment', array( $this, 'delete_video_wpcom' ), 10, 2 );
		add_filter( 'wp_mime_type_icon', array( $this, 'wp_mime_type_icon' ), 10, 3 );
		add_filter( 'wp_video_extensions', array( $this, 'add_videopress_extenstion' ) );

		VideoPress_Scheduler::init();
		XMLRPC::init();

		if ( $this->is_videopress_enabled() ) {
			add_action( 'admin_notices', array( $this, 'media_new_page_admin_notice' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_jwt_token_bridge' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_jwt_token_bridge' ), 1 );
		}
	}

	/**
	 * Enqueues the jwt bridge script.
	 */
	public function enqueue_jwt_token_bridge() {
		global $post;
		$post_id = isset( $post->ID ) ? absint( $post->ID ) : 0;

		$bridge_url = Assets::get_file_url_for_environment(
			'modules/videopress/js/videopress-token-bridge.js',
			'modules/videopress/js/videopress-token-bridge.js'
		);

		wp_enqueue_script(
			'media-video-jwt-bridge',
			$bridge_url,
			array(),
			self::VERSION,
			false
		);

		wp_localize_script(
			'media-video-jwt-bridge',
			'videopressAjax',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'bridgeUrl' => $bridge_url,
				'post_id'   => $post_id,
			)
		);
	}

	/**
	 * The media-new.php page isn't supported for uploading to VideoPress.
	 *
	 * There is either a technical reason for this (bulk uploader isn't overridable),
	 * or it is an intentional way to give site owners an option for uploading videos that bypass VideoPress.
	 */
	public function media_new_page_admin_notice() {
		global $pagenow;

		if ( 'media-new.php' === $pagenow ) {
			echo '<div class="notice notice-warning is-dismissible">' .
					'<p>' .
					wp_kses(
						sprintf(
							/* translators: %s is the url to the Media Library */
							__( 'VideoPress uploads are not supported here. To upload to VideoPress, add your videos from the <a href="%s">Media Library</a> or the block editor using the Video block.', 'jetpack' ),
							esc_url( admin_url( 'upload.php' ) )
						),
						array(
							'a' => array( 'href' => array() ),
						)
					) .
					'</p>' .
				'</div>';
		}
	}

	/**
	 * Runs when the VideoPress module is deactivated.
	 */
	public function jetpack_module_deactivated() {
		VideoPress_Options::delete_options();
	}

	/**
	 * Similar to current_user_can, but internal to VideoPress.
	 *
	 * @param string $cap Capability name.
	 * @param int    $user_id User ID.
	 * @return bool Returns true if the given VideoPress capability is allowed by the given user.
	 */
	public function can( $cap, $user_id = false ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		// Connection owners are allowed to do all the things.
		if ( Jetpack::connection()->is_connection_owner( $user_id ) ) {
			return true;
		}

		// Additional and internal caps checks
		if ( ! user_can( $user_id, 'upload_files' ) ) {
			return false;
		}

		if ( 'edit_videos' === $cap && ! user_can( $user_id, 'edit_others_posts' ) ) {
			return false;
		}

		if ( 'delete_videos' === $cap && ! user_can( $user_id, 'delete_others_posts' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Register and enqueue VideoPress admin styles.
	 */
	public function enqueue_admin_styles() {
		wp_register_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), self::VERSION );
		wp_enqueue_style( 'videopress-admin' );
	}

	/**
	 * Attempts to delete a VideoPress video from wp.com.
	 * Will block the deletion from continuing if certain errors return from the wp.com API.
	 *
	 * @param Boolean $delete if the deletion should occur or not (unused).
	 * @param WP_Post $post the post object.
	 *
	 * @return null|WP_Error|Boolean null if deletion should continue.
	 */
	public function delete_video_wpcom( $delete, $post ) {
		if ( ! is_videopress_attachment( $post->ID ) ) {
			return null;
		}

		$guid = get_post_meta( $post->ID, 'videopress_guid', true );
		if ( empty( $guid ) ) {
			$this->delete_video_poster_attachment( $post->ID );
			return null;
		}

		// Phone home and have wp.com delete the VideoPress entry and files.
		$wpcom_response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/videos/%s/delete', $guid ),
			'1.1',
			array( 'method' => 'POST' )
		);

		if ( is_wp_error( $wpcom_response ) ) {
			return $wpcom_response;
		}

		// Upon success or a 404 (video already deleted on wp.com), return null to allow the deletion to continue.
		if ( 200 === $wpcom_response['response']['code'] || 404 === $wpcom_response['response']['code'] ) {
			$this->delete_video_poster_attachment( $post->ID );
			return null;
		}

		// Otherwise we stop the deletion from proceeding.
		return false;
	}

	/**
	 * Deletes a video poster attachment if it exists.
	 *
	 * @param int $attachment_id the WP attachment id.
	 */
	private function delete_video_poster_attachment( $attachment_id ) {
		$thumbnail_id = get_post_meta( $attachment_id, '_thumbnail_id', true );
		if ( ! empty( $thumbnail_id ) ) {
			// Let's ensure this is a VP poster image before we delete it.
			if ( '1' === get_post_meta( $thumbnail_id, 'videopress_poster_image', true ) ) {
				// This call triggers the `delete_video_wpcom` filter again but it bails early at the is_videopress_attachment() check.
				wp_delete_attachment( $thumbnail_id );
			}
		}
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
				self::VERSION,
				true
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
				self::VERSION,
				true
			);

			wp_enqueue_script(
				'media-video-widget-extensions',
				Assets::get_file_url_for_environment(
					'_inc/build/videopress/js/media-video-widget-extensions.min.js',
					'modules/videopress/js/media-video-widget-extensions.js'
				),
				array(),
				self::VERSION,
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
	 * Returns the VideoPress URL for the give post id, otherwise returns the provided default.
	 *
	 * This is an attachment-based filter handler.
	 *
	 * @param string $default The default return value if post id is not a VideoPress video.
	 * @param int    $post_id The post id for the current attachment.
	 */
	public function maybe_get_attached_url_for_videopress( $default, $post_id ) {
		$videopress_url = videopress_get_attachment_url( $post_id );

		if ( null !== $videopress_url ) {
			return $videopress_url;
		}

		return $default;
	}

	/**
	 * Modify the default plupload config to turn on VideoPress specific filters.
	 *
	 * @param array $config The plupload config.
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
		if ( ! in_array( $pagenow, $acceptable_pages, true ) ) {
			return false;
		}

		return $this->is_videopress_enabled();
	}

	/**
	 * Detects if VideoPress is enabled.
	 *
	 * @return bool
	 */
	protected function is_videopress_enabled() {
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

		if ( ! isset( $_GET['action'] ) || $_GET['action'] !== 'add-new' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
	 * @param array $existing_mimes Mime types to extend/filter.
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
	 * @param string $value Mime type to filter.
	 * @return int
	 */
	public function filter_video_mimes( $value ) {
		return preg_match( '@^video/@', $value );
	}

	/**
	 * Filter the mime type icon.
	 *
	 * @param string $icon Icon path.
	 * @param string $mime Mime type.
	 * @param int    $post_id Post ID.
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
	 * Filter the list of supported video formats.
	 *
	 * @param array $extensions Supported video formats.
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
