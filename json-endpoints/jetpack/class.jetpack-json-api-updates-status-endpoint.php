<?php

class Jetpack_JSON_API_Updates_Status extends Jetpack_JSON_API_Endpoint {

	// GET /sites/%s/updates
	public function callback( $path = '', $_blog_id = 0 ) {

		$error = $this->validate_call( $_blog_id, array(
			'must_pass'    => 1, // must meet at least one condition
			'capabilities' => array(
				'update_plugins',
				'update_themes',
				'update_core'
			)
		), false );

		if ( is_wp_error( $error ) ) {
			return $error;
		}
		// pass an option to do it conditional;
		wp_update_themes();

		$update_data = wp_get_update_data();
		if ( !  isset( $update_data['counts'] ) ) {
			return new WP_Error( 'get_update_data_error', __( 'There was an error while getting the update data for this site.', 'jetpack' ), 500 );
		}

		$result = $update_data['counts'];

		include( ABSPATH . WPINC . '/version.php' ); // $wp_version;
		$result['wp_version'] = isset( $wp_version ) ? $wp_version : null;
		$result['jp_version'] = JETPACK__VERSION;

		return $result;

	}
}
