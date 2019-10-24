<?php
/**
 * Action Hooks for Jetpack Backup module.
 *
 * @package automattic/jetpack-backup
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Cleanup Helper Scripts from a scheduled event after installing them.
 */
function jetpack_backup_cleanup_helper_scripts() {
	Automattic\Jetpack\Backup\Helper_Script_Manager::cleanup_expired_helper_scripts();
}
add_action( 'jetpack_backup_cleanup_helper_scripts', 'jetpack_backup_cleanup_helper_scripts' );
