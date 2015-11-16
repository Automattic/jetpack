<?php

class Jetpack_JSON_API_Maybe_Auto_Update_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/maybe_auto_update
	protected $needed_capabilities = 'manage_options';

	protected $update_results = array();

	protected function result() {
		add_action( 'automatic_updates_complete', array( $this, 'get_update_results', 100, 1 ) );

		include_once( ABSPATH . '/wp-admin/includes/admin.php' );
		include_once( ABSPATH . '/wp-admin/includes/class-wp-upgrader.php' );

		$upgrader = new WP_Automatic_Updater;
		$upgrader->run();

		return $this->update_results;
	}

	protected function get_update_results( $results ) {
		$this->update_results = $results;
	}

}
