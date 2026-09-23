<?php
/**
 * Survicate survey integration
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Survicate
 */
class Survicate {
	/**
	 * The shared Survicate bundle, built from wp-calypso's `apps/survicate` and served from widgets.wp.com.
	 */
	const BUNDLE_URL = 'https://widgets.wp.com/survicate/survicate.min.js';

	/**
	 * Path (without scheme) of the bundle's asset manifest: `dependencies` and `version`.
	 */
	const ASSET_JSON_PATH = 'widgets.wp.com/survicate/survicate.asset.json';

	/**
	 * Transient caching the decoded asset manifest.
	 */
	const ASSET_TRANSIENT_KEY = 'wpcom_survicate_asset_json';

	/**
	 * Class instance.
	 *
	 * @var Survicate
	 */
	private static $instance = null;

	/**
	 * Survicate constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 100 );
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Check whether Survicate should load on the current page.
	 *
	 * @return bool
	 */
	private function should_load() {
		if ( ! is_user_logged_in() ) {
			return false;
		}

		if ( ! is_admin() ) {
			return false;
		}

		// Network and user admin pages are internal tools surfaces; surveys must never reach them.
		if ( is_network_admin() || is_user_admin() ) {
			return false;
		}

		// Only load for English locale users.
		if ( strpos( strtolower( get_user_locale() ), 'en' ) !== 0 ) {
			return false;
		}

		// Atomic powers Automattic's internal P2s; surveys must never reach them.
		if ( ( new \Automattic\Jetpack\Status\Host() )->is_p2_site() ) {
			return false;
		}

		return true;
	}

	/**
	 * Detect whether the current site is a Big Sky site.
	 *
	 * Used as a visitor trait so Survicate's targeting UI can include or exclude
	 * Big Sky users without a code change.
	 *
	 * @return bool
	 */
	private function is_big_sky_site() {
		if ( ! function_exists( 'wpcom_has_blog_sticker' ) ) {
			return false;
		}

		$blog_id = get_wpcom_blog_id();
		if ( ! $blog_id ) {
			return false;
		}

		return wpcom_has_blog_sticker( 'big-sky-enabled', $blog_id )
			|| wpcom_has_blog_sticker( 'big-sky-free-trial', $blog_id );
	}

	/**
	 * Detect the current editor context.
	 *
	 * @return string One of 'site-editor', 'block-editor', or 'wp-admin'.
	 */
	private function get_editor_context() {
		global $pagenow;

		if ( $pagenow === 'site-editor.php' ) {
			return 'site-editor';
		}

		if ( function_exists( 'get_current_screen' ) ) {
			$current_screen = get_current_screen();
			if ( $current_screen && $current_screen->is_block_editor() && $current_screen->id !== 'widgets' ) {
				return 'block-editor';
			}
		}

		return 'wp-admin';
	}

	/**
	 * Get visitor traits for Survicate.
	 *
	 * @return array
	 */
	private function get_visitor_traits() {
		$user_data = get_userdata( get_current_user_id() );
		$email     = $user_data ? $user_data->user_email : '';
		$site_id   = get_wpcom_blog_id();
		$site_type = ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) ? 'atomic' : 'simple';

		return array(
			'email'           => $email,
			'site_id'         => $site_id ? (string) $site_id : '',
			'site_type'       => $site_type,
			'editor_context'  => $this->get_editor_context(),
			// Stringified for Survicate's trait targeting UI, which matches on string equality.
			'is_big_sky_site' => $this->is_big_sky_site() ? 'true' : 'false',
		);
	}

	/**
	 * Reads the bundle's asset manifest: from disk on WordPress.com, over the
	 * network on Atomic. Cached for an hour. Returns null when unavailable so
	 * the caller can skip Survicate entirely — surveys are optional and must
	 * never break wp-admin.
	 *
	 * @return array|null Decoded manifest with `dependencies` and `version`, or null.
	 */
	private function get_asset_json() {
		$asset = get_transient( self::ASSET_TRANSIENT_KEY );
		if ( is_array( $asset ) ) {
			return $asset;
		}

		$local_path = ABSPATH . '/' . self::ASSET_JSON_PATH;
		if ( file_exists( $local_path ) ) {
			$asset = json_decode( file_get_contents( $local_path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		} else {
			$response = wp_remote_get( 'https://' . self::ASSET_JSON_PATH );
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return null;
			}
			$asset = json_decode( wp_remote_retrieve_body( $response ), true );
		}

		if ( ! is_array( $asset ) || empty( $asset['version'] ) ) {
			return null;
		}

		set_transient( self::ASSET_TRANSIENT_KEY, $asset, HOUR_IN_SECONDS );

		return $asset;
	}

	/**
	 * Enqueue the shared Survicate bundle and the config it reads.
	 *
	 * PHP decides whether the user, screen and site are eligible and which
	 * site-level traits to attach; the bundle owns the SDK lifecycle and the
	 * survey suppression rules (see `packages/survicate` in wp-calypso).
	 */
	public function enqueue_scripts() {
		if ( ! $this->should_load() ) {
			return;
		}

		$asset = $this->get_asset_json();
		if ( null === $asset ) {
			return;
		}

		wp_enqueue_script(
			'wpcom-survicate',
			self::BUNDLE_URL,
			$asset['dependencies'] ?? array(),
			$asset['version'],
			true
		);

		$config = array(
			'locale' => get_user_locale(),
			'traits' => $this->get_visitor_traits(),
		);

		wp_add_inline_script(
			'wpcom-survicate',
			'window.wpcomSurvicateConfig = ' . wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Survicate', 'init' ) );
