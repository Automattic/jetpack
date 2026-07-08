<?php
/**
 * Action Hooks for Jetpack Backup module.
 *
 * @package automattic/jetpack-backup
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_filter' ) ) {
	$add_filter = 'add_filter';
	$add_action = 'add_action';
} else {
	$add_filter = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
	$add_action = $add_filter;
}

// Clean up expired Helper Scripts from a scheduled event.
$add_action( 'jetpack_backup_cleanup_helper_scripts', array( 'Automattic\\Jetpack\\Backup\\V0005\\Helper_Script_Manager', 'cleanup_expired_helper_scripts' ) );

// Register REST routes.
$add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Backup\\V0005\\REST_Controller', 'register_rest_routes' ) );

// Set up package version hook.
$add_filter( 'jetpack_package_versions', 'Automattic\\Jetpack\\Backup\\Package_Version::send_package_version_to_tracker' );

// Register Jetpack Backup abilities with the WordPress Abilities API at autoload
// time so the surface is available in any consumer that loads this package
// (both the standalone Jetpack Backup plugin and the Jetpack plugin). The
// `jetpack_wp_abilities_enabled` filter (default false) gates registration,
// so this is a no-op until a site opts in.
$add_action(
	'plugins_loaded',
	static function () {
		if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
			return;
		}
		if ( ! class_exists( \Automattic\Jetpack\Backup\V0005\Abilities\Backup_Abilities::class ) ) {
			return;
		}
		\Automattic\Jetpack\Backup\V0005\Abilities\Backup_Abilities::init();
	},
	20
);
