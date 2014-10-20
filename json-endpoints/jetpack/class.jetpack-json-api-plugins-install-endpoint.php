<?php

include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

class Jetpack_JSON_API_Plugins_Install_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/new
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

			$installed_plugin = $this->find_installed_plugin( $plugin );

			if ( is_wp_error( $installed_plugin ) ) {
				$error = $this->log[ $plugin ]['error'] = __( 'There was an error deactivating your plugin', 'jetpack' );
			}

			$this->log[ $plugin ][] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'install_error', $this->log[ $plugin ]['error'], 400 );
		}

	}

	protected function validate_input( $plugin ) {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ));
		}
		foreach( $this->plugins as $index => $plugin ) {
			if ( ! preg_match( "/\.php$/", $plugin ) ) {
				$plugin =  $plugin . '.php';
				$this->plugins[ $index ] = $plugin;
			}

			$plugin_data = plugins_api( 'plugin_information', array( 'slug' => $plugin, 'fields' => array( 'sections' => false ) ) );
			if ( is_wp_error( $plugin_data ) ) {
				return $plugin_data;
			}
			$this->download_links[ $plugin ] = $plugin_data->download_link;

		}
		return true;
	}

	protected function find_installed_plugin( $slug ) {
		$all_plugins = get_plugins();

		foreach( $all_plugins as $id => $plugin ) {
			if ( strpos( $id, $slug . '/' ) !== false ) {
				$installed_plugin = $this->format_plugin( $id, $plugin );
				return $installed_plugin;
			}
		}

		return new WP_Error( 'install_error', __( 'An unknown error occurred during installation', 'jetpack' ), 400 );

	}
}
