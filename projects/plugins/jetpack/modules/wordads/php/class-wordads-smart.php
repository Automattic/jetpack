<?php
/**
 *  An implementation for ads served through Equativ Smart Ad Server.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
	 * The parameters for WordAds.
	 *
	 * @var WordAds_Params
	 */
	private $params;

	/**
	 * Has Smart asset been enqueued?
	 *
	 * @var bool True if Smart asset has been enqueued.
	 */
	private $is_asset_enqueued = false;

	/**
	 * Supported formats.
	 * sidebar_widget formats represents the legacy Jetpack sidebar widget.
	 *
	 * @var array
	 */
	private $formats = array(
		'top'                            => array(
			'enabled' => false,
		),
		'inline'                         => array(
			'enabled' => false,
		),
		'belowpost'                      => array(
			'enabled' => false,
		),
		'bottom_sticky'                  => array(
			'enabled' => false,
		),
		'sidebar_sticky_right'           => array(
			'enabled' => false,
		),
		'gutenberg_rectangle'            => array(
			'enabled' => false,
		),
		'gutenberg_leaderboard'          => array(
			'enabled' => false,
		),
		'gutenberg_mobile_leaderboard'   => array(
			'enabled' => false,
		),
		'gutenberg_skyscraper'           => array(
			'enabled' => false,
		),
		'sidebar_widget_mediumrectangle' => array(
			'enabled' => false,
		),
		'sidebar_widget_leaderboard'     => array(
			'enabled' => false,
		),
		'sidebar_widget_wideskyscraper'  => array(
			'enabled' => false,
		),
		'shortcode'                      => array(
			'enabled' => false,
		),
	);

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

		$this->enable_formats();
		$this->override_formats_from_query_string();

		if ( $this->has_any_format_enabled() ) {
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
			if ( $this->formats['inline']['enabled'] ) {
				add_filter(
					'the_content',
					array( $this, 'insert_inline_marker' ),
					10
				);
			}
		}

		if ( $this->formats['bottom_sticky']['enabled'] ) {
			// Disable IPW slot.
			add_filter( 'wordads_iponweb_bottom_sticky_ad_disable', '__return_true', 10 );
		}

		if ( $this->formats['sidebar_sticky_right']['enabled'] ) {
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
		global $post;

		$config = array(
			'post_id' => ( $post instanceof WP_Post ) && is_singular( 'post' ) ? $post->ID : null,
			'origin'  => 'jetpack',
			'theme'   => get_stylesheet(),
			'target'  => $this->target_keywords(),
		) + $this->formats;

		// Do conversion.
		$js_config = WordAds_Array_Utils::array_to_js_object( $config );

		// Output script.
		wp_print_inline_script_tag( "var wa_smart = $js_config; wa_smart.cmd = [];" );
	}

	/**
	 * Add the Smart resource hints.
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
	 * Gets the URL to a JSONP endpoint with configuration data.
	 *
	 * @return string The URL.
	 */
	private function get_config_url(): string {
		return sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%1$d/adflow/conf/?_jsonp=a8c_adflow_callback',
			$this->params->blog_id
		);
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

	/**
	 * Gets a formatted list of target keywords.
	 *
	 * @return string Formatted list of target keywords.
	 */
	private function target_keywords(): string {
		$target_keywords = array_merge(
			$this->get_blog_keywords(),
			$this->get_language_keywords()
		);

		return implode( ';', $target_keywords );
	}

	/**
	 * Gets a formatted list of blog keywords.
	 *
	 * @return array The list of blog keywords.
	 */
	private function get_blog_keywords(): array {
		return array( 'wp_blog_id=' . $this->params->blog_id );
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
	 * Enable formats by post types and the display options.
	 *
	 * @return void
	 */
	private function enable_formats(): void {
		$this->formats['top']['enabled']                  = $this->params->options['enable_header_ad'];
		$this->formats['inline']['enabled']               = is_singular( 'post' ) && $this->params->options['wordads_inline_enabled'];
		$this->formats['belowpost']['enabled']            = $this->params->should_show();
		$this->formats['bottom_sticky']['enabled']        = $this->params->options['wordads_bottom_sticky_enabled'];
		$this->formats['sidebar_sticky_right']['enabled'] = $this->params->options['wordads_sidebar_sticky_right_enabled'];
	}

	/**
	 * Allow format enabled override from query string, eg. ?inline=true.
	 *
	 * @return void
	 */
	private function override_formats_from_query_string(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['wordads-logging'] ) ) {
			return;
		}

		foreach ( $this->formats as $format_type => $_ ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET[ $format_type ] ) && 'true' === $_GET[ $format_type ] ) {
				$this->formats[ $format_type ]['enabled'] = true;
			}
		}
	}

	/**
	 * Check if has any format enabled.
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	private function has_any_format_enabled(): bool {
		return in_array( true, array_column( $this->formats, 'enabled' ), true );
	}
}
