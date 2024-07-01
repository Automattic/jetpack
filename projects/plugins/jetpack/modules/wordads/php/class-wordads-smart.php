<?php
/**
 *  An implementation for ads served through Equativ Smart Ad Server.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript

require_once WORDADS_ROOT . '/php/class-wordads-array-utils.php';

/**
 * Contains all the implementation details for Smart ads
 */
class WordAds_Smart {

	/**
	 * The single instance of the class.
	 *
	 * @var WordAds_Smart
	 */
	protected static $instance = null;

	/**
	 * Is this an AMP request?
	 *
	 * @var bool
	 */
	private $is_amp;

	/**
	 * Current blog theme from get_stylesheet().
	 *
	 * @var string
	 */
	private $theme;

	/**
	 * Has Smart asset been enqueued?
	 *
	 * @var bool True if Smart asset has been enqueued.
	 */
	private $is_asset_enqueued = false;

	/**
	 * Toggle for inline ads.
	 *
	 * @var bool True if inline ads are enabled.
	 */
	private $is_inline_enabled;

	/**
	 * Private constructor.
	 */
	private function __construct() {
	}

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of WordAds_Smart is loaded or can be loaded.
	 *
	 * @return WordAds_Smart
	 */
	public static function instance() {
		if ( self::$instance === null ) {
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
		$this->is_amp            = function_exists( 'amp_is_request' ) && amp_is_request();
		$this->theme             = get_stylesheet();
		$this->is_inline_enabled = is_singular( 'post' ) && $params->options['wordads_inline_enabled'];

		// Allow override.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['inline'] ) && 'true' === $_GET['inline'] ) {
			$this->is_inline_enabled = true;
		}
		if ( $this->is_inline_enabled ) {
			// Insert ads.
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
			esc_url( $this->get_config_url() ),
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
		if ( $this->is_amp ) {
			return;
		}

		// Don't run on not found pages.
		if ( is_404() ) {
			return;
		}

		// Enqueue JS assets.
		$this->enqueue_assets();

		$is_static_front_page = is_front_page() && 'page' === get_option( 'show_on_front' );

		if ( ! ( $is_static_front_page || is_home() ) ) {
			if ( $this->is_inline_enabled ) {
				add_filter(
					'the_content',
					array( $this, 'insert_inline_marker' ),
					10
				);
			}
		}
	}

	/**
	 * Inserts JS configuration used by watl.js.
	 *
	 * @return void
	 */
	public function insert_config() {
		global $post;

		$config = array(
			'blog_id' => $this->get_blog_id(),
			'post_id' => ( $post instanceof WP_Post ) && is_singular( 'post' ) ? $post->ID : null,
			'theme'   => $this->theme,
			'target'  => $this->target_keywords(),
			'_'       => array(
				'title'            => __( 'Advertisement', 'jetpack' ),
				'privacy_settings' => __( 'Privacy Settings', 'jetpack' ),
			),
			'inline'  => array(
				'enabled' => $this->is_inline_enabled,
			),
		);

		// Do conversion.
		$js_config = WordAds_Array_Utils::array_to_js_object( $config );

		// Output script.
		wp_print_inline_script_tag( "var wa_smart = $js_config; wa_smart.cmd = [];" );
	}

	/**
	 * Gets the URL to a JSONP endpoint with configuration data.
	 *
	 * @return string The URL.
	 */
	private function get_config_url(): string {
		return sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%1$d/adflow/conf/?_jsonp=a8c_adflow_callback',
			$this->get_blog_id()
		);
	}

	/**
	 * Places marker at the end of the content so inline can identify the post content container.
	 *
	 * @param string|null $content The post content.
	 * @return string|null The post content with the marker appended.
	 */
	public function insert_inline_marker( $content ) {
		if ( $content === null ) {
			return $content;
		}
		$inline_ad_marker = '<span id="wordads-inline-marker" style="display: none;"></span>';

		// Append the ad to the post content.
		return $content . $inline_ad_marker;
	}

	/**
	 * Gets a formatted list of target keywords.
	 *
	 * @return string Formatted list of target keywords.
	 */
	private function target_keywords(): string {
		$target_keywords = array_merge(
			$this->get_blog_keywords(),
			$this->get_language_keywords()
			// TODO: Include categorization.
		);

		return implode( ';', $target_keywords );
	}

	/**
	 * Gets a formatted list of blog keywords.
	 *
	 * @return array The list of blog keywords.
	 */
	private function get_blog_keywords(): array {
		return array( 'wp_blog_id=' . $this->get_blog_id() );
	}

	/**
	 * Gets the site language formatted as a keyword.
	 *
	 * @return array The language as a keyword.
	 */
	private function get_language_keywords(): array {
		return array( 'language=' . explode( '-', get_locale() )[0] );
	}

	/**
	 * Gets the blog's ID.
	 *
	 * @return int The blog's ID.
	 */
	private function get_blog_id(): int {
		return Jetpack::get_option( 'id', 0 );
	}
}
