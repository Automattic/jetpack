<?php
/**
 * WordPress.com Content Research feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Status\Host;

/**
 * Class WPCOM_Content_Research
 *
 * Main feature class. Registers REST API endpoints and enqueues
 * the frontend sidebar script on Gutenberg editor screens for
 * automatticians proxied through a8c on WPCOM Simple sites.
 */
class WPCOM_Content_Research {

	/**
	 * Class instance.
	 *
	 * @var WPCOM_Content_Research
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
	 * WPCOM_Content_Research constructor.
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register REST API endpoints.
	 */
	public function register_rest_api() {
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
		$filepath = 'widgets.wp.com/content-research/content-research-gutenberg.asset.json';

		// Try filesystem first (Simple sites). Failures are not cached.
		if ( file_exists( ABSPATH . $filepath ) ) {
			$contents = file_get_contents( ABSPATH . $filepath );
			if ( false !== $contents ) {
				$data = json_decode( $contents, true );
				if ( is_array( $data ) ) {
					return $data;
				}
			}
		}

		$cache_key = 'jetpack_mu_wpcom_cr_asset_' . md5( $filepath );
		$cached    = get_transient( $cache_key );

		if ( is_array( $cached ) ) {
			return $cached;
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
			set_transient( $cache_key, $data, 12 * HOUR_IN_SECONDS );
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

		$version = $asset_file['version'] ?? '1.0.0';

		wp_enqueue_script(
			'content-research-gutenberg',
			'https://widgets.wp.com/content-research/content-research-gutenberg.min.js',
			array(),
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
	 * Returns whether the current request is coming from the a8c proxy.
	 */
	private static function is_proxied() {
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}

	/**
	 * Check if the feature is enabled.
	 *
	 * Restricted to automatticians proxied through a8c on WPCOM Simple sites.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return false;
		}

		if ( ! self::is_proxied() ) {
			return false;
		}

		if ( ! function_exists( '\is_automattician' ) || ! \is_automattician() ) {
			return false;
		}

		return true;
	}
}

// Initialize the feature when this file is loaded.
WPCOM_Content_Research::init();
