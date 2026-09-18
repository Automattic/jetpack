<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Universal.Files.SeparateFunctionsFromOO.Mixed -- Test stub for the wpcom globals, which are a class and a function.
/**
 * Stands in for WordPress.com's site feature lookup. Tests list the site's features in a global.
 *
 * @package automattic/jetpack-backup
 */

if ( ! class_exists( 'WPCOM_Features' ) ) {
	/**
	 * Only the one feature the Backup entitlement reads.
	 */
	class WPCOM_Features {
		const BACKUPS_SELF_SERVE = 'backups-self-serve';
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * @param string $feature The feature name.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return in_array( $feature, $GLOBALS['jetpack_backup_test_site_features'] ?? array(), true );
	}
}
