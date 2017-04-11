<?php

class Jetpack_Sync_Module_Plugins extends Jetpack_Sync_Module {

	public function name() {
		return 'plugins';
	}

	public function init_listeners( $callable ) {
		add_action( 'delete_plugin', $callable ); //This fires before the deletion, so plugin data is still available for the activity log
		add_action( 'deleted_plugin', $callable, 10, 2 ); //This fires after the deletion, and will inform us if the deletion failed
		add_action( 'activated_plugin', $callable, 10, 2 );
		add_action( 'deactivated_plugin', $callable, 10, 2 );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_delete_plugin', array( $this, 'expand_plugin_data' ) );
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
			$plugin_data['Name'] = $all_plugin_data['Name'];
			$plugin_data['Version'] = $all_plugin_data['Version'];
		}

		//If action is 'delete_plugin', it will have 1 argument, whereas it will have 2 if 'activated_plugin' or 'deactivated_plugin'. 
		if ( 'delete_plugin' === current_filter() ) {
			return array(
				$args[0],
				$plugin_data,
			);
		}

		return array(
			$args[0],
			$args[1],
			$plugin_data,
		);
	}
}
