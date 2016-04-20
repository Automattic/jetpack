<?php

/*
 * Utility functions to generate data synced to wpcom
 */

class Jetpack_Sync_Functions {

	public static function get_modules() {
		$modules = array();
		$active_modules = Jetpack::get_active_modules();
		foreach ( Jetpack::get_available_modules() as $available_module ) {
			$modules[ $available_module ] = in_array( $available_module, $active_modules );
		}
		$modules['vaultpress'] = class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' );
		return $modules;
	}

	/**
	 * Finds out if a site is using a version control system.
	 * @return string ( '1' | '0' )
	 **/
	public static function is_version_controlled() {

		if ( ! class_exists( 'WP_Automatic_Updater' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		}
		$updater = new WP_Automatic_Updater();
		$is_version_controlled = strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
		// transients should not be empty
		if ( empty( $is_version_controlled ) ) {
			$is_version_controlled = '0';
		}
		return $is_version_controlled;
	}

	/**
	 * Returns true if the site has file write access false otherwise.
	 * @return string ( '1' | '0' )
	 **/
	public static function file_system_write_access() {
		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/file.php' );
		}

		require_once( ABSPATH . 'wp-admin/includes/template.php' );

		$filesystem_method = get_filesystem_method();
		if ( $filesystem_method === 'direct' ) {
			return 1;
		}

		ob_start();
		$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
		ob_end_clean();
		if ( $filesystem_credentials_are_stored ) {
			return 1;
		}
		return 0;
	}
}