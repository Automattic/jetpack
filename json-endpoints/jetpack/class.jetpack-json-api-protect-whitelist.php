<?php

class Jetpack_JSON_API_Protect_Whitelist extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'activate_plugins';
	protected $whitelist;

	public function callback( $path = '', $blog_id = 0, $object = null ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities ) ) ) {
			return $error;
		}

		$this->whitelist = get_site_option( 'jetpack_protect_whitelist', false );

		if ( $this->method == 'POST' ) {
			return $this->validate_input( $object );
		}
		return $this->result();
	}

	protected function validate_input( $object ) {
		$args = $this->input();
		if ( ! isset( $args['whitelist'] ) || ! isset( $args['global'] ) ) {
			return new WP_Error( 'invalid_arguments', __( 'Invalid arguments', 'jetpack' ));
		}

		$ips_are_valid = true;
		// TODO: add IP Address validation
		if ( ! $ips_are_valid ) {
			return new WP_Error( 'invalid_ip_address', __( 'One or more of you IP Addresses are not valid', 'jetpack' ));
		}

		global $current_user;


		if( false === $args['global'] ) {
			$this->whitelist[ $current_user->ID ]['local'] = $args['whitelist'];
		} else {
			$this->whitelist[ $current_user->ID ]['global'] = $args['whitelist'];
		}

		update_site_option( 'jetpack_protect_whitelist', $this->whitelist );
		return $this->result();
	}

	public function result() {
		$whitelist = array(
			'whitelist' => $this->whitelist,
		);
		return $whitelist;
	}
}
