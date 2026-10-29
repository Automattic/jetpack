<?php
/**
 * Stands in for WordPress.com's log_upload(), which copies a file to file storage.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'log_upload' ) ) {
	/**
	 * Records each call in $GLOBALS['jetpack_wpcom_ai_marker_log_uploads'].
	 *
	 * @param array $file              The file's path and type.
	 * @param bool  $update_disk_usage Whether to add the file to the site's disk usage.
	 * @return array
	 */
	function log_upload( $file, $update_disk_usage = true ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		$GLOBALS['jetpack_wpcom_ai_marker_log_uploads'][] = array( $file, $update_disk_usage );

		return $file;
	}
}
