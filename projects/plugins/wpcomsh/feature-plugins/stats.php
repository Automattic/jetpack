<?php
/**
 * Jetpack Stats.
 *
 * @package wpcomsh
 */

/**
 * Extends the default value for which roles can access the Stats menu item.
 *
 * This enables the `view_stats` capability to work with all roles that are available on Simple sites.
 *
 * @see https://github.com/Automattic/jetpack/pull/33255
 * @see Automattic\Jetpack\Stats\Options::get_defaults()
 *
 * @param array $default_value The default value for stats options.
 * @return array
 */
function wpcomsh_extend_stats_menu_item_access( $default_value ) {
	if ( is_array( $default_value ) ) {
		$default_value['roles'] = array( 'administrator', 'editor', 'author', 'contributor' );
	}

	return $default_value;
}
add_filter( 'default_option_stats_options', 'wpcomsh_extend_stats_menu_item_access' );

/**
 * Turns on the classic Stats page retirement, so Atomic sites open only Stats v2.
 *
 * At file scope because Jetpack resolves the flag on `plugins_loaded`. Priority 5 leaves the last word to the
 * a8c Feature Flags screen's per-site override at 10, which a `jetpack_feature_flag_enabled_{flag}` filter would beat.
 *
 * @param bool   $enabled Whether the flag is enabled.
 * @param string $name    Feature flag name.
 * @return bool
 */
function wpcomsh_retire_classic_stats( $enabled, $name ) {
	if ( 'jetpack-stats-classic-page-retired' !== $name ) {
		return $enabled;
	}

	// Jetpack updates apart from wpcomsh; before it lists Stats v2 in Calypso's menu, retiring would drop Stats from there.
	// @phan-suppress-next-line PhanUndeclaredClassReference -- Premium Analytics ships with the Jetpack plugin, not wpcomsh.
	return method_exists( 'Automattic\Jetpack\PremiumAnalytics\Analytics', 'register_replayed_admin_menu' ) ? true : $enabled;
}
add_filter( 'jetpack_feature_flag_enabled', 'wpcomsh_retire_classic_stats', 5, 2 );

/**
 * Turns on WooCommerce Stats, which Jetpack ships off, so Atomic stores keep the WooCommerce tab in Stats.
 *
 * Priority 5 for the same reason as the classic Stats retirement above.
 *
 * @param bool   $enabled Whether the flag is enabled.
 * @param string $name    Feature flag name.
 * @return bool
 */
function wpcomsh_enable_woocommerce_stats( $enabled, $name ) {
	return 'jetpack-woocommerce-stats' === $name ? true : $enabled;
}
add_filter( 'jetpack_feature_flag_enabled', 'wpcomsh_enable_woocommerce_stats', 5, 2 );

/**
 * Turns on WooCommerce Analytics proxy tracking while Stats v2 runs.
 *
 * Asked when the filter is read rather than at file scope, because Jetpack loads after wpcomsh.
 *
 * @param bool $enabled Whether proxy tracking is enabled.
 * @return bool
 */
function wpcomsh_enable_woocommerce_analytics_proxy_tracking( $enabled ) {
	$analytics = 'Automattic\Jetpack\PremiumAnalytics\Analytics';

	return $enabled || ( is_callable( array( $analytics, 'is_initialized' ) ) && $analytics::is_initialized() );
}
add_filter( 'woocommerce_analytics_experimental_proxy_tracking_enabled', 'wpcomsh_enable_woocommerce_analytics_proxy_tracking' );
