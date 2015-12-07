<?php

add_action( 'rest_api_init', 'jetpack_core_json_api_init' );
function jetpack_core_json_api_init() {

	register_rest_route( 'jetpack/v4', '/modules', array(
		'methods' => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::get_modules',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

	register_rest_route( 'jetpack/v4', '/modules/(?P<slug>[a-z\-]+)', array(
		'methods' => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::get_module',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

}

class Jetpack_Core_Json_Api_Endpoints {

	public static function get_modules() {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );
		return Jetpack_Admin::init()->get_modules();
	}

	public static function get_module( $data ) {
		$modules = Jetpack::get_available_modules();
		if ( in_array( $data['slug'], $modules ) ) {
			return Jetpack::get_module( $data['slug'] );
		}

		return new WP_Error( 'not-found', __( 'The requested Jetpack module was not found.' ), array( 'status' => 404 ) );
	}

	public static function manage_modules_permission_check() {
		return current_user_can( 'jetpack_manage_modules' );
	}

}

