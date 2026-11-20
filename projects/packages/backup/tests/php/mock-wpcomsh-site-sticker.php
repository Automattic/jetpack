<?php
/**
 * Stands in for wpcomsh's Atomic sticker reader. Tests list the active stickers in a global.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
	/**
	 * @param string $sticker_name The sticker name.
	 * @return bool
	 */
	function wpcomsh_is_site_sticker_active( $sticker_name ) {
		return in_array( $sticker_name, $GLOBALS['jetpack_backup_test_site_stickers'] ?? array(), true );
	}
}
