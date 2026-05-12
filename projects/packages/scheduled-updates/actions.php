<?php
/**
 * Action Hooks for the Jetpack Scheduled Updates package.
 *
 * @package automattic/scheduled-updates
 */

// If WordPress's plugin API is available already, use it. If not, drop the
// callback into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
//
// Why the guarded pattern: composer's autoload.files runs BEFORE WP loads
// `add_action`, so an unguarded `add_action()` call would fatal at autoload
// time on environments where the package is loaded early (e.g. inside MU
// plugins). See `projects/packages/publicize/actions.php` for the canonical
// guard.
if ( function_exists( 'add_action' ) ) {
	$add_action = 'add_action';
} else {
	$add_action = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
}

// Register Scheduled Updates abilities with the WordPress Abilities API once
// every consumer plugin (jetpack, jetpack-mu-wpcom, etc.) has had a chance to
// load. The Registrar gates registration on the `jetpack_wp_abilities_enabled`
// filter (default false), so this is a no-op until a site explicitly opts in
// to abilities — we additionally pre-check the filter here so the class file
// stays lazy-loaded when the gate is closed.
$add_action(
	'plugins_loaded',
	static function () {
		if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
			return;
		}
		if ( ! class_exists( \Automattic\Jetpack\Scheduled_Updates\Abilities\Scheduled_Updates_Abilities::class ) ) {
			return;
		}
		\Automattic\Jetpack\Scheduled_Updates\Abilities\Scheduled_Updates_Abilities::init();
	},
	20
);
