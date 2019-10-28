<?php

class Jetpack_JSON_API_Delete_Backup_Helper_Script_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/install-backup-helper-script

	protected $needed_capabilities = array(); // This endpoint is only accessible from Jetpack Backup
	protected $action              = 'delete';
	protected $script_path         = null;
	protected $result              = false;

	protected function validate_input( $object ) {
		$args = $this->input();

		if ( ! isset( $args['path'] ) ) {
			return new WP_Error( 'invalid_args', __( 'You must specify a helper script path', 'jetpack' ), 400 );
		}

		$this->script_path = $args['path'];
		return true;
	}

	protected function delete() {
		$this->result = Automattic\Jetpack\Backup\Helper_Script_Manager::delete_helper_script( $this->script_path );
		Automattic\Jetpack\Backup\Helper_Script_Manager::cleanup_expired_helper_scripts();
	}

	protected function result() {
		return array(
			'success' => $this->result,
		);
	}

}
