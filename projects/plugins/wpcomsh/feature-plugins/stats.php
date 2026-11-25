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
 * Offers the Upgrade to Parse.ly prompts, so eligible Atomic sites see them.
 *
 * Needs no guard against an older Jetpack, unlike the retirement above: with no promo registered the slot
 * offers nothing, so this can ship before the Jetpack carrying the prompts reaches the platform.
 *
 * At file scope, and priority 5, for the reasons given above.
 *
 * @param bool   $enabled Whether the flag is enabled.
 * @param string $name    Feature flag name.
 * @return bool
 */
function wpcomsh_offer_parsely_prompts( $enabled, $name ) {
	return 'jetpack-stats-parsely-prompts' === $name ? true : $enabled;
}
add_filter( 'jetpack_feature_flag_enabled', 'wpcomsh_offer_parsely_prompts', 5, 2 );
