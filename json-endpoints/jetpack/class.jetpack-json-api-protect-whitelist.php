<?php

include_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';

class Jetpack_JSON_API_Protect_Whitelist extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function validate_input( $object ) {
		if( $this->method == 'GET' ) {
			return true;
		}
		$args = $this->input();
		if ( ! isset( $args['whitelist'] ) || ! isset( $args['global'] ) ) {
			return new WP_Error( 'invalid_arguments', __( 'Invalid arguments', 'jetpack' ));
		}

		$result = jetpack_protect_save_whitelist( $args['whitelist'], $args['global'] );

		if( ! $result ) {
			return new WP_Error( 'invalid_ip', __( 'One or more of your IP addresses are invalid.', 'jetpack' ));
		}
		return true;
	}

	public function result() {
		$response = array(
			'whitelist' => jetpack_protect_format_whitelist(),
		);
		return $response;
	}
}
