<?php

class Jetpack_Sync_Functions {

	static $check_sum_id = 'function_check_sum';

	static function get_all() {
		$data['wp_max_upload_size']           = wp_max_upload_size();
		$data['is_main_network']              = Jetpack::is_multi_network();
		$data['is_multi_site']                = is_multisite();
		$data['main_network_site']            = network_site_url();
		$data['single_user_site']             = Jetpack::is_single_user_site();
		$data['has_file_system_write_access'] = self::file_system_write_access();
		$data['is_version_controlled']        = self::is_version_controlled();
		$data['modules']                      = self::get_modules();
		if ( is_multisite() ) {
			$data['network_name']                        = Jetpack::network_name();
			$data['network_allow_new_registrations']     = Jetpack::network_allow_new_registrations();
			$data['network_add_new_users']               = Jetpack::network_add_new_users();
			$data['network_site_upload_space']           = Jetpack::network_site_upload_space();
			$data['network_upload_file_types']           = Jetpack::network_upload_file_types();
			$data['network_enable_administration_menus'] = Jetpack::network_enable_administration_menus();
		}
		return $data;
	}

	static protected function get_modules() {
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

		if ( !class_exists( 'WP_Automatic_Updater' ) ) {
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