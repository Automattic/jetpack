<?php

class Jetpack_JSON_API_Updates_Status extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/updates
	protected $needed_capabilities = 'manage_options';

	protected function result() {

		// pass an option to do it conditional;
		wp_update_themes();

		$update_data = wp_get_update_data();
		if ( !  isset( $update_data['counts'] ) ) {
			return new WP_Error( 'get_update_data_error', __( 'There was an error while getting the update data for this site.', 'jetpack' ), 500 );
		}

		$result = $update_data['counts'];

		include( ABSPATH . WPINC . '/version.php' ); // $wp_version;
		$result['wp_version'] = isset( $wp_version ) ? $wp_version : null;

		if ( ! empty( $result['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && $cur->response === 'upgrade' ) {
				$result['wp_update_version'] = $cur->current;
			}
		}

		$result['jp_version'] = JETPACK__VERSION;

		return $result;

	}
}
