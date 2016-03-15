<?php

class Jetpack_Sync_Functions {

	static $functions = array(
		'wp_version'                   => array( 'Jetpack', 'get_wp_version' ),
		'wp_max_upload_size'           => 'wp_max_upload_size',
		'featured_images_enabled'      => array( 'Jetpack', 'featured_images_enabled' ),
		'updates'                      => array( 'Jetpack', 'get_updates' ),
		'update_details'               => array( 'Jetpack', 'get_update_details' ),
		'is_main_network'              => array( 'Jetpack', 'is_multi_network' ),
		'is_multi_site'                => 'is_multisite',
		'main_network_site'            => 'network_site_url',
		'single_user_site'             => array( 'Jetpack', 'is_single_user_site' ),
		'has_file_system_write_access' => array( 'Jetpack', 'file_system_write_access' ),
		'is_version_controlled'        => array( 'Jetpack', 'is_version_controlled' ),
		'content_width'                => array( 'Jetpack', 'get_content_width' ),
	);

	static $multi_site_functions = array(
		'network_name'                        => array( 'Jetpack', 'network_name' ),
		'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
		'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
		'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
		'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
		'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
	);

	static $to_sync = array();

	static $check_sum_id = 'function_check_sum';

	static function init() {
		if ( is_multisite() ) {
			self::$functions = array_merge( self::$functions, self::$multi_site_functions );
		}
		self::$to_sync = array_keys( self::$functions );
	}

	static function get_functions() {
		if ( is_multisite() ) {
			return array_merge( self::$functions, self::$multi_site_functions );
		}

		return self::$functions;
	}

	static function get( $key ) {
		if ( is_callable( self::$functions[ $key ] ) ) {
			return call_user_func( self::$functions[ $key ] );
		}

		return null;
	}

	static function get_all() {
		return array_combine( self::$to_sync, array_map( array( __CLASS__, 'get' ), self::$to_sync ) );
	}
}
