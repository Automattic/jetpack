<?php

class Jetpack_JSON_API_Modules_List_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// GET /sites/%s/jetpack/modules
	public function callback( $path = '', $_blog_id = 0 ) {

		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'jetpack_manage_modules', false ) ) ) {
			return $error;
		}

		$modules = Jetpack::get_available_modules();

		$response = array();
		$response[ 'found' ] = count( $modules );

		foreach ( $modules as $module_slug ) {
			$response['modules'][] = self::format_module( $module_slug );
		}

		return $response;
	}
}
