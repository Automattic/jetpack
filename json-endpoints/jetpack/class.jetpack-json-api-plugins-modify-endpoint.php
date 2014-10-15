<?php

class Jetpack_JSON_API_Plugins_Modify_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s
	// POST  /sites/%s/plugins
	protected $needed_capabilities = 'activate_plugins';
	protected $upgrade_log;
	protected $upgraded;
	protected $not_upgraded;

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
		$args = $this->input();

		if( is_wp_error( $error = $this->validate_action() ) ) {
			return $error;
		}

		return parent::callback( $path, $blog_id, $plugin );
	}

	protected function validate_action() {
		$expected_actions = array(
			'upgrade',
			'activate',
			'deactivate',
			'autoupdate_on',
			'autoupdate_off',
		);
		$args = $this->input();
		if( empty( $args['action'] ) || ! in_array( $args['action'], $expected_actions ) ) {
			return new WP_Error( 'invalid_action', __( 'You must specify a valid action', 'jetpack' ));
		}
		$this->action =  $args['action'];
	}

	protected function autoupdate_on() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		foreach( $this->plugins as $plugin ) {
			if( ! in_array( $plugin, $autoupdate_plugins ) ) {
				$autoupdate_plugins[] = $plugin;
				$this->log[ $plugin ][] = 'This plugin has been set to automatically update.';
			} else {
				$this->log[ $plugin ][] = 'This plugin is already set to automatically update.';
			}
		}
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
	}

	protected function autoupdate_off() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		foreach( $autoupdate_plugins as $index => $plugin ) {
			if( in_array( $plugin, $this->plugins ) ) {
				unset( $autoupdate_plugins[ $index ] );
				$this->log[ $plugin ][] = 'This plugin has been set to manually update.';
			} else {
				$this->log[ $plugin ][] = 'This plugin is already set to manually update.';
			}
		}
		$reindexed = array_values( $autoupdate_plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins', $reindexed );
	}

	protected function activate() {
		foreach( $this->plugins as $plugin ) {
			if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $plugin ) ) || is_plugin_active_for_network( $plugin ) ) {
				$this->log[ $plugin ]['error'] = true;
				$this->log[ $plugin ]['error_message'] =  __( 'The Plugin is already active.', 'jetpack' );
				$has_errors = true;
				continue;
			}

			$result = activate_plugin( $plugin, '', $this->network_wide );

			if ( is_wp_error( $result ) ) {
				$this->log[ $plugin ]['error'] = true;
				$this->log[ $plugin ]['error_message'] =  $result->get_error_messages();
				$has_errors = true;
				continue;
			}

			$success = Jetpack::is_plugin_active( $plugin );
			if ( $success &&  $this->network_wide ) {
				$success &= is_plugin_active_for_network( $plugin );
			}

			if ( ! $success ) {
				$this->log[ $plugin ]['error'] = true;
				$this->log[ $plugin ]['error_message'] =  $result->get_error_messages;
				$has_errors = true;
				continue;
			}
			$this->log[ $plugin ][] = __( 'Plugin activated.', 'jetpack' );
		}
		if( isset( $has_errors ) && count( $this->plugins ) === 1 ) {
			$plugin = $this->plugins[0];
			return new WP_Error( 'activation_error', $this->log[ $plugin ]['error_message'] );
		}
	}

	protected function deactivate() {
		foreach( $this->plugins as $plugin ) {
			if ( ! Jetpack::is_plugin_active( $plugin ) ) {
				$this->log[ $plugin ]['error'] = true;
				$this->log[ $plugin ]['error_message'] =  __( 'The Plugin is already deactivated.', 'jetpack' );
				$has_errors = true;
				continue;
			}

			deactivate_plugins( $plugin, false, $this->network_wide );

			$success = ! Jetpack::is_plugin_active( $plugin );
			if ( $success &&  $this->network_wide ) {
				$success &= ! is_plugin_active_for_network( $plugin );
			}

			if ( ! $success ) {
				$this->log[ $plugin ]['error'] = true;
				$this->log[ $plugin ]['error_message'] =  __( 'There was an error deactivating your plugin', 'jetpack' );
				$has_errors = true;
				continue;
			}
			$this->log[ $plugin ][] = __( 'Plugin deactivated.', 'jetpack' );
		}
		if( isset( $has_errors ) && count( $this->plugins ) === 1 ) {
			$plugin = $this->plugins[0];
			return new WP_Error( 'deactivation_error', $this->log[ $plugin ]['error_message'] );
		}
	}

	protected function upgrade() {

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


		$results           = $upgrader->bulk_upgrade( $this->plugins );
		$this->upgrade_log = $upgrader->skin->get_upgrade_messages();

		$installed_plugins = get_plugins();
		foreach ( $results as $path => $result ) {
			if ( is_array( $result ) ) {
				$this->log[ $path ] = 'Plugin upgraded';
				$this->upgraded[] = $path;
			} else {
				$this->log[ $path ] = 'Plugin not upgraded';
				$this->not_upgraded[] = $path;
			}
		}

		if ( 0 === count( $this->upgraded ) && 1 === count( $this->plugins ) ) {
			return new WP_Error( 'update_fail', $this->upgrade_log, 400 );
		}
	}
}
