<?php

class Jetpack_JSON_API_Sync_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/sync
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		Jetpack::init();
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_sync_all_registered_options' );
		$result['scheduled'] = true;
		return $result;
	}
}
