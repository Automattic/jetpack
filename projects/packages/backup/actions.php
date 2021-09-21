<?php
/**
 * Action Hooks for Jetpack Backup module.
 *
 * @package automattic/jetpack-backup
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

// Clean up expired Helper Scripts from a scheduled event.
add_action( 'jetpack_backup_cleanup_helper_scripts', array( 'Automattic\\Jetpack\\Backup\\Helper_Script_Manager', 'cleanup_expired_helper_scripts' ) );

// Register REST routes.
add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Backup\\REST_Controller', 'register_rest_routes' ) );

// Set up package version hook.
add_filter( 'jetpack_package_versions', 'Automattic\\Jetpack\\Backup\\Package_Version::send_package_version_to_tracker' );
