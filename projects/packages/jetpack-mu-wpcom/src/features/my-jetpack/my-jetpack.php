<?php
/**
 * Serve My Jetpack's WordPress.com data locally on Simple sites.
 *
 * My Jetpack normally reads its products, purchases, plan, features and site info from
 * WordPress.com over a blog-token-signed HTTP request. Simple sites have no blog token, so those
 * requests cannot succeed. Every lookup would fail and the products page would report each product
 * as unowned, no matter what the site actually bought.
 *
 * Simple already holds all of this data in-process, so we short-circuit each lookup through the
 * matching wpcom function. This follows the pattern jetpack-plans already uses (see
 * Current_Plan::get_simple_site_specific_features() and Plans::get_plans(), both of which branch on
 * IS_WPCOM and call Store_Product_List directly).
 *
 * Scope: Simple only. Atomic has a real blog token and its HTTP path works, so it is left alone.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;

/**
 * The rollout switch for My Jetpack on Simple, defined by the wpcom platform.
 *
 * Also the constant that puts My Jetpack into products-only mode (see My_Jetpack\Products_Page).
 */
const WPCOM_MY_JETPACK_FLAG = 'JETPACK_MY_JETPACK_PRODUCTS_ONLY';

/**
 * Whether the WordPress.com data helpers are usable in this request.
 *
 * Simple sites only. The wpcom function/class checks are belt-and-braces: this file also runs in
 * the package's test suite, where the wpcom platform is not loaded.
 *
 * @return bool
 */
function wpcom_my_jetpack_can_serve_data_locally() {
	return defined( 'IS_WPCOM' ) && IS_WPCOM;
}

/**
 * Whether My Jetpack should run on this Simple site.
 *
 * Fails closed by design. The flag both enables My Jetpack here AND is what selects products-only
 * mode, so a site that initialized My Jetpack without it would get the full dashboard - module
 * toggles, onboarding - which a Simple site can neither use nor act on.
 *
 * @return bool
 */
function wpcom_my_jetpack_is_enabled_on_simple() {
	if ( ! wpcom_my_jetpack_can_serve_data_locally() || ! class_exists( Constants::class ) ) {
		return false;
	}

	return Constants::is_true( WPCOM_MY_JETPACK_FLAG );
}

/**
 * Reshape the local features data into what My Jetpack expects.
 *
 * The local call returns 'available' as an associative array, but My Jetpack reads it as an object
 * ( $features['available']->$feature, see Product::get_paid_bundles_that_include_product ). Passing
 * it through untouched makes every paid-bundle lookup come back empty, which renders owned products
 * as unowned. 'active' stays a flat list because it is checked with in_array().
 *
 * @param array $local Features as returned by the local store.
 * @return array
 */
function wpcom_my_jetpack_normalize_features( array $local ) {
	return array(
		'active'    => $local['active'] ?? array(),
		'available' => (object) ( $local['available'] ?? array() ),
	);
}

/**
 * Serve the site's active/available features from the local store.
 *
 * Store_Product_List::get_site_specific_features_data() - reached through the jetpack-plans wrapper,
 * which caches per blog - is the same code that backs the /sites/%d/features REST endpoint.
 *
 * @param null|array|WP_Error $features Features, or null to fetch them from WordPress.com.
 * @return null|array|WP_Error
 */
function wpcom_my_jetpack_site_features( $features ) {
	if ( ! wpcom_my_jetpack_can_serve_data_locally() || ! class_exists( Current_Plan::class ) ) {
		return $features;
	}

	return wpcom_my_jetpack_normalize_features( Current_Plan::get_simple_site_specific_features() );
}

/**
 * Fill in the purchase properties My Jetpack reads but the local store does not provide.
 *
 * The store rows carry product_slug, expiry_date and subscribed_date, but call the identifier
 * subscription_id rather than ID, and have no product_name or expiry_message. My Jetpack's
 * red-bubble notifications read all three.
 *
 * @param array $local Purchases as returned by the local store.
 * @return array
 */
function wpcom_my_jetpack_normalize_purchases( array $local ) {
	return array_map(
		function ( $purchase ) {
			// My Jetpack keys purchases by ID; the store calls it subscription_id.
			if ( ! isset( $purchase->ID ) && isset( $purchase->subscription_id ) ) {
				$purchase->ID = $purchase->subscription_id;
			}
			// Read by the plan-expiry red bubble. Absent locally, so default rather than warn.
			if ( ! isset( $purchase->product_name ) ) {
				$purchase->product_name = $purchase->product_slug ?? '';
			}
			if ( ! isset( $purchase->expiry_message ) ) {
				$purchase->expiry_message = '';
			}

			return $purchase;
		},
		$local
	);
}

/**
 * Serve the site's purchases from the local store.
 *
 * @param null|array|WP_Error $purchases Purchases, or null to fetch them from WordPress.com.
 * @return null|array|WP_Error
 */
function wpcom_my_jetpack_site_purchases( $purchases ) {
	if ( ! wpcom_my_jetpack_can_serve_data_locally() || ! function_exists( 'wpcom_get_site_purchases' ) ) {
		return $purchases;
	}

	$local = wpcom_get_site_purchases( get_current_blog_id() );
	if ( ! is_array( $local ) ) {
		return $purchases;
	}

	return wpcom_my_jetpack_normalize_purchases( $local );
}

/**
 * Serve the site's current plan from the local store.
 *
 * My Jetpack reads two things off this array: ['product_slug'] and ['features']['active'].
 *
 * @param null|array $plan   The current plan, or null to read it from Current_Plan.
 * @param bool       $reload Whether a refresh from WordPress.com was requested. Irrelevant locally.
 * @return null|array
 */
function wpcom_my_jetpack_site_current_plan( $plan, $reload = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( ! wpcom_my_jetpack_can_serve_data_locally() || ! class_exists( '\WPCOM_Store_API' ) ) {
		return $plan;
	}

	$current = \WPCOM_Store_API::get_current_plan( get_current_blog_id() );
	if ( ! is_array( $current ) ) {
		return $plan;
	}

	$features = wpcom_my_jetpack_site_features( null );

	$current['features'] = array(
		'active' => is_array( $features ) ? ( $features['active'] ?? array() ) : array(),
	);

	return $current;
}

/**
 * Reshape the local products catalog into what My Jetpack expects.
 *
 * The store returns a map of product_slug => associative array. My Jetpack reads products as objects
 * ( $products->$slug->cost ), so both levels are cast.
 *
 * @param array $products Catalog as returned by the local store.
 * @return object
 */
function wpcom_my_jetpack_normalize_catalog( array $products ) {
	$catalog = new stdClass();
	foreach ( $products as $slug => $product ) {
		$catalog->$slug = (object) $product;
	}

	return $catalog;
}

/**
 * Serve the Jetpack products catalog from the local store.
 *
 * The get_product_price_list() helper is the same code that backs the /sites/%d/products endpoint.
 *
 * @param null|object|WP_Error $catalog    The products catalog, or null to fetch it from WordPress.com.
 * @param bool                 $skip_cache Whether the caller asked to bypass the cache.
 * @return null|object|WP_Error
 */
function wpcom_my_jetpack_products_catalog( $catalog, $skip_cache = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( ! wpcom_my_jetpack_can_serve_data_locally() || ! function_exists( 'get_product_price_list' ) || ! class_exists( '\WPCOM_Store' ) ) {
		return $catalog;
	}

	$currency = \WPCOM_Store::get_user_currency( get_current_user_id(), true, true );
	$products = get_product_price_list( $currency, get_current_blog_id(), 'jetpack' );
	if ( ! is_array( $products ) ) {
		return $catalog;
	}

	return wpcom_my_jetpack_normalize_catalog( $products );
}

/**
 * Serve the site info from local options.
 *
 * My Jetpack reads exactly one thing from this blob - $site_info->options->is_commercial, via
 * Initializer::is_commercial_site() - so we supply that rather than rebuild the whole /sites/%d
 * response. It comes from the same option the SAL site blob reads.
 *
 * @param null|object|WP_Error $site_info Site info, or null to fetch it from WordPress.com.
 * @return null|object|WP_Error
 */
function wpcom_my_jetpack_site_info( $site_info ) {
	if ( ! wpcom_my_jetpack_can_serve_data_locally() ) {
		return $site_info;
	}

	$is_commercial = get_option( '_jetpack_site_is_commercial', null );

	return (object) array(
		'ID'      => get_current_blog_id(),
		'options' => (object) array(
			'is_commercial' => $is_commercial === null ? null : (bool) $is_commercial,
		),
	);
}

add_filter( 'my_jetpack_site_features', 'wpcom_my_jetpack_site_features' );
add_filter( 'my_jetpack_site_purchases', 'wpcom_my_jetpack_site_purchases' );
add_filter( 'my_jetpack_site_current_plan', 'wpcom_my_jetpack_site_current_plan', 10, 2 );
add_filter( 'my_jetpack_products_catalog', 'wpcom_my_jetpack_products_catalog', 10, 2 );
add_filter( 'my_jetpack_site_info', 'wpcom_my_jetpack_site_info' );
