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
		add_action( 'upgrader_process_complete', array( $this, 'on_upgrader_completion' ), 10, 2 );
		add_action( 'jetpack_plugin_installed', $callable, 10, 1 );
		add_action( 'jetpack_plugin_update_failed', $callable, 10, 4 );
		add_action( 'jetpack_plugins_updated', $callable, 10, 2 );
		add_action( 'admin_action_update', array( $this, 'check_plugin_edit') );
		add_action( 'jetpack_edited_plugin', $callable, 10, 2 );
		add_action( 'wp_ajax_edit-theme-plugin-file', array( $this, 'plugin_edit_ajax' ), 0 );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_activated_plugin', array( $this, 'expand_plugin_data' ) );
		add_filter( 'jetpack_sync_before_send_deactivated_plugin', array( $this, 'expand_plugin_data' ) );
		//Note that we don't simply 'expand_plugin_data' on the 'delete_plugin' action here because the plugin file is deleted when that action finishes
	}

	public function on_upgrader_completion( $upgrader, $details ) {
		if ( ! isset( $details['type'] ) ) {
			return;
		}
		if ( 'plugin' != $details['type'] ) {
			return;
		}

		if ( ! isset( $details['action'] ) ) {
			return;
		}

		$plugins = ( isset( $details['plugins'] ) ? $details['plugins'] : null );
		if ( empty( $plugins ) ) {
			$plugins = ( isset( $details['plugin'] ) ? array( $details['plugin'] ) : null );
		}

		// for plugin installer
		if ( empty( $plugins ) && method_exists( $upgrader, 'plugin_info' ) ) {
			$plugins = array( $upgrader->plugin_info() );
		}

		if ( empty( $plugins ) ) {
			return; // We shouldn't be here
		}

		switch ( $details['action'] ) {
			case 'update':
				$state  = array(
					'is_autoupdate' => Jetpack_Constants::is_true( 'JETPACK_PLUGIN_AUTOUPDATE' ),
				);
				$errors = $this->get_errors( $upgrader->skin );
				if ( $errors ) {
					foreach ( $plugins as $slug ) {
						/**
						 * Sync that a plugin update failed
						 *
						 * @since  5.8.0
						 *
						 * @module sync
						 *
						 * @param string $plugin , Plugin slug
						 * @param        string  Error code
						 * @param        string  Error message
						 */
						do_action( 'jetpack_plugin_update_failed', $this->get_plugin_info( $slug ), $errors['code'], $errors['message'], $state );
					}

					return;
				}
				/**
				 * Sync that a plugin update
				 *
				 * @since  5.8.0
				 *
				 * @module sync
				 *
				 * @param array () $plugin, Plugin Data
				 */
				do_action( 'jetpack_plugins_updated', array_map( array( $this, 'get_plugin_info' ), $plugins ), $state );
				break;
			case 'install':

		}

		if ( 'install' === $details['action'] ) {
			/**
			 * Signals to the sync listener that a plugin was installed and a sync action
			 * reflecting the installation and the plugin info should be sent
			 *
			 * @since  5.8.0
			 *
			 * @module sync
			 *
			 * @param array () $plugin, Plugin Data
			 */
			do_action( 'jetpack_plugin_installed', array_map( array( $this, 'get_plugin_info' ), $plugins ) );

			return;
		}
	}

	private function get_plugin_info( $slug ) {
		$plugins = get_plugins();
		return isset( $plugins[ $slug ] ) ? array_merge( array( 'slug' => $slug), $plugins[ $slug ] ): array( 'slug' => $slug );
	}

	private function get_errors( $skin ) {
		$errors = method_exists( $skin, 'get_errors' ) ? $skin->get_errors() : null;
		if ( is_wp_error( $errors ) ) {
			$error_code = $errors->get_error_code();
			if ( ! empty( $error_code ) ) {
				return array( 'code' => $error_code, 'message' => $errors->get_error_message() );
			}
		}

		if ( isset( $skin->result ) ) {
			$errors = $skin->result;
			if ( is_wp_error( $errors ) ) {
				return array( 'code' => $errors->get_error_code(), 'message' => $errors->get_error_message() );
			}

			if ( false == $skin->result ) {
				return array( 'code' => 'unknown', 'message' => __( 'Unknown Plugin Update Failure', 'jetpack' ) );
			}
		}
		return false;
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

	public function plugin_edit_ajax() {
		// this validation is based on wp_edit_theme_plugin_file()
		$args = wp_unslash( $_POST );
		if ( empty( $args['file'] ) ) {
			return;
		}

		$file = $args['file'];
		if ( 0 !== validate_file( $file ) ) {
			return;
		}

		if ( ! isset( $args['newcontent'] ) ) {
			return;
		}

		if ( ! isset( $args['nonce'] ) ) {
			return;
		}

		if ( empty( $args['plugin'] ) ) {
			return;
		}

		$plugin = $args['plugin'];
		if ( ! current_user_can( 'edit_plugins' ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $args['nonce'], 'edit-plugin_' . $file ) ) {
			return;
		}
		$plugins = get_plugins();
		if ( ! array_key_exists( $plugin, $plugins ) ) {
			return;
		}

		if ( 0 !== validate_file( $file, get_plugin_files( $plugin ) ) ) {
			return;
		}

		$real_file = WP_PLUGIN_DIR . '/' . $file;

		if ( ! is_writeable( $real_file ) ) {
			return;
		}

		$file_pointer = fopen( $real_file, 'w+' );
		if ( false === $file_pointer ) {
			return;
		}

		/**
		 * This action is documented already in this file
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
