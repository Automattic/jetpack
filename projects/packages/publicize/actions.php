<?php
/**
 * Action Hooks for Jetpack Publicize module.
 *
 * @package automattic/jetpack-publicize
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', array( Automattic\Jetpack\Publicize\Publicize_Setup::class, 'pre_initialization' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Publicize\Publicize_Setup::class, 'pre_initialization' ),
	);
}

// Register Jetpack Social abilities once `plugins_loaded` fires. The
// `jetpack_wp_abilities_enabled` filter (default false) keeps this a no-op
// until a site opts in.
if ( function_exists( 'add_action' ) ) {
	add_action(
		'plugins_loaded',
		static function () {
			if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
				return;
			}
			if ( ! class_exists( Automattic\Jetpack\Publicize\Abilities\Social_Abilities::class ) ) {
				return;
			}
			Automattic\Jetpack\Publicize\Abilities\Social_Abilities::init();
		},
		20
	);
}
