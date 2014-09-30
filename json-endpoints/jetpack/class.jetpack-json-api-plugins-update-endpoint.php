<?php

class Jetpack_JSON_API_Plugins_Update_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST /sites/%s/plugins/%s/update => upgrade_plugin
	protected $action = 'upgrade_plugin';
	protected $needed_capabilities = 'update_plugins';

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

		ob_start();
		$result = $upgrader->upgrade( $this->plugin );
		$output = ob_get_contents();
		ob_end_clean();

		$this->log = $upgrader->skin->get_upgrade_messages();

		if ( false === $result ) {
			return new WP_Error( 'plugin_up_to_date', __( 'The Plugin is already up to date.', 'jetpack' ), 400 );
		}
		if ( empty( $result ) && ! empty( $output ) ) {
			return new WP_Error( 'unknown_error', __( 'There was an error while trying to upgrade.', 'jetpack' ), 500 );
		}
		if ( is_wp_error( $result) ) {
			return $result;
		}

		return true;
	}

}
