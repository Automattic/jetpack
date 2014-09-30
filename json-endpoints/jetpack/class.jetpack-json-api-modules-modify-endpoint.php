<?php

class Jetpack_JSON_API_Modules_Modify_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// POST  /sites/%s/jetpack/modules/%s/activate

	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		$args = $this->input();
		if ( isset( $args[ 'active' ] ) ) {
			$this->action = $args[ 'active' ] ? 'activate_module' : 'deactivate_module';
		}
		return parent::callback( $path, $blog_id, $module_slug );
	}

	protected function activate_module() {

		if ( Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_active', __( 'The Module is already active.', 'jetpack' ), 400 );
		}

		$result = Jetpack::activate_module( $this->module_slug, false, false );

		// TODO return WP_Error instead of bool in order to forward the error message.
		if ( false === $result || ! Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'activation_error', sprintf( __( 'There was an error while activating the module `%s`.', 'jetpack' ), $this->module_slug ), 500 );
		}

		return true;
	}

	protected function deactivate_module() {

		if ( ! Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_deactivated', __( 'The Jetpack Module is already deactivated.', 'jetpack' ), 400 );
		}

		$result = Jetpack::deactivate_module( $this->module_slug );

		if ( false === $result || Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'deactivation_error', sprintf( __( 'There was an error while deactivating the module `%s`.', 'jetpack' ), $this->module_slug ), 500 );
		}

		return true;
	}

}
