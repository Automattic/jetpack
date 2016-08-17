<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Activate_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * List of modules that require WPCOM public access.
	 *
	 * @since 4.3
	 *
	 * @var array
	 */
	private $modules_requiring_public = array(
		'photon',
		'enhanced-distribution',
		'json-api',
	);

	/**
	 * Check if the module requires the site to be publicly accessible from WPCOM.
	 * If the site meets this requirement, the module is activated. Otherwise an error is returned.
	 *
	 * @since 4.3
	 *
	 * @param array $data
	 *
	 * @return bool|WP_Error
	 */
	public function process( $data ) {
		if (
			! in_array( $data['slug'], $this->modules_requiring_public )
			|| $this->is_site_public()
		) {
			return Jetpack::activate_module( $data['slug'], false, false );
		}
		return new WP_Error(
			'rest_cannot_publish',
			esc_html__( 'This module requires your site to be set to publicly accessible.', 'jetpack' ),
			array( 'status' => 424 ) );
	}

	/**
	 * Check that the current user has permissions to manage Jetpack modules.
	 *
	 * @since 4.3
	 *
	 * @return bool
	 */
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