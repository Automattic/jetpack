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
		add_action( 'upgrader_process_complete', array( $this, 'check_upgrader' ), 10, 2 );
		add_action( 'jetpack_installed_plugin', $callable, 10, 2 );
		add_action( 'admin_action_update', array( $this, 'check_plugin_edit') );
		add_action( 'jetpack_edited_plugin', $callable, 10, 2 );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_activated_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_deactivated_plugin', array( $this, 'expand_plugin_data' ) );
		//Note that we don't simply 'expand_plugin_data' on the 'delete_plugin' action here because the plugin file is deleted when that action finishes
	}

	public function check_upgrader( $upgrader, $details) {

		if ( ! isset( $details['type'] ) ||
			'plugin' !== $details['type'] ||
			is_wp_error( $upgrader->skin->result ) ||
			! method_exists( $upgrader, 'plugin_info' )
		) {
			return;
		}

		if ( 'install' === $details['action'] ) {
			$plugin_path = $upgrader->plugin_info();
			$plugins = get_plugins();
			$plugin_info = $plugins[ $plugin_path ];

			/**
			 * Signals to the sync listener that a plugin was installed and a sync action
			 * reflecting the installation and the plugin info should be sent
			 *
			 * @since 4.9.0
			 *
			 * @param string $plugin_path Path of plugin installed
			 * @param mixed $plugin_info Array of info describing plugin installed
			 */
			do_action( 'jetpack_installed_plugin', $plugin_path, $plugin_info );
		}
	}

	public function check_plugin_edit() {
		$screen = get_current_screen();
		if ( 'plugin-editor' !== $screen->base ||
			! isset( $_POST['newcontent'] ) ||
			! isset( $_POST['plugin'] )
		) {
			return;
		}

		$plugin = $_POST['plugin'];
		$plugins = get_plugins();
		if ( ! isset( $plugins[ $plugin ] ) ) {
			return;
		}

		/**
		 * Helps Sync log that a plugin was edited
		 *
		 * @since 4.9.0
		 *
		 * @param string $plugin, Plugin slug
		 * @param mixed $plugins[ $plugin ], Array of plugin data
		 */
		do_action( 'jetpack_edited_plugin', $plugin, $plugins[ $plugin ] );
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

		$this->plugin_info[ $plugin_path ] = $data;
	}

	public function deleted_plugin( $plugin_path, $is_deleted ) {
		call_user_func( $this->action_handler, $plugin_path, $is_deleted, $this->plugin_info[ $plugin_path ] );
		unset( $this->plugin_info[ $plugin_path ] );
	}

	public function expand_plugin_data( $args ) {
		$plugin_path = $args[0];
		$plugin_data = array();

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$all_plugins = get_plugins();
		if ( isset( $all_plugins[ $plugin_path ] ) ) {
			$all_plugin_data = $all_plugins[ $plugin_path ];
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
