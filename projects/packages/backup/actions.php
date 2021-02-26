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
