<?php
/**
 * The modernized VideoPress dashboard React initial state.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Products as My_Jetpack_Products;
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
	 * WPCOM product slug purchased by the dashboard's upgrade CTA.
	 *
	 * Mirrors the product `Plan::get_product()` resolves to
	 * (`$products->jetpack_videopress`). Kept as a constant rather than read
	 * from `Plan::get_product()` because that helper issues a synchronous
	 * WPCOM request, which we don't want to incur on every page render.
	 */
	const VIDEOPRESS_PRODUCT_SLUG = 'jetpack_videopress';

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

		// Hydrate the JP connection store (`window.JP_CONNECTION_INITIAL_STATE`)
		// so shared connection-aware hooks — notably
		// `useProductCheckoutWorkflow`, which powers the upgrade CTA — work on
		// the modernized dashboard exactly as they do on the legacy one. This
		// also sets `window.jpTracksContext.blog_id` for `@automattic/jetpack-analytics`.
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );
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
			'API'                    => array(
				'WP_API_root'  => esc_url_raw( rest_url() ),
				'WP_API_nonce' => wp_create_nonce( 'wp_rest' ),
				'contentNonce' => wp_create_nonce( 'videopress-content-nonce' ),
			),
			'jetpackStatus'          => array(
				'calypsoSlug' => ( new Status() )->get_site_suffix(),
			),
			'product'                => array(
				// Fed to `useProductCheckoutWorkflow` as the product to purchase.
				'slug' => self::VIDEOPRESS_PRODUCT_SLUG,
			),
			'siteData'               => array(
				'id'                    => Jetpack_Options::get_option( 'id' ),
				'title'                 => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url(),
				'adminUrl'              => esc_url_raw( admin_url() ),
				'slug'                  => is_string( $home_host ) ? $home_host : '',
				'gmtOffset'             => is_numeric( $gmt_offset ) ? (float) $gmt_offset : 0.0,
				'timezoneString'        => is_string( $timezone_string ) ? $timezone_string : '',
				'locale'                => str_replace( '_', '-', (string) get_locale() ),
				// Paid-tier capability check. Drives the free-tier UX (callout /
				// DataViews configuration) once designer input lands. Backed by
				// `Product::get_site_features_from_wpcom()`, which caches the WPCOM
				// `/sites/%d/features` response in a 15-second site transient. On a
				// cache miss this issues a synchronous WPCOM request that blocks
				// page rendering until it returns.
				'hasVideoPressAccess'   => self::has_videopress_access(),
				'isVideoPress1TB'       => self::has_videopress_feature( 'videopress-1tb-storage' ),
				'isVideoPressUnlimited' => self::has_videopress_feature( 'videopress-unlimited-storage' ),
			),
			'assets'                 => array(
				'buildUrl' => plugins_url( '../build/', __FILE__ ),
			),
			// Authoritative map of accepted upload types (extension => mimetype),
			// so the dashboard's drag-and-drop filter accepts exactly what the
			// VideoPress backend supports rather than guessing client-side.
			'allowedVideoExtensions' => Admin_UI::get_allowed_video_extensions(),
			// Product/pricing payload for the pre-connection upsell. Only
			// populated when the site isn't connected — the only time the
			// connection gate renders the upsell — so connected dashboards never
			// incur the synchronous WPCOM pricing request `get_pricing_data()`
			// makes.
			'pricing'                => ( new Connection_Manager() )->is_connected() ? null : $this->get_pricing_data(),
		);
	}

	/**
	 * Product description, feature list, and yearly price for the
	 * pre-connection upsell (a port of the legacy dashboard's pricing table).
	 *
	 * Backed by `Plan::get_product_price()`, which issues a synchronous WPCOM
	 * request, so this only runs for disconnected sites. Returns null when the
	 * product or price data isn't available (e.g. the WPCOM request fails), in
	 * which case the gate falls back to the plain connect screen.
	 *
	 * @return array|null The upsell payload, or null when it can't be built.
	 */
	private function get_pricing_data() {
		$site_product  = My_Jetpack_Products::get_product( 'videopress' );
		$product_price = Plan::get_product_price();

		if ( ! is_array( $site_product ) || ! isset( $product_price['yearly'] ) ) {
			return null;
		}

		return array(
			'title'    => isset( $site_product['description'] ) ? (string) $site_product['description'] : '',
			'features' => isset( $site_product['features'] ) ? array_values( (array) $site_product['features'] ) : array(),
			'yearly'   => $product_price['yearly'],
		);
	}

	/**
	 * Whether the site has any paid VideoPress feature flag active.
	 *
	 * Matches the active-features check used by the existing
	 * `videopress/v1/features` REST endpoint: any of the storage tiers
	 * counts as paid access. On WPCOM the legacy `videopress` slug also
	 * grants access.
	 *
	 * @return bool
	 */
	public static function has_videopress_access() {
		return self::has_videopress_feature( 'videopress-1tb-storage' )
			|| self::has_videopress_feature( 'videopress-unlimited-storage' )
			|| ( ( new Host() )->is_wpcom_platform() && self::has_videopress_feature( 'videopress' ) );
	}

	/**
	 * Whether the named feature appears in the WPCOM active-features list.
	 *
	 * @param string $feature_slug Feature slug as returned by WPCOM (e.g. `videopress-1tb-storage`).
	 * @return bool
	 */
	private static function has_videopress_feature( $feature_slug ) {
		$features = Product::get_site_features_from_wpcom();

		if ( is_wp_error( $features ) ) {
			return false;
		}

		$active = $features['active'] ?? array();

		return in_array( $feature_slug, $active, true );
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
