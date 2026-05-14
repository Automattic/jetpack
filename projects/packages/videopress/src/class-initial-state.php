<?php
/**
 * The modernized VideoPress dashboard React initial state.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;
use function admin_url;
use function esc_url_raw;
use function get_bloginfo;
use function get_locale;
use function get_option;
use function get_site_url;
use function plugins_url;
use function rest_url;
use function wp_add_inline_script;
use function wp_create_nonce;
use function wp_json_encode;
use function wp_parse_url;
use function wp_script_is;

/**
 * The modernized VideoPress dashboard React initial state.
 *
 * Mirrors the Activity Log dashboard pattern: a small structured payload
 * inlined as `var JPVIDEOPRESS_INITIAL_STATE=...` before the wp-build boot
 * script runs. Phases 6 and 8 will consume the payload via per-file
 * `declare const` ambient types.
 */
class Initial_State {

	const SCRIPT_HANDLE = 'jetpack-videopress-dashboard-wp-admin-prerequisites';

	/**
	 * Register the inline-state enqueue hook.
	 *
	 * Hooks `admin_enqueue_scripts` at priority 11 so the wp-build page
	 * (`build/pages/jetpack-videopress-dashboard/page-wp-admin.php`) has
	 * already registered the prerequisites handle at its default priority 10.
	 * The `wp_script_is( ..., 'registered' )` check inside the callback
	 * doubles as the page guard.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue' ), 11 );
	}

	/**
	 * Inline the initial-state payload before the wp-build boot script.
	 *
	 * @return void
	 */
	public static function enqueue() {
		if ( ! Admin_UI::is_modernized() ) {
			return;
		}

		if ( ! wp_script_is( self::SCRIPT_HANDLE, 'registered' ) ) {
			return;
		}

		wp_add_inline_script( self::SCRIPT_HANDLE, ( new self() )->render(), 'before' );
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		$gmt_offset      = get_option( 'gmt_offset' );
		$timezone_string = get_option( 'timezone_string' );
		$home_host       = wp_parse_url( get_site_url(), PHP_URL_HOST );

		return array(
			'API'           => array(
				'WP_API_root'  => esc_url_raw( rest_url() ),
				'WP_API_nonce' => wp_create_nonce( 'wp_rest' ),
			),
			'jetpackStatus' => array(
				'calypsoSlug' => ( new Status() )->get_site_suffix(),
			),
			'siteData'      => array(
				'id'                  => Jetpack_Options::get_option( 'id' ),
				'title'               => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url(),
				'adminUrl'            => esc_url_raw( admin_url() ),
				'slug'                => is_string( $home_host ) ? $home_host : '',
				'gmtOffset'           => is_numeric( $gmt_offset ) ? (float) $gmt_offset : 0.0,
				'timezoneString'      => is_string( $timezone_string ) ? $timezone_string : '',
				'locale'              => str_replace( '_', '-', (string) get_locale() ),
				// Paid-tier capability check. Drives the free-tier UX
				// (callout / DataViews configuration) once designer input
				// lands. Backed by `Product::get_site_features_from_wpcom()`,
				// which caches the WPCOM `/sites/%d/features` response in a
				// 15-second site transient. On a cache miss this issues a
				// synchronous WPCOM request that blocks page rendering until
				// it returns.
				'hasVideoPressAccess' => self::has_videopress_access(),
			),
			'assets'        => array(
				'buildUrl' => plugins_url( '../build/', __FILE__ ),
			),
		);
	}

	/**
	 * Whether the site has a paid VideoPress plan.
	 *
	 * Matches the active-features check used by the existing
	 * `videopress/v1/features` REST endpoint: any of the storage tiers
	 * counts as paid access. On WPCOM the legacy `videopress` slug also
	 * grants access.
	 *
	 * @return bool
	 */
	public static function has_videopress_access() {
		$features = Product::get_site_features_from_wpcom();

		if ( is_wp_error( $features ) ) {
			return false;
		}

		$active = $features['active'] ?? array();

		return in_array( 'videopress-1tb-storage', $active, true )
			|| in_array( 'videopress-unlimited-storage', $active, true )
			|| ( ( new Host() )->is_wpcom_platform() && in_array( 'videopress', $active, true ) );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		return 'var JPVIDEOPRESS_INITIAL_STATE=' . wp_json_encode( $this->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
	}
}
