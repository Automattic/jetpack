<?php

class Jetpack_JSON_API_Plugins_Modify_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s
	// POST  /sites/%s/plugins
	protected $needed_capabilities = 'activate_plugins';

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
		$args = $this->input();

		if ( isset( $args[ 'active' ] ) ) {
			$this->action[] = $args[ 'active' ] ? 'activate_plugins' : 'deactivate_plugins';
		}

		if( isset( $args['autoupdate'] ) ) {
			$this->action[] = $args[ 'autoupdate' ] ? 'flag_autoupdate_plugins' : 'unflag_autoupdate_plugins';
		}
		return parent::callback( $path, $blog_id, $plugin );
	}

	protected function flag_autoupdate_plugins() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		foreach( $this->plugins as $p ) {
			if( ! in_array( $p, $autoupdate_plugins ) ) {
				$autoupdate_plugins[] = $p;
				$this->log[ $p ][] = 'This plugin is has been set to automatically update.';
			} else {
				$this->log[ $p ][] = 'This plugin is already set to automatically update.';
			}
		}
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
	}

	protected function unflag_autoupdate_plugins() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		foreach( $autoupdate_plugins as $index => $plugin ) {
			if( in_array( $plugin, $this->plugins ) ) {
				unset( $autoupdate_plugins[ $index ] );
				$this->log[ $plugin ][] = 'This plugin is has been set to manually update.';
			} else {
				$this->log[ $plugin ][] = 'This plugin is already set to manually update.';
			}
		}
		$reindexed = array_values( $autoupdate_plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins', $reindexed );
	}

	protected function activate_plugins() {
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

	protected function deactivate_plugins() {
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
}
