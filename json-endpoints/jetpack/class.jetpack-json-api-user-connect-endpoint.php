<?php

class Jetpack_JSON_API_User_Connect_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $needed_capabilities = 'create_users';

	private $user_id;
	private $user_token;

	function result() {
		Jetpack::update_user_token( $this->user_id, sprintf( '%s.%d', $this->user_token, $this->user_id ), false );
		return array( 'success' => Jetpack::is_user_connected( $this->user_id ) );
	}

	function validate_input( $user_id ) {
		$input = $this->input();
		if ( ! isset( $user_id ) ) {
			return new WP_Error( 'input_error', __( 'user_id is required', 'jetpack' ) );
		}
		$this->user_id = $user_id;
		if ( Jetpack::is_user_connected( $this->user_id ) ) {
			return new WP_Error( 'user_already_connected', __( 'The user is already connected', 'jetpack' ) );
		}
		if ( ! isset( $input['user_token'] ) ) {
			return new WP_Error( 'input_error', __( 'user_token is required', 'jetpack' ) );
		}
		$this->user_token = sanitize_text_field( $input[ 'user_token'] );
		return parent::validate_input( $user_id );
	}

}
