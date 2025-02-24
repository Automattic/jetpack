<?php
/**
 * Plugin Name: Bypass Circular Refs During Core Update
 * Description: Some of our packages have circular refs for testing purposes, which makes the core upgrader choke. This removes the problematic call to `_upgrade_422_remove_genericons()`.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

/**
 * Remove problematic call to `_upgrade_422_remove_genericons()` from `wp-admin/includes/update-core.php`. That call
 * recursively searches all directories for genericons files, which results in a circular reference loop for some
 * of our projects.
 *
 * Unfortunately there's no direct filter in the upgrade routine, but it happens to call `wp_opcache_invalidate()` just
 * before requiring the file, which has a filter we're able to hijack.
 *
 * @param boolean $will_invalidate Whether to invalidate the file.
 * @param string  $filepath Path to file to invalidate.
 *
 * @return true
 */
function jetpack_bypass_circular_refs_during_core_update( $will_invalidate, $filepath ) {
	if ( $filepath === ABSPATH . 'wp-admin/includes/update-core.php' ) {
		$file_contents = file_get_contents( $filepath );
		$file_contents = str_replace( '_upgrade_422_remove_genericons();', '// _upgrade_422_remove_genericons();', $file_contents );
		file_put_contents( $filepath, $file_contents );
	}
	return true;
}
add_filter( 'wp_opcache_invalidate_file', 'jetpack_bypass_circular_refs_during_core_update', 10, 2 );
