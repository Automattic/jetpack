<?php

class Jetpack_Sync_Module_Plugins extends Jetpack_Sync_Module {

	public function name() {
		return 'plugins';
	}

	public function init_listeners( $callable ) {
		add_action( 'deleted_plugin', $callable, 10, 2 );
		add_action( 'activated_plugin', $callable, 10, 2 );
		add_action( 'deactivated_plugin', $callable, 10, 2 );
		add_action( 'delete_plugin', array( $this, 'sync_deleted_plugin_info') );
		add_action( 'jetpack_delete_plugin', $callable, 10, 2);
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_activated_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_deactivated_plugin', array( $this, 'expand_plugin_data' ) );
		//Note that we don't simply 'expand_plugin_data' on the 'delete_plugin' action here because the plugin file is deleted when that action finishes
	}

	public function sync_deleted_plugin_info( $plugin_path ) {
		$all_plugin_data = get_plugin_data( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_path );
		$data = array (
			'name' => $all_plugin_data['Name'],
			'version' => $all_plugin_data['Version'],
		);

		/**
		 * Syncs information about a plugin whose deletion was attempted
		 *
		 * @since 4.8.3
		 *
		 * @param string $plugin_path Path of plugin whose deletion was attempted (deletion verified in deleted_plugin sync action)
		 * @param mixed $data Array of plugin information fields (name, version, etc.)
		 */
		do_action( 'jetpack_delete_plugin', $plugin_path, $data );
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
		}

		return array(
			$args[0],
			$args[1],
			$plugin_data,
		);
	}
}
