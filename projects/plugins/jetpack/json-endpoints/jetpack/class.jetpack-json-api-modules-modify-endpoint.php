<?php

class Jetpack_JSON_API_Modules_Modify_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// POST  /sites/%s/jetpack/modules/%s/activate
	// POST  /sites/%s/jetpack/modules/%s
	// POST  /sites/%s/jetpack/modules

	protected $needed_capabilities = 'activate_plugins';
	protected $action              = 'default_action';

	public function default_action() {
		$args = $this->input();
		if ( isset( $args['active'] ) && is_bool( $args['active'] ) ) {
			if ( $args['active'] ) {
				return $this->activate_module();
			} else {
				return $this->deactivate_module();
			}
		}

		return true;
	}

	protected function activate_module() {
		foreach ( $this->modules as $module ) {
			if ( Jetpack::is_module_active( $module ) ) {
				$error = $this->log[ $module ][] = __( 'The Jetpack Module is already activated.', 'jetpack' );
				continue;
			}
			$result = Jetpack::activate_module( $module, false, false );
			if ( false === $result || ! Jetpack::is_module_active( $module ) ) {
				$error = $this->log[ $module ][] = __( 'There was an error while activating the module.', 'jetpack' );
			}
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return new WP_Error( 'activation_error', $error, 400 );
		}

		return true;
	}

	protected function deactivate_module() {
		foreach ( $this->modules as $module ) {
			if ( ! Jetpack::is_module_active( $module ) ) {
				$error = $this->log[ $module ][] = __( 'The Jetpack Module is already deactivated.', 'jetpack' );
				continue;
			}
			$result = Jetpack::deactivate_module( $module );
			if ( false === $result || Jetpack::is_module_active( $module ) ) {
				$error = $this->log[ $module ][] = __( 'There was an error while deactivating the module.', 'jetpack' );
			}
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return new WP_Error( 'deactivation_error', $error, 400 );
		}

		return true;
	}

}
