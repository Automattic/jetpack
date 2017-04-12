<?php

class Jetpack_Sync_Module_Plugins extends Jetpack_Sync_Module {

	private $action_handler;
	private $plugin_info = array();

	public function name() {
		return 'plugins';
	}

	public function init_listeners( $callable ) {
		$this->action_handler = $callable;

		add_action( 'deleted_plugin',  array( $this, 'deleted_plugin' ), 10, 2 );
		add_action( 'activated_plugin', $callable, 10, 2 );
		add_action( 'deactivated_plugin', $callable, 10, 2 );
		add_action( 'delete_plugin',  array( $this, 'delete_plugin') );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_activated_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_deactivated_plugin', array( $this, 'expand_plugin_data' ) );
		//Note that we don't simply 'expand_plugin_data' on the 'delete_plugin' action here because the plugin file is deleted when that action finishes
	}

	public function delete_plugin( $plugin_path ) {
		$full_plugin_path = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_path;

		//Checking for file existence because some sync plugin module tests simulate plugin installation and deletion without putting file on disk
		if ( file_exists( $full_plugin_path ) ) {
			$all_plugin_data = get_plugin_data( $full_plugin_path );
			$data = array(
				'name' => $all_plugin_data['Name'],
				'version' => $all_plugin_data['Version'],
			);
		} else {
			$data = array(
				'name' => $plugin_path,
				'version' => 'unknown',
			);
		}

		$this->plugin_info[$plugin_path] = $data;
	}

	public function deleted_plugin( $plugin_path, $is_deleted ) {
		call_user_func( $this->action_handler, $plugin_path, $is_deleted, $this->plugin_info[$plugin_path] );
		unset( $this->plugin_info[$plugin_path] );
	}

	public function expand_plugin_data( $args ) {
		$plugin_path = $args[0];
		$plugin_data = array();

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
