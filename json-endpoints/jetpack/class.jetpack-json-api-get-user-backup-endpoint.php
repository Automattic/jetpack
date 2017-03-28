<?php

class Jetpack_JSON_API_Get_User_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/users/%d/backup      -> $blog_id, $user_id

	protected $needed_capabilities = array();
	protected $user_id;

	function validate_input( $user_id ) {
		if ( empty( $user_id ) || ! is_numeric( $user_id ) ) {
			return new WP_Error( 400, __( 'You must specify a User ID', 'jetpack' ) );
		}

		$this->user_id = intval( $user_id );

		return true;
	}

	protected function result() {
		$user = get_user_by( 'id', $this->user_id );
		if ( empty( $user ) ) {
			return new WP_Error( 404, __( 'User not found', 'jetpack' ) );
		}

		return array(
			'user' => (array)$user,
			'meta' => get_user_meta( $user->ID ),
		);
	}

}

