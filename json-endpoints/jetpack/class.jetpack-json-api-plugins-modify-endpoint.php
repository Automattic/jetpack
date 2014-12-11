<?php

class Jetpack_JSON_API_Plugins_Modify_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s
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
			}
		}
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
	}

	protected function unflag_autoupdate_plugins() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		foreach( $autoupdate_plugins as $k => $v ) {
			if( in_array( $v, $this->plugins ) ) {
				unset( $autoupdate_plugins[$k] );
			}
		}
		$rekeyed = array_values( $autoupdate_plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins', $rekeyed);
	}

	protected function activate_plugins() {
		if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $this->plugin ) ) || is_plugin_active_for_network( $this->plugin ) ) {
			return new WP_Error( 'plugin_already_active', __( 'The Plugin is already active.', 'jetpack' ), 400 );
		}

		$result = activate_plugin( $this->plugin, '', $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 500 );
		}

		$success = Jetpack::is_plugin_active( $this->plugin );
		if ( $success &&  $this->network_wide ) {
			$success &= is_plugin_active_for_network( $this->plugin );
		}

		if ( ! $success ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 500 );
		}

		return true;
	}

	protected function deactivate_plugins() {

		if ( ! Jetpack::is_plugin_active( $this->plugin ) ) {
			return new WP_Error( 'plugin_already_deactivated', __( 'The Plugin is already deactivated.', 'jetpack' ), 400 );
		}

		$result = deactivate_plugins( $this->plugin, false, $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 500 );
		}

		$success = ! Jetpack::is_plugin_active( $this->plugin );
		if ( $success &&  $this->network_wide ) {
			$success &= ! is_plugin_active_for_network( $this->plugin );
		}

		if ( ! $success ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 500 );
		}

		return true;
	}
}
