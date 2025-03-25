<?php
/**
 *  An implementation for ads served through WATL.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript

require_once WORDADS_ROOT . '/php/class-wordads-array-utils.php';
require_once WORDADS_ROOT . '/php/class-wordads-client-config.php';
require_once WORDADS_ROOT . '/php/class-wordads-format.php';

/**
 * Contains all the implementation details for WATL ads
 */
class WordAds_Client {
	/**
	 * WordAds Client Configuration settings.
	 *
	 * @var WordAds_Client_Config
	 */
	private $config;

	/**
	 * The single instance of the class.
	 *
	 * @var WordAds_Client
	 */
	protected static $instance = null;

	/**
	 * The parameters for WordAds.
	 *
	 * @var WordAds_Params
	 */
	private $params;

	/**
	 * Has asset been enqueued?
	 *
	 * @var bool True if asset has been enqueued.
	 */
	private $is_asset_enqueued = false;

	/**
	 * Private constructor.
	 */
	private function __construct() {
	}

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of WordAds_Client is loaded or can be loaded.
	 *
	 * @return WordAds_Client
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Initialize the ads.
	 *
	 * @param WordAds_Params $params Object containing WordAds settings.
	 *
	 * @return void
	 */
	public function init( WordAds_Params $params ) {
		$this->params = $params;
		$this->config = new WordAds_Client_Config( $this->params );

		if ( $this->config->has_any_format_enabled() ) {
			$this->insert_ads();
		}
	}

	/**
	 * Enqueue any front-end CSS and JS.
	 *
	 * @return void
	 */
	public function enqueue_assets() {

		if ( $this->is_asset_enqueued ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'insert_config' ) );

		Assets::register_script(
			'adflow_script_loader',
			'_inc/build/wordads/js/adflow-loader.min.js',
			JETPACK__PLUGIN_FILE,
			array(
				'nonmin_path'  => 'modules/wordads/js/adflow-loader.js',
				'dependencies' => array(),
				'enqueue'      => true,
				'version'      => JETPACK__VERSION,
			)
		);

		wp_enqueue_script(
			'adflow_config',
			$this->config->get_server_config_url(),
			array( 'adflow_script_loader' ),
			JETPACK__VERSION,
			false
		);

		$this->is_asset_enqueued = true;
	}

	/**
	 * Inserts ad tags on the page.
	 *
	 * @return void
	 */
	private function insert_ads() {
		if ( $this->params->is_amp ) {
			return;
		}

		// Don't run on not found pages.
		if ( is_404() ) {
			return;
		}

		// Add the resource hints.
		add_filter( 'wp_resource_hints', array( $this, 'resource_hints' ), 10, 2 );

		// Enqueue JS assets.
		$this->enqueue_assets();

		$is_static_front_page = is_front_page() && 'page' === get_option( 'show_on_front' );

		if ( ! ( $is_static_front_page || is_home() ) ) {
			if ( $this->config->is_format_enabled( WordAds_Format::INLINE ) ) {
				add_filter(
					'the_content',
					array( $this, 'insert_inline_marker' ),
					10
				);
			}
		}

		if ( $this->config->is_format_enabled( WordAds_Format::BOTTOM_STICKY ) ) {
			// Disable IPW slot.
			add_filter( 'wordads_iponweb_bottom_sticky_ad_disable', '__return_true', 10 );
		}

		if ( $this->config->is_format_enabled( WordAds_Format::SIDEBAR_STICKY_RIGHT ) ) {
			// Disable IPW slot.
			add_filter( 'wordads_iponweb_sidebar_sticky_right_ad_disable', '__return_true', 10 );
		}
	}

	/**
	 * Inserts JS configuration used by watl.js.
	 *
	 * @return void
	 */
	public function insert_config() {
		// Do conversion.
		$js_config = WordAds_Array_Utils::array_to_js_object( $this->config->get_config() );

		// Output script.
		wp_print_inline_script_tag( "var wa_client = {}; wa_client.cmd = []; wa_client.config = $js_config;" );
	}

	/**
	 * Add the resource hints.
	 *
	 * @param array  $hints Domains for hinting.
	 * @param string $relation_type Resource type.
	 *
	 * @return array Domains for hinting.
	 */
	public function resource_hints( $hints, $relation_type ) {
		if ( 'dns-prefetch' === $relation_type ) {
			$hints[] = '//af.pubmine.com';
		}

		return $hints;
	}

	/**
	 * Places marker at the end of the content so inline can identify the post content container.
	 *
	 * @param string|null $content The post content.
	 * @return string|null The post content with the marker appended.
	 */
	public function insert_inline_marker( ?string $content ): ?string {
		if ( null === $content ) {
			return null;
		}
		$inline_ad_marker = '<span id="wordads-inline-marker" style="display: none;"></span>';

		// Append the ad to the post content.
		return $content . $inline_ad_marker;
	}
}
