<?php
/**
 * Jetpack Reader Chat — Agents Manager CDN loader for blog readers.
 *
 * Loads a self-contained reader-chat bundle from the widgets.wp.com CDN
 * and renders a floating chat UI on singular posts for logged-out visitors.
 *
 * The reader-chat bundle inlines all WP dependencies (built without
 * DependencyExtractionWebpackPlugin) so it works on the frontend
 * without WordPress's script loader.
 *
 * Enable via filter:
 *   add_filter( 'jetpack_reader_chat_enabled', '__return_true' );
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

const READER_CHAT_JS_URL          = 'https://widgets.wp.com/agents-manager/reader-chat.min.js';
const READER_CHAT_ASSET_TRANSIENT = 'jetpack_reader_chat_asset';

/**
 * Handles loading the reader chat UI on the frontend.
 */
class Jetpack_Reader_Chat {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		/**
		 * Filter to enable or disable the Jetpack Reader Chat feature.
		 *
		 * Defaults to false (opt-in). Enable with:
		 *   add_filter( 'jetpack_reader_chat_enabled', '__return_true' );
		 *
		 * @param bool $enabled Whether the reader chat is enabled.
		 */
		if ( ! apply_filters( 'jetpack_reader_chat_enabled', false ) ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( __CLASS__, 'render_mount_div' ) );
	}

	/**
	 * Enqueue the reader chat script on singular posts.
	 *
	 * @return void
	 */
	public static function enqueue_scripts(): void {
		if ( ! is_singular() ) {
			return;
		}

		/**
		 * Filter to override the AI features check.
		 * Set to true to load reader chat regardless of Jetpack connection status.
		 * Useful for testing on dev sites.
		 *
		 * @param bool|null $override null = use default check, true/false = override.
		 */
		$has_features = apply_filters( 'jetpack_reader_chat_has_ai_features', null );
		if ( null === $has_features ) {
			$has_features = self::has_ai_features();
		}
		if ( ! $has_features ) {
			return;
		}

		$version = self::get_asset_version();

		// The reader-chat bundle is self-contained — no WP script dependencies.
		wp_enqueue_script(
			'jetpack-reader-chat',
			READER_CHAT_JS_URL,
			array(),
			$version,
			true
		);

		wp_enqueue_style(
			'jetpack-reader-chat',
			'https://widgets.wp.com/agents-manager/reader-chat.css',
			array(),
			$version
		);

		// Inject config for the JS bundle (before the script tag).
		wp_add_inline_script(
			'jetpack-reader-chat',
			'window.JetpackReaderChatConfig = ' . wp_json_encode(
				self::get_reader_chat_config(),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Render the mount div in the footer.
	 *
	 * Only outputs the div when the script was successfully enqueued.
	 *
	 * @return void
	 */
	public static function render_mount_div(): void {
		if ( ! wp_script_is( 'jetpack-reader-chat' ) ) {
			return;
		}

		echo '<div id="jetpack-reader-chat"></div>';
	}

	/**
	 * Build the config object for the reader chat JS bundle.
	 *
	 * @return array The config array for JSON encoding.
	 */
	private static function get_reader_chat_config(): array {
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			$site_id = get_current_blog_id();
		} else {
			$site_id = (int) Jetpack_Options::get_option( 'id' );
		}

		return array(
			'siteId'    => $site_id,
			'siteUrl'   => home_url(),
			'siteName'  => get_bloginfo( 'name' ),
			'isDevMode' => self::is_dev_mode(),
		);
	}

	/**
	 * Get the version string for the CDN bundle.
	 *
	 * Attempts to read the version from the remote asset manifest.
	 * Falls back to a timestamp in dev mode, or null in production.
	 *
	 * @return string|false|null The version string, or null to omit the query param.
	 */
	private static function get_asset_version() {
		$skip_cache = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

		if ( ! $skip_cache ) {
			$cached = get_transient( READER_CHAT_ASSET_TRANSIENT );
			if ( false !== $cached ) {
				return $cached['version'] ?? null;
			}
		}

		$json_path = 'widgets.wp.com/agents-manager/reader-chat.asset.json';

		// Try local filesystem first (available on WordPress.com).
		$data = self::read_local_asset_json( ABSPATH . $json_path );

		// Fallback to HTTP fetch.
		if ( false === $data ) {
			$data = self::fetch_remote_asset_json( 'https://' . $json_path );
		}

		if ( false === $data ) {
			// Dev mode: return a cache-busting version so the sandbox bundle loads.
			if ( self::is_dev_mode() ) {
				return 'dev-' . time();
			}
			return null;
		}

		if ( ! $skip_cache ) {
			set_transient( READER_CHAT_ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
		}

		return $data['version'] ?? null;
	}

	/**
	 * Read and decode a local asset manifest JSON file.
	 *
	 * @param string $path Absolute filesystem path to the JSON file.
	 * @return array|false Decoded data or false on failure.
	 */
	private static function read_local_asset_json( string $path ) {
		if ( ! file_exists( $path ) ) {
			return false;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file, not remote URL.
		$contents = file_get_contents( $path );
		if ( false === $contents ) {
			return false;
		}

		$data = json_decode( $contents, true );
		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
			return false;
		}

		return $data;
	}

	/**
	 * Fetch and decode a remote asset manifest JSON file.
	 *
	 * @param string $url URL to fetch.
	 * @return array|false Decoded data or false on failure.
	 */
	private static function fetch_remote_asset_json( string $url ) {
		$response = wp_safe_remote_get( $url );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
			return false;
		}

		return $data;
	}

	/**
	 * Check whether AI features are available for this site.
	 *
	 * @return bool
	 */
	private static function has_ai_features(): bool {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return true;
		}

		return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
			&& ! ( new Status() )->is_offline_mode()
			&& apply_filters( 'jetpack_ai_enabled', true );
	}

	/**
	 * Check if the current request is from a development environment.
	 *
	 * Matches the pattern used in Jetpack_AI_Sidebar::is_dev_mode().
	 * IMPORTANT: Only use for feature gating, not authorization.
	 *
	 * @return bool
	 */
	private static function is_dev_mode(): bool {
		$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );
		if ( ! is_string( $domain ) ) {
			return false;
		}

		if (
			'localhost' === $domain ||
			'.jurassic.tube' === stristr( $domain, '.jurassic.tube' ) ||
			'.jurassic.ninja' === stristr( $domain, '.jurassic.ninja' )
		) {
			return true;
		}

		if ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) {
			return true;
		}

		if (
			( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) && (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) ) ) ||
			( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST )
		) {
			return true;
		}

		if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST && defined( 'ATOMIC_CLIENT_ID' ) ) {
			switch ( ATOMIC_CLIENT_ID ) {
				case 1:
				case 2:
				case 3: // Pressable
				case 32:
				case 118: // Commerce garden client (ciab)
					return true;
			}
		}

		return false;
	}
}
