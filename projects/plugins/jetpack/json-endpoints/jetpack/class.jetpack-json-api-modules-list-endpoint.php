<?php

class Jetpack_JSON_API_Modules_List_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// GET /sites/%s/jetpack/modules

	protected $needed_capabilities = 'jetpack_manage_modules';

	public function validate_input( $module ) {
		$this->modules = Jetpack::get_available_modules();
		return true;
	}

}
