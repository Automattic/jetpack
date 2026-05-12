<?php
/**
 * Action Hooks for the Jetpack VideoPress package.
 *
 * Registers VideoPress abilities with the WordPress Abilities API once the
 * `jetpack_wp_abilities_enabled` filter opts in. The registration runs on
 * `plugins_loaded` at priority 20 so the host plugin's bootstrap has already
 * loaded its filters by the time the Registrar checks the gate.
 *
 * Loaded via composer.json `autoload.files`, so every consumer of the
 * jetpack-videopress package (the Jetpack plugin, the standalone VideoPress
 * plugin, mu-wpcom-plugin) wires the abilities through a single code path.
 *
 * @package automattic/jetpack-videopress
 */

$register_videopress_abilities = static function () {
	if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
		return;
	}
	if ( ! class_exists( \Automattic\Jetpack\VideoPress\Abilities\VideoPress_Abilities::class ) ) {
		return;
	}
	\Automattic\Jetpack\VideoPress\Abilities\VideoPress_Abilities::init();
};

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', $register_videopress_abilities, 20 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][20][] = array(
		'accepted_args' => 0,
		'function'      => $register_videopress_abilities,
	);
}
