<?php

class Jetpack_JSON_API_Get_User_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/users/%d/backup      -> $blog_id, $user_id

	protected $needed_capabilities = array(); // This endpoint is only accessible using a site token
	protected $user_id;

	function validate_input( $user_id ) {
		if ( empty( $user_id ) || ! is_numeric( $user_id ) ) {
			return new WP_Error( 'user_id_not_specified', __( 'You must specify a User ID', 'jetpack' ), 400 );
		}

		$this->user_id = (int) $user_id;

		return true;
	}

	protected function result() {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		\Automattic\Jetpack\Sync\Actions::mark_sync_read_only();

		$user = get_user_by( 'id', $this->user_id );
		if ( empty( $user ) ) {
			return new WP_Error( 'user_not_found', __( 'User not found', 'jetpack' ), 404 );
		}

		return array(
			'user' => $user->to_array(),
			'meta' => get_user_meta( $user->ID ),
		);
	}

}

