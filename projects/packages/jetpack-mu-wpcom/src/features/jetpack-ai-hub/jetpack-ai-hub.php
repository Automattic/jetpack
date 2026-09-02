<?php
/**
 * WordPress.com Simple integration for the Jetpack AI Hub.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;

/**
 * Point the upstream Hub at WordPress.com's native site-scoped MCP API and
 * supply the Simple answers for the host-specific configuration.
 *
 * @param array $config Upstream AI Hub host configuration.
 * @return array WordPress.com Simple configuration.
 */
function configure( $config ) {
	$blog_id = get_current_blog_id();

	// On Simple the jetpack_mu_wpcom_load_jetpack_ai_hub filter is the gate:
	// when the Hub is deliberately loaded here, every view shows. No second
	// predicate — turning Simple on stays exactly one filter flip.
	$config['showGatedViews'] = true;
	// Host-opened, not internal-gated: no "A12s only" badge on the tabs.
	$config['gatedViewsBadge'] = false;
	// Simple users are WordPress.com users by construction, so the usage
	// endpoint can always proxy as the current user.
	$config['isUserConnected'] = true;
	// The Overview plan card — get_plan_info() says why Simple answers it.
	$config['planInfo']       = get_plan_info();
	$config['mcpSettingsApi'] = array(
		'path'   => '/wpcom/v2/sites/' . $blog_id . '/mcp-abilities',
		'format' => 'wpcom',
	);

	return $config;
}

/**
 * Name, renewal date, and auto-renew state of the site's WordPress.com plan,
 * for the Hub's Overview plan card.
 *
 * Answered from the WordPress.com store — the site's plan purchase, named
 * via the product list — because My Jetpack's purchase lookup signs a
 * blog-token request Simple sites cannot make. All-or-nothing like upstream:
 * a plan that cannot be named reports the empty shape.
 *
 * @return array{name: string, renews_on: string, auto_renew: bool}
 */
function get_plan_info() {
	$info = array(
		'name'       => '',
		'renews_on'  => '',
		'auto_renew' => true,
	);

	if ( ! function_exists( 'wpcom_get_site_purchases' ) || ! class_exists( '\Store_Product_List' ) ) {
		return $info;
	}

	// The store returns active subscriptions only; the expiry-notices picker
	// selects the latest-expiring plan row if several are active at once.
	$plan = Expiry_Data::pick_primary_plan_purchase( wpcom_get_site_purchases() );
	if ( ! is_object( $plan ) ) {
		return $info;
	}

	$name = \Store_Product_List::get_from_cache()[ (int) ( $plan->product_id ?? 0 ) ]['product_name'] ?? '';
	if ( ! is_string( $name ) || '' === $name ) {
		return $info;
	}

	// Raw store name; the Hub page trims the brand prefixes in one place.
	$info['name'] = $name;
	// Always an ISO8601 string: the store normalizer rewrites empty and
	// '0000-00-00' (never-expiring) expiries before they reach purchases.
	$info['renews_on'] = (string) ( $plan->expiry_date ?? '' );
	// Absent means unknown, not off — and Simple store rows historically carry
	// the flag as user_allows_auto_renew, with auto_renew as its alias.
	$info['auto_renew'] = (bool) ( $plan->user_allows_auto_renew ?? $plan->auto_renew ?? true );

	return $info;
}

// Scheduled tasks are a WordPress.com-backed experience and should be visible
// whenever the AI Hub integration is loaded on Simple sites.
add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

/**
 * Register the upstream AI Hub page on WordPress.com Simple.
 */
function register() {
	if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
		return;
	}

	$page_path = JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';
	if ( ! file_exists( $page_path ) ) {
		return;
	}

	require_once $page_path;
	// @phan-suppress-next-line PhanUndeclaredClassReference -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	if ( ! class_exists( '\Jetpack_AI_Page' ) || ! method_exists( '\Jetpack_AI_Page', 'add_actions' ) ) {
		return;
	}

	add_filter( 'jetpack_ai_admin_config', __NAMESPACE__ . '\\configure' );

	// @phan-suppress-next-line PhanUndeclaredClassMethod -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	$page = new \Jetpack_AI_Page();
	// @phan-suppress-next-line PhanUndeclaredClassInCallable -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	add_action( 'admin_menu', array( $page, 'add_actions' ), 998 );
}

register();
