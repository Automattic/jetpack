<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

class Jetpack_JSON_API_Plugins_Install_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/%s/new
	protected $needed_capabilities = 'install_plugins';
	protected $action              = 'install';
	protected $download_links      = array();

	protected function install() {
		foreach ( $this->plugins as $index => $slug ) {

			$skin      = new Automatic_Upgrader_Skin();
			$upgrader  = new Plugin_Upgrader( $skin );

			$result = $upgrader->install( $this->download_links[ $slug ] );

			if ( ! $this->bulk && is_wp_error( $result ) ) {
				return $result;
			}

			$plugin = self::get_plugin_id_by_slug( $slug );

			if ( ! $plugin ) {
				$error = $this->log[ $slug ]['error'] = __( 'There was an error installing your plugin', 'jetpack' );
			}

			if ( ! $this->bulk && ! $result ) {
				$error = $this->log[ $slug ]['error'] = __( 'An unknown error occurred during installation', 'jetpack' );
			}

			$this->log[ $plugin ][] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'install_error', $this->log[ $slug ]['error'], 400 );
		}

		// replace the slug with the actual plugin id
		$this->plugins[ $index ] = $plugin;

		return true;
	}

	protected function validate_plugins() {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ) );
		}
		foreach( $this->plugins as $index => $slug ) {

			// make sure it is not already installed
			if ( self::get_plugin_id_by_slug( $slug ) ) {
				return new WP_Error( 'plugin_already_installed', __( 'The plugin is already installed', 'jetpack' ) );
			}

			$response    = wp_remote_get( "http://api.wordpress.org/plugins/info/1.0/$slug" );
			$plugin_data = unserialize( $response['body'] );
			if ( is_wp_error( $plugin_data ) ) {
				return $plugin_data;
			}

			$this->download_links[ $slug ] = $plugin_data->download_link;

		}
		return true;
	}

	protected static function get_plugin_id_by_slug( $slug ) {
		$plugins = get_plugins();
		if( ! is_array( $plugins ) ) {
			return false;
		}
		foreach( $plugins as $id => $plugin_data ) {
			if( strpos( $id, $slug ) !== false ) {
				return $id;
			}
		}
		return false;
	}
}
