<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Activate_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	private $modules_requiring_public = array(
		'sitemaps',
		'photon',
		'enhanced-distribution',
		'sharedaddy',
		'json-api',
	);

	public function process( $data ) {
		if (
			! in_array( $data['slug'], $this->modules_requiring_public )
			|| $this->is_site_public()
		) {
			return Jetpack::activate_module( $data['slug'], false, false );
		}
		return new WP_Error(
			'rest_cannot_publish',
			__( 'This module requires your site to be set to publicly accessible.', 'jetpack' ),
			array( 'status' => 404 ) );
	}

	public function can_write() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}

class Jetpack_Core_API_Module_Endpoint {

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.1.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public function process( $data ) {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );

		$modules = Jetpack_Admin::init()->get_modules();
		foreach ( $modules as $slug => $properties ) {
			$modules[ $slug ]['options'] =
				Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $slug );
			if (
				isset( $modules[ $slug ]['requires_connection'] )
				&& $modules[ $slug ]['requires_connection']
				&& Jetpack::is_development_mode()
			) {
				$modules[ $slug ]['activated'] = false;
			}
		}

		return $modules;
	}

	public function can_read() {
		return current_user_can( 'jetpack_admin_page' );
	}
}

class Jetpack_Core_API_Module_Get_Endpoint {

	/**
	 * Get information about a specific and valid Jetpack module.
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return mixed|void|WP_Error
	 */
	public static function process( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {

			$module = Jetpack::get_module( $data['slug'] );

			$module['options'] = Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $data['slug'] );

			if (
				isset( $module['requires_connection'] )
				&& $module['requires_connection']
				&& Jetpack::is_development_mode()
			) {
				$module['activated'] = false;
			}

			return $module;
		}

		return new WP_Error(
			'not_found',
			esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	public function can_read() {
		return current_user_can( 'jetpack_admin_page' );
	}
}