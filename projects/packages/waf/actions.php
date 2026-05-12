<?php
/**
 * Action hooks for the Jetpack WAF package.
 *
 * Loaded via Composer's autoload.files so this fires in any plugin that
 * autoloads the WAF package — currently both Jetpack and Jetpack Protect.
 *
 * @package automattic/jetpack-waf
 */

// Register WP Abilities for the WAF on `plugins_loaded` so the gate filter
// can be applied by callers (plugin bootstraps, mu-plugins, site filters)
// before the Registrar checks it. Priority 20 keeps us after the bootstraps
// that wire the filter.
//
// When WordPress hasn't booted yet (e.g. autoloader fires before the plugin
// API is loaded), drop the callback into $wp_filter directly so
// WP_Hook::build_preinitialized_hooks() picks it up once WP initializes.
$jetpack_waf_register_abilities = static function () {
	if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
		return;
	}
	\Automattic\Jetpack\Waf\Abilities\Waf_Abilities::init();
};

if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', $jetpack_waf_register_abilities, 20 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Pre-initialization pattern; consumed by WP_Hook::build_preinitialized_hooks().
	$wp_filter['plugins_loaded'][20][] = array(
		'accepted_args' => 0,
		'function'      => $jetpack_waf_register_abilities,
	);
}

unset( $jetpack_waf_register_abilities );
