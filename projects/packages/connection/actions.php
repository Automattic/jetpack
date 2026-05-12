<?php
/**
 * Action Hooks for Jetpack connection assets.
 *
 * @package automattic/jetpack-connection
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action(
		'plugins_loaded',
		array( Automattic\Jetpack\Connection\Connection_Assets::class, 'configure' ),
		1
	);

	// Register Connection abilities with the WordPress Abilities API once every
	// connection-consuming plugin (jetpack, boost, social, search, protect,
	// backup, etc.) has had a chance to load. The Registrar gates registration
	// on the `jetpack_wp_abilities_enabled` filter (default false), so this is
	// a no-op until a site explicitly opts in to abilities.
	add_action(
		'plugins_loaded',
		static function () {
			if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
				return;
			}
			\Automattic\Jetpack\Connection\Abilities\Connection_Abilities::init();
		},
		20
	);
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Connection\Connection_Assets::class, 'configure' ),
	);
}
