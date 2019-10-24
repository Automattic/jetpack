<?php

class Jetpack_JSON_API_Install_Backup_Helper_Script_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/install-backup-helper-script

	protected $needed_capabilities = array(); // This endpoint is only accessible from Jetpack Backups
	protected $action = 'install';
	protected $helper_script = null;
	protected $result = null;

	protected function validate_input( $object ) {
		$args = $this->input();

		if ( ! isset( $args['helper'] ) ) {
			return new WP_Error( 'invalid_args', __( 'You must specify a helper script body', 'jetpack' ), 400 );
		}

		$this->helper_script = base64_decode( $args['helper'] );
		if ( ! $this->helper_script ) {
			return new WP_Error( 'invalid_args', __( 'Helper script body must be base64 encoded', 'jetpack' ), 400 );
		}

		return true;
	}

	protected function install() {
		$this->result = Automattic\Jetpack\Backup\Helper_Script_Manager::install_helper_script( $this->helper_script );
		Automattic\Jetpack\Backup\Helper_Script_Manager::cleanup_expired_helper_scripts();
	}

	protected function result() {
		// Include ABSPATH with successful result.
		if ( ! is_wp_error( $this->result ) ) {
			$this->result['abspath'] = ABSPATH;
		}

		return $this->result;
	}

}
