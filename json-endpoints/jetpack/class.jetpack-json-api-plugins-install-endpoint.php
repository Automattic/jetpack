<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

class Jetpack_JSON_API_Plugins_Install_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/%s/new
	protected $needed_capabilities = 'install_plugins';
	protected $action              = 'install';
	protected $download_links      = array();

	protected function install() {
		foreach ( $this->plugins as $plugin ) {

			$skin      = new Automatic_Upgrader_Skin();
			$upgrader  = new Plugin_Upgrader( $skin );

			$result = $upgrader->install( $this->download_links[$plugin] );

			if ( ! $this->bulk && is_wp_error( $result ) ) {
				return $result;
			}

			if ( ! $this->bulk && ! $result ) {
				$error = $this->log[ $plugin ]['error'] = __( 'An unknown error occurred during installation', 'jetpack' );
			}

			if ( ! $this::is_installed_plugin( $plugin ) ) {
				$error = $this->log[ $plugin ]['error'] = __( 'There was an error installing your plugin', 'jetpack' );
			}

			$this->log[ $plugin ][] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'install_error', $this->log[ $plugin ]['error'], 400 );
		}

		return true;
	}

	protected function validate_plugins() {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ) );
		}
		foreach( $this->plugins as $index => $plugin ) {
			if ( ! preg_match( "/\.php$/", $plugin ) ) {
				$plugin                  =  $plugin . '.php';
				$this->plugins[ $index ] = $plugin;
			}

			if ( $this::is_installed_plugin( $plugin ) ) {
				return new WP_Error( 'plugin_already_installed', __( 'The plugin is already installed', 'jetpack' ) );
			}

			$slug        = substr( $plugin, 0, strpos( $plugin, '/' ) );
			$response    = wp_remote_get( "http://api.wordpress.org/plugins/info/1.0/$slug" );
			$plugin_data = unserialize( $response['body'] );
			if ( is_wp_error( $plugin_data ) ) {
				return $plugin_data;
			}
			$this->download_links[ $plugin ] = $plugin_data->download_link;

		}
		return true;
	}

	protected static function is_installed_plugin( $plugin ) {
		return in_array( $plugin, array_keys( get_plugins() ) );
	}

}
