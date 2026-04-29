<?php
/**
 * Bridge between the WooCommerce Product Filters blocks and Jetpack Search.
 *
 * Client-side hydration model: drives WooCommerce's Product Filters blocks
 * from Jetpack Search's Elasticsearch aggregations entirely from the
 * front-end. The PHP side is bootstrap only — register a script module,
 * seed runtime config (site ID, API routing, filterConfigs), and let the
 * JS bridge override `woocommerce/product-filters` actions.navigate at
 * runtime.
 *
 * Trade-off: direct URL hits (e.g. `/shop/?categories=foo` from a search
 * engine or a back-button) render WC's default unfiltered counts until JS
 * boots and re-fetches from ES. Same constraint the rest of the Jetpack
 * Search blocks accept (front-end-rendering only).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Bootstraps the WooCommerce Product Filters → Jetpack Search client-side bridge.
 *
 * Loaded only when WooCommerce Blocks is active and the Search module is
 * connected. Gated additionally by `jetpack_search_woocommerce_bridge_enabled`
 * (default false) while the bridge is in PoC stage.
 */
class WooCommerce_Filters_Bridge {

	/**
	 * Script handle used for the bridge view module.
	 */
	const SCRIPT_HANDLE = 'jetpack-search-wc-bridge-view';

	/**
	 * Singleton instance.
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Initialize the bridge if its prerequisites are satisfied.
	 *
	 * Called from the search package initializer. No-op when WooCommerce
	 * Blocks isn't loaded, the Search module isn't active, or the feature
	 * flag is off.
	 */
	public static function init() {
		if ( null !== self::$instance ) {
			return;
		}

		/**
		 * Filter whether the WooCommerce Product Filters bridge is enabled.
		 *
		 * Defaults to false while the bridge is in PoC stage. Returning true
		 * activates the bridge: WooCommerce Product Filters blocks will be
		 * hydrated from Jetpack Search's Elasticsearch aggregations on the
		 * front end.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Default false.
		 */
		if ( ! apply_filters( 'jetpack_search_woocommerce_bridge_enabled', false ) ) {
			return;
		}

		if ( ! self::has_required_dependencies() ) {
			return;
		}

		self::$instance = new self();
		self::$instance->register_hooks();
	}

	/**
	 * Whether the runtime environment can support the bridge.
	 */
	private static function has_required_dependencies() {
		// WooCommerce Blocks must be loaded — that's where the filter blocks live.
		if ( ! class_exists( '\Automattic\WooCommerce\Internal\ProductFilters\FilterData' ) ) {
			return false;
		}

		// Search module must be active so the WPCOM v1.3 search API will accept aggregation requests for this site.
		if ( ! ( new Module_Control() )->is_active() ) {
			return false;
		}

		return true;
	}

	/**
	 * Register all hooks the bridge needs.
	 */
	private function register_hooks() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_bridge_assets' ) );
	}

	/**
	 * Register and enqueue the front-end bridge module, plus seed its
	 * runtime config via `wp_interactivity_state`.
	 *
	 * The seed lives under the `jetpack-search-wc-bridge` namespace rather
	 * than `woocommerce/product-filters` so we don't collide with WC's own
	 * state shape; the JS bridge reads it on init and uses it to compose
	 * the WPCOM v1.3 search URL via `buildSearchUrl()` from
	 * `src/search-blocks/store/api.js`.
	 */
	public function enqueue_bridge_assets() {
		if ( ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}

		$base_path  = Package::get_installed_path() . 'build/search-blocks/';
		$asset_file = $base_path . 'wc-bridge.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;

		// plugins_url() walks up to the nearest plugin directory, which
		// handles the jetpack_vendor location Composer installs the package into.
		$url = plugins_url( 'wc-bridge.js', $base_path . 'wc-bridge.js' );

		wp_register_script_module(
			self::SCRIPT_HANDLE,
			$url,
			$asset['dependencies'] ?? array( '@wordpress/interactivity' ),
			$asset['version'] ?? Package::VERSION
		);
		wp_enqueue_script_module( self::SCRIPT_HANDLE );

		if ( function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state( 'jetpack-search-wc-bridge', $this->build_seed_state() );
		}
	}

	/**
	 * Compose the seeded state for the bridge's Interactivity namespace.
	 *
	 * Mirrors the keys `buildSearchUrl()` expects (see
	 * src/search-blocks/store/api.js) plus a `filterConfigs` map keyed by
	 * the same URL params WC's blocks use, so the JS bridge can translate
	 * URL → aggregations request → counts without further server help.
	 */
	private function build_seed_state() {
		$home_url = function_exists( 'home_url' ) ? home_url() : '';

		return array(
			'siteId'        => Helper::get_wpcom_site_id(),
			'apiRoot'       => function_exists( 'rest_url' ) ? esc_url_raw( rest_url() ) : '',
			'nonce'         => function_exists( 'wp_create_nonce' ) ? wp_create_nonce( 'wp_rest' ) : '',
			'isPrivateSite' => class_exists( '\Automattic\Jetpack\Status' )
				? ( new \Automattic\Jetpack\Status() )->is_private_site()
				: false,
			'isWpcom'       => Helper::is_wpcom(),
			'homeUrl'       => $home_url,
			'filterConfigs' => $this->build_filter_configs(),
		);
	}

	/**
	 * Build a filterConfigs map.
	 *
	 * Keys are the underlying taxonomy slugs (`product_cat`, `product_tag`,
	 * `product_brand`, `pa_<short_attr>`) so the URL contract matches the
	 * Jetpack Search blocks' existing pattern (`?<key>[]=<value>`, see
	 * src/search-blocks/store/url-state.js). That makes filter URLs
	 * interchangeable between WC's filter UI and any Jetpack Search
	 * filter-checkbox blocks on the same page.
	 *
	 * Values carry the `filterType` enum that `resolveFilterFields()` in
	 * src/search-blocks/store/api.js consumes when constructing the ES
	 * aggregation field path.
	 *
	 * @return array<string, array{filterType: string, taxonomy: string, maxItems: int}>
	 */
	private function build_filter_configs() {
		$configs = array(
			'product_cat' => array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_cat',
				'maxItems'   => 100,
			),
			'product_tag' => array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_tag',
				'maxItems'   => 100,
			),
		);

		if ( taxonomy_exists( 'product_brand' ) ) {
			$configs['product_brand'] = array(
				'filterType' => 'taxonomy',
				'taxonomy'   => 'product_brand',
				'maxItems'   => 100,
			);
		}

		if ( function_exists( 'wc_get_attribute_taxonomies' ) ) {
			foreach ( wc_get_attribute_taxonomies() as $attribute_object ) {
				$taxonomy = wc_attribute_taxonomy_name( $attribute_object->attribute_name );

				$configs[ $taxonomy ] = array(
					'filterType' => 'taxonomy',
					'taxonomy'   => $taxonomy,
					'maxItems'   => 100,
				);
			}
		}

		return $configs;
	}
}
