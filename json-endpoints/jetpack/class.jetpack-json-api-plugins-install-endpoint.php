<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';
// POST /sites/%s/plugins/%s/install
new Jetpack_JSON_API_Plugins_Install_Endpoint(
	array(
		'description'          => 'Install a plugin to your jetpack blog',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:1:install',
		'min_version'          => '1',
		'max_version'          => '1.1',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/install',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(int|string) The plugin slug to install',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/akismet/install'
	)
);

new Jetpack_JSON_API_Plugins_Install_Endpoint(
	array(
		'description'          => 'Install a plugin to your jetpack blog',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:1:install',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/install',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(int|string) The plugin slug to install',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format_v1_2,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/akismet/install'
	)
);

class Jetpack_JSON_API_Plugins_Install_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST /sites/%s/plugins/%s/install
	protected $needed_capabilities = 'install_plugins';
	protected $action = 'install';

	protected function install() {
		jetpack_require_lib( 'plugins' );
		$error = '';
		foreach ( $this->plugins as $index => $slug ) {
			$result = Jetpack_Plugins::install_plugin( $slug );

			if ( ! $this->bulk && is_wp_error( $result ) ) {
				return $result;
			}

			$plugin     = Jetpack_Plugins::get_plugin_id_by_slug( $slug );
			$error_code = 'install_error';
			if ( ! $plugin ) {
				$error = $this->log[ $slug ][] = __( 'There was an error installing your plugin', 'jetpack' );
			}

			if ( ! $this->bulk && ! $result ) {
				$error_code                         = $upgrader->skin->get_main_error_code();
				$message                            = $upgrader->skin->get_main_error_message();
				$error = $this->log[ $slug ][] = $message ? $message : __( 'An unknown error occurred during installation', 'jetpack' );
			}

			$this->log[ $plugin ] = (array) $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! empty( $error ) ) {
			if ( 'download_failed' === $error_code ) {
				// For backwards compatibility: versions prior to 3.9 would return no_package instead of download_failed.
				$error_code = 'no_package';
			}

			return new WP_Error( $error_code, $error, 400 );
		}

		// replace the slug with the actual plugin id
		$this->plugins[$index] = $plugin;

		return true;
	}

	protected function validate_plugins() {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ) );
		}

		jetpack_require_lib( 'plugins' );
		foreach ( $this->plugins as $index => $slug ) {
			// make sure it is not already installed
			if ( Jetpack_Plugins::get_plugin_id_by_slug( $slug ) ) {
				return new WP_Error( 'plugin_already_installed', __( 'The plugin is already installed', 'jetpack' ) );
			}

		}

		return true;
	}
}
