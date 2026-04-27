<?php
/**
 * Content Research feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Content_Research
 *
 * Main feature class. Registers REST API endpoints and enqueues
 * the frontend sidebar script on Gutenberg editor screens.
 */
class Content_Research {

	/**
	 * Class instance.
	 *
	 * @var Content_Research
	 */
	private static $instance = null;

	/**
	 * Initialize the feature.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Content_Research constructor.
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register REST API endpoints (only when feature is enabled).
	 */
	public function register_rest_api() {
		if ( ! self::is_enabled() ) {
			return;
		}

		require_once __DIR__ . '/interface-content-research-source.php';
		require_once __DIR__ . '/class-source-hackernews.php';
		require_once __DIR__ . '/class-source-reader.php';
		require_once __DIR__ . '/class-source-googlenews.php';

		require_once __DIR__ . '/class-wp-rest-content-research-search.php';
		( new WP_REST_Content_Research_Search() )->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-content-research-summarize.php';
		( new WP_REST_Content_Research_Summarize() )->register_rest_route();
	}

	/**
	 * Get the asset file data (dependencies, version) from widgets.wp.com.
	 *
	 * Uses filesystem on Simple sites, HTTP on Atomic.
	 *
	 * @return array|null The asset file data or null on failure.
	 */
	private static function get_asset_file() {
		$cache_key = 'content-research-gutenberg.asset.json';
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return $cached;
		}

		$filepath = 'widgets.wp.com/content-research/content-research-gutenberg.asset.json';

		// Try filesystem first (Simple sites).
		if ( file_exists( ABSPATH . $filepath ) ) {
			$contents = file_get_contents( ABSPATH . $filepath ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( false !== $contents ) {
				$data = json_decode( $contents, true );
				if ( is_array( $data ) ) {
					set_transient( $cache_key, $data, HOUR_IN_SECONDS );
					return $data;
				}
			}
		}

		// Fall back to HTTP (Atomic sites).
		$request = wp_remote_get(
			'https://' . $filepath,
			array(
				'timeout'     => 5,
				'redirection' => 2,
			)
		);
		if ( is_wp_error( $request ) || 200 !== wp_remote_retrieve_response_code( $request ) ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $request ), true );
		if ( is_array( $data ) ) {
			set_transient( $cache_key, $data, HOUR_IN_SECONDS );
			return $data;
		}

		return null;
	}

	/**
	 * Enqueue the Content Research sidebar script on editor screens.
	 */
	public function enqueue_scripts() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$asset_file = self::get_asset_file();
		if ( ! $asset_file ) {
			return;
		}

		$version      = $asset_file['version'] ?? '1.0.0';
		$dependencies = $asset_file['dependencies'] ?? array();

		wp_enqueue_script(
			'content-research-gutenberg',
			'https://widgets.wp.com/content-research/content-research-gutenberg.min.js',
			$dependencies,
			$version,
			true
		);

		wp_add_inline_script(
			'content-research-gutenberg',
			'window.contentResearchData = ' . wp_json_encode(
				array(
					'enabled' => true,
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		wp_enqueue_style(
			'content-research-gutenberg-style',
			'https://widgets.wp.com/content-research/content-research-gutenberg' . ( is_rtl() ? '.rtl.css' : '.css' ),
			array(),
			$version
		);
	}

	/**
	 * Check if the feature is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// Blog sticker — the standard WPcom feature flag mechanism.
		// Enable via: wpcom_set_blog_sticker( 'content-research-enabled', get_wpcom_blog_id() )
		if ( function_exists( 'wpcom_has_blog_sticker' ) && function_exists( 'get_wpcom_blog_id' ) ) {
			if ( wpcom_has_blog_sticker( 'content-research-enabled', get_wpcom_blog_id() ) ) {
				return true;
			}
		}

		return apply_filters( 'jetpack_mu_wpcom_content_research_enabled', false );
	}
}

// Initialize the feature when this file is loaded.
Content_Research::init();
