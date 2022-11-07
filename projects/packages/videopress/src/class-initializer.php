<?php
/**
 * The initializer class for the videopress package
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Initialized the VideoPress package
 */
class Initializer {

	/**
	 * Initialization optinos
	 *
	 * @var array
	 */
	protected static $init_options = array();

	/**
	 * Initializes the VideoPress package
	 *
	 * This method is called by Config::ensure.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! did_action( 'videopress_init' ) ) {

			self::unconditional_initialization();

			if ( Status::is_active() ) {
				self::active_initialization();
			}
		}

		/**
		 * Fires after the VideoPress package is initialized
		 *
		 * @since 0.1.1
		 */
		do_action( 'videopress_init' );
	}

	/**
	 * Update the initialization options
	 *
	 * This method is called by the Config class
	 *
	 * @param array $options The initialization options.
	 * @return void
	 */
	public static function update_init_options( array $options ) {
		if ( empty( $options['admin_ui'] ) || self::should_initialize_admin_ui() ) { // do not overwrite if already set to true.
			return;
		}

		self::$init_options['admin_ui'] = $options['admin_ui'];
	}

	/**
	 * Checks the initialization options and returns whether the admin_ui should be initialized or not
	 *
	 * @return boolean
	 */
	public static function should_initialize_admin_ui() {
		return isset( self::$init_options['admin_ui'] ) && true === self::$init_options['admin_ui'];
	}

	/**
	 * Initialize VideoPress features that should be initialized whenever VideoPress is present, even if the module is not active
	 *
	 * @return void
	 */
	private static function unconditional_initialization() {
		if ( self::should_include_utilities() ) {
			require_once __DIR__ . '/utility-functions.php';
		}

		// Set up package version hook.
		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package_Version::send_package_version_to_tracker' );

		Module_Control::init();

		new WPCOM_REST_API_V2_Endpoint_VideoPress();
		new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
		new WPCOM_REST_API_V2_Attachment_VideoPress_Data();

		if ( is_admin() ) {
			AJAX::init();
		}
	}

	/**
	 * This avoids conflicts when running VideoPress plugin with older versions of the Jetpack plugin
	 *
	 * On version 11.3-a.7 utility functions include were removed from the plugin and it is safe to include it from the package
	 *
	 * @return boolean
	 */
	private static function should_include_utilities() {
		if ( ! class_exists( 'Jetpack' ) || ! defined( 'JETPACK__VERSION' ) ) {
			return true;
		}

		return version_compare( JETPACK__VERSION, '11.3-a.7', '>=' );

	}

	/**
	 * Initialize VideoPress features that should be initialized only when the module is active
	 *
	 * @return void
	 */
	private static function active_initialization() {
		Attachment_Handler::init();
		Jwt_Token_Bridge::init();
		Uploader_Rest_Endpoints::init();
		VideoPress_Rest_Api_V1_Stats::init();
		VideoPress_Rest_Api_V1_Site::init();
		XMLRPC::init();
		Block_Editor_Extensions::init();
		self::register_oembed_providers();
		if ( self::should_initialize_admin_ui() ) {
			Admin_UI::init();
		}
	}

	/**
	 * Explicitly register VideoPress oembed provider for patterns not supported by core
	 *
	 * @return void
	 */
	public static function register_oembed_providers() {
		$host = rawurlencode( home_url() );
		// videopress.com/v is already registered in core.
		// By explicitly declaring the provider here, we can speed things up by not relying on oEmbed discovery.
		wp_oembed_add_provider( '#^https?://video.wordpress.com/v/.*#', 'https://public-api.wordpress.com/oembed/?for=' . $host, true );
		// This is needed as it's not supported in oEmbed discovery
		wp_oembed_add_provider( '|^https?://v\.wordpress\.com/([a-zA-Z\d]{8})(.+)?$|i', 'https://public-api.wordpress.com/oembed/?for=' . $host, true ); // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled

		add_filter( 'embed_oembed_html', array( __CLASS__, 'video_enqueue_bridge_when_oembed_present' ), 10, 4 );
	}

	/**
	 * Enqueues VideoPress token bridge when a VideoPress oembed is present on the current page.
	 *
	 * @param string|false $cache   The cached HTML result, stored in post meta.
	 * @param string       $url     The attempted embed URL.
	 * @param array        $attr    An array of shortcode attributes.
	 * @param int          $post_ID Post ID.
	 *
	 * @return string|false
	 */
	public static function video_enqueue_bridge_when_oembed_present( $cache, $url, $attr, $post_ID ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( preg_match( '/^https?:\/\/(video\.wordpress\.com|videopress\.com)\/(v|embed)\//', $url ) // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
			|| preg_match( '|^https?://v\.wordpress\.com/([a-zA-Z\d]{8})(.+)?$|i', $url ) ) { // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
			Jwt_Token_Bridge::enqueue_jwt_token_bridge();
		}
		return $cache;
	}

	/**
	 * Register all VideoPress blocks
	 *
	 * @return void
	 */
	public static function register_videopress_blocks() {
		// Register VideoPress Video block.
		self::register_videopress_video_block();
		// Register VideoPress Video block.
		self::register_videopress_chapters_block();
	}

	/**
	 * Register the VideoPress block editor block,
	 * AKA "VideoPress Block v6".
	 *
	 * @return void
	 */
	public static function register_videopress_video_block() {
		$videopress_video_metadata_file        = __DIR__ . '/client/block-editor/blocks/video/block.json';
		$videopress_video_metadata_file_exists = file_exists( $videopress_video_metadata_file );
		if ( ! $videopress_video_metadata_file_exists ) {
			return;
		}

		$videopress_video_metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $videopress_video_metadata_file )
		);

		// Pick the block name straight from the block metadata .json file.
		$videopress_video_block_name = $videopress_video_metadata->name;
		if ( \WP_Block_Type_Registry::get_instance()->is_registered( $videopress_video_block_name ) ) {
			return;
		}

		register_block_type( $videopress_video_metadata_file );
	}

	/**
	 * Register the VideoPress Chapters editor block,
	 *
	 * @return void
	 */
	public static function register_videopress_chapters_block() {
		$videopress_chapters_metadata_file        = __DIR__ . '/client/block-editor/blocks/video-chapters/block.json';
		$videopress_chapters_metadata_file_exists = file_exists( $videopress_chapters_metadata_file );

		if ( ! $videopress_chapters_metadata_file_exists ) {
			return;
		}

		$videopress_chapters_metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $videopress_chapters_metadata_file )
		);

		// Pick the block name straight from the block metadata .json file.
		$videopress_chapters_block_name = $videopress_chapters_metadata->name;

		if ( \WP_Block_Type_Registry::get_instance()->is_registered( $videopress_chapters_block_name ) ) {
			return;
		}

		register_block_type( $videopress_chapters_metadata_file );
	}
}
