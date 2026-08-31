<?php
/**
 * WordPress.com Simple integration for the Jetpack AI Hub.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

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
	// Simple users are WordPress.com users by construction, so the usage
	// endpoint can always proxy as the current user.
	$config['isUserConnected'] = true;
	// The Overview plan card, answered the WordPress.com-native way — the
	// upstream My Jetpack purchase lookup cannot run on Simple.
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
 * Answered from the WordPress.com store — the site's `bundle` purchase,
 * named via the product list — because My Jetpack's purchase lookup signs a
 * blog-token request Simple sites cannot make.
 *
 * @return array{name: string, renews_on: string, auto_renew: bool}
 */
function get_plan_info() {
	$info = array(
		'name'       => '',
		'renews_on'  => '',
		'auto_renew' => true,
	);

	if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
		return $info;
	}

	$bundles = wp_list_filter( wpcom_get_site_purchases(), array( 'product_type' => 'bundle' ) );
	$plan    = array_pop( $bundles );
	if ( ! is_object( $plan ) ) {
		return $info;
	}

	$info['renews_on'] = (string) ( $plan->expiry_date ?? '' );
	// Absent means unknown, not off: only a purchase that positively reports
	// auto-renew off should relabel the renewal date as an expiry.
	$info['auto_renew'] = (bool) ( $plan->auto_renew ?? true );

	if ( class_exists( '\Store_Product_List' ) ) {
		$products = \Store_Product_List::get_from_cache();
		$name     = $products[ (int) $plan->product_id ]['product_name'] ?? '';
		// The card shows the bare plan name ("Business"), matching the
		// upstream page's own trim of the store's brand prefixes.
		$info['name'] = (string) preg_replace( '/^(Jetpack|WordPress\.com) /', '', (string) $name );
	}

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
