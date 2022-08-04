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
	 * Invoke this method to initialize the VideoPress package
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

		// Register VideoPress block
		add_action( 'init', array( __CLASS__, 'register_block_editor_blocks' ) );

		// Enqueue VideoPress block assets in the frontend.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'add_frontend_scripts' ) );

		/**
		 * Fires after the VideoPress package is initialized
		 *
		 * @since 0.1.1
		 */
		do_action( 'videopress_init' );
	}

	/**
	 * Initialize VideoPress features that should be initialized whenever VideoPress is present, even if the module is not active
	 *
	 * @return void
	 */
	private static function unconditional_initialization() {
		Module_Control::init();
		new WPCOM_REST_API_V2_Endpoint_VideoPress();
	}

	/**
	 * Initialize VideoPress features that should be initialized only when the module is active
	 *
	 * @return void
	 */
	private static function active_initialization() {
		self::register_oembed_providers();
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
	}

	/**
	 * Register the block editor blocks:
	 * - VideoPress block
	 *
	 * @return void
	 */
	public static function register_block_editor_blocks() {
		register_block_type( __DIR__ . '/client/block-editor/blocks/videopress/' );
	}

	/**
	 * Enqueue scripts for the VideoPress block,
	 * in the frontend.
	 *
	 * @return void
	 */
	public static function add_frontend_scripts() {
		$path         = plugins_url( '/../build/view.js', __FILE__ );
		$build_assets = require_once __DIR__ . '/../build/view.asset.php';

		wp_enqueue_script(
			'media-manager-media-center',
			$path,
			$build_assets['dependencies'],
			filemtime( plugin_dir_path( __FILE__ ) . 'build/view.js' ),
			true
		);
	}
}
