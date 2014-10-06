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
		foreach( $autoupdate_plugins as $k => $v ) {
			if( in_array( $v, $this->plugins ) ) {
				unset( $autoupdate_plugins[$k] );
				$this->log[ $v ][] = 'This plugin is has been set to manually update.';
			} else {
				$this->log[ $v ][] = 'This plugin is already set to manually update.';
			}
		}
		$rekeyed = array_values( $autoupdate_plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins', $rekeyed);
	}

	protected function activate_plugins() {
		foreach( $this->plugins as $p ) {
			if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $p ) ) || is_plugin_active_for_network( $p ) ) {
				$this->log[ $p ]['error'] = true;
				$this->log[ $p ]['error_message'] =  __( 'The Plugin is already active.', 'jetpack' );
				continue;
			}

			$result = activate_plugin( $p, '', $this->network_wide );

			if ( is_wp_error( $result ) ) {
				$this->log[ $p ]['error'] = true;
				$this->log[ $p ]['error_message'] =  $result->get_error_messages();
				continue;
			}

			$success = Jetpack::is_plugin_active( $p );
			if ( $success &&  $this->network_wide ) {
				$success &= is_plugin_active_for_network( $p );
			}

			if ( ! $success ) {
				$this->log[ $p ]['error'] = true;
				$this->log[ $p ]['error_message'] =  $result->get_error_messages;
				continue;
			}
			$this->log[ $p ][] = __( 'Plugin activated.' );
		}
	}

	protected function deactivate_plugins() {
		foreach( $this->plugins as $p ) {
			if ( ! Jetpack::is_plugin_active( $p ) ) {
				$this->log[ $p ]['error'] = true;
				$this->log[ $p ]['error_message'] =  __( 'The Plugin is already deactivated.', 'jetpack' );
				continue;
			}

			deactivate_plugins( $p, false, $this->network_wide );

			$success = ! Jetpack::is_plugin_active( $p );
			if ( $success &&  $this->network_wide ) {
				$success &= ! is_plugin_active_for_network( $p );
			}

			if ( ! $success ) {
				$this->log[ $p ]['error'] = true;
				$this->log[ $p ]['error_message'] =  __( 'There was an error deactivating your plugin' );
				continue;
			}
			$this->log[ $p ][] = __( 'Plugin deactivated.' );
		}
	}
}
