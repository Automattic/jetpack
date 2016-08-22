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
			__( 'This module requires your site to be set to publicly accessible.', 'jetpack' ),
			array( 'status' => 404 ) );
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