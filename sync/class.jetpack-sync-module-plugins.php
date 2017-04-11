<?php

class Jetpack_Sync_Module_Plugins extends Jetpack_Sync_Module {

	public function name() {
		return 'plugins';
	}

	public function init_listeners( $callable ) {
		add_action( 'deleted_plugin', $callable, 10, 2 );
		add_action( 'activated_plugin', $callable, 10, 2 );
		add_action( 'deactivated_plugin', $callable, 10, 2 );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_deleted_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_activated_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_deactivated_plugin', array( $this, 'expand_plugin_data' ) );
	}

	public function expand_plugin_data( $args ) {
		$plugin_path = $args[0];
		$plugin_data = array();

		//Try to get plugin data from cache (if it isn't cached, get_plugins() tries to get it from disk)
		$all_plugins = get_plugins();
		if ( isset( $all_plugins[$plugin_path] ) ) {
			$all_plugin_data = $all_plugins[$plugin_path];
			$plugin_data['name'] = $all_plugin_data['Name'];
			$plugin_data['version'] = $all_plugin_data['Version'];
		} else {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
			$slug = Jetpack_Autoupdate::get_plugin_slug( $plugin_path );
			$all_plugin_data = plugins_api( 'plugin_information', array( 'slug' => $slug ) );
			if ( is_array( $all_plugin_data ) ) {
				$plugin_data['name'] = $all_plugin_data->name;
				$plugin_data['version'] = $all_plugin_data->version;
			}
		}

		return array(
			$args[0],
			$args[1],
			$plugin_data,
		);
	}
}
