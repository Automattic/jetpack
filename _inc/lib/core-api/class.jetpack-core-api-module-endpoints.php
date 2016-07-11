<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Activate_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	private $modules_requiring_public = array( 'sitemaps', 'photon', 'enhanced-distribution', 'sharedaddy' );

	public function process( $data ) {
		if (
			! in_array( $data['slug'], $this->modules_requiring_public )
			|| $this->is_site_public()
		) {
			return Jetpack::activate_module( $data['slug'], false, false );
		}
		return new WP_Error(
			'rest_cannot_publish',
			__( 'This module requires your site to be set to publicly accessible.' ),
			array( 'status' => 404 ) );
	}

	public function can_write() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}