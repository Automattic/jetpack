<?php

class Jetpack_JSON_API_Plugins_Update_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST /sites/%s/plugins/%s/update
	// POST /sites/%s/plugins/update
	protected $action = array( 'upgrade_plugin' );
	protected $needed_capabilities = 'update_plugins';

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
		// validates
		$error = parent::callback( $path, $blog_id, null );

		if( is_wp_error( $error ) ) {
			return $error;
		}

		return $this->upgrade_plugin();

	}

	protected function upgrade_plugin() {

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// clear cache
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins(); // Check for Plugin updates
		ob_end_clean();

		$skin = new Automatic_Upgrader_Skin();
		// The Automatic_Upgrader_Skin skin shouldn't output anything.
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->init();

		// unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );


		$results   = $upgrader->bulk_upgrade( $this->plugins );
		$log       = $upgrader->skin->get_upgrade_messages();

		$updated   = array();
		$errors    = array();
		$installed_plugins = get_plugins();
		foreach ( $results as $path => $result ) {
			if ( is_array( $result ) ) {
				$updated[ $path ] = $this->format_plugin( $path, $installed_plugins[ $path ] );
			} else {
				$errors[] = $path;
			}
		}

		if ( 0 === count( $updated ) && 1 === count( $this->plugins ) ) {
			return new WP_Error( 'update_fail', $log, 400 );
		}

		return array(
			'updated' => $updated,
			'errors'  => $errors,
			'log'     => $log
		);
	}

}
