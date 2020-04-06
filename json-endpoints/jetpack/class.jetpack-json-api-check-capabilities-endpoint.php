<?php

class Jetpack_JSON_API_Check_Capabilities_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// GET /sites/%s/me/capability
	// The unused $object parameter is for making the method signature compatible with its parent class method.
	public function callback( $path = '', $_blog_id = 0, $object = null ) {
		// Check minimum capability and blog membership first
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'read', false ) ) ) {
			return $error;
		}

		$args = $this->input();

		if ( ! isset( $args['capability'] ) || empty( $args['capability'] ) ) {
			return new WP_Error( 'missing_capability', __( 'You are required to specify a capability to check.', 'jetpack' ), 400 );
		}

		$capability = $args['capability'];
		if ( is_array( $capability ) ) {
			$results = array_map( 'current_user_can', $capability );
			return array_combine( $capability, $results );
		} else {
			return current_user_can( $capability );
		}
	}
}
