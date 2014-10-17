<?php

class Jetpack_JSON_API_Plugins_Install_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/new
	protected $needed_capabilities = 'install_plugins';

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities, true ) ) ) {
			return $error;
		}

		$result = $this->install();
		return $result;
	}

	protected function install() {
		$args = $this->input();
		if ( empty( $args['plugin'] ) ) {
			new WP_Error( 'missing_plugin', __( 'You are required to specify a plugin.', 'jetpack' ), 400 );
		}
		$plugin = $args['plugin'];

		include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		include_once ABSPATH . 'wp-admin/includes/file.php';

		$api = plugins_api('plugin_information', array('slug' => $plugin, 'fields' => array('sections' => false) ) );

		if ( is_wp_error($api) ) {
			return $api;
		}

		$skin      = new Automatic_Upgrader_Skin();
		$upgrader  = new Plugin_Upgrader( $skin );

		$result = $upgrader->install( $api->download_link );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error( 'install_error', __( 'An unknown error occurred during installation', 'jetpack' ), 400 );
		}

		$log = $upgrader->skin->get_upgrade_messages();

		$installed_plugin = $this->find_installed_plugin( $plugin );

		if ( is_wp_error( $installed_plugin ) ) {
			return $installed_plugin;
		}

		$installed_plugin['log'] = $log;
		return $installed_plugin;

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
