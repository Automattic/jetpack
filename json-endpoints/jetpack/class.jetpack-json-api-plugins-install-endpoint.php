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
		$error = '';
		foreach ( $this->plugins as $index => $slug ) {

			$skin     = new Jetpack_Automatic_Install_Skin();
			$upgrader = new Plugin_Upgrader( $skin );
			$zip_url  = self::generate_wordpress_org_plugin_download_link( $slug );

			$result = $upgrader->install( $zip_url );

			if ( ! $this->bulk && is_wp_error( $result ) ) {
				return $result;
			}

			$plugin     = self::get_plugin_id_by_slug( $slug );
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
		foreach ( $this->plugins as $index => $slug ) {
			// make sure it is not already installed
			if ( self::get_plugin_id_by_slug( $slug ) ) {
				return new WP_Error( 'plugin_already_installed', __( 'The plugin is already installed', 'jetpack' ) );
			}

		}

		return true;
	}

	protected static function generate_wordpress_org_plugin_download_link( $plugin_slug ) {
		return "https://downloads.wordpress.org/plugin/{$plugin_slug}.latest-stable.zip";
	}

	protected static function get_plugin_id_by_slug( $slug ) {
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$plugins = apply_filters( 'all_plugins', get_plugins() );
		if ( ! is_array( $plugins ) ) {
			return false;
		}
		foreach ( $plugins as $plugin_file => $plugin_data ) {
			if ( self::get_slug_from_file_path( $plugin_file ) === $slug ) {
				return $plugin_file;
			}
		}

		return false;
	}

	protected static function get_slug_from_file_path( $plugin_file ) {
		// Simular to get_plugin_slug() method.
		$slug = dirname( $plugin_file );
		if ( '.' === $slug ) {
			$slug = preg_replace( "/(.+)\.php$/", "$1", $plugin_file );
		}

		return $slug;
	}
}

/**
 * Allows us to capture that the site doesn't have proper file system access.
 * In order to update the plugin.
 */
class Jetpack_Automatic_Install_Skin extends Automatic_Upgrader_Skin {
	/**
	 * Stores the last error key;
	 **/
	protected $main_error_code = 'install_error';

	/**
	 * Stores the last error message.
	 **/
	protected $main_error_message = 'An unknown error occurred during installation';

	/**
	 * Overwrites the set_upgrader to be able to tell if we e ven have the ability to write to the files.
	 *
	 * @param WP_Upgrader $upgrader
	 *
	 */
	public function set_upgrader( &$upgrader ) {
		parent::set_upgrader( $upgrader );

		// Check if we even have permission to.
		$result = $upgrader->fs_connect( array( WP_CONTENT_DIR, WP_PLUGIN_DIR ) );
		if ( ! $result ) {
			// set the string here since they are not available just yet
			$upgrader->generic_strings();
			$this->feedback( 'fs_unavailable' );
		}
	}

	/**
	 * Overwrites the error function
	 */
	public function error( $error ) {
		if ( is_wp_error( $error ) ) {
			$this->feedback( $error );
		}
	}

	private function set_main_error_code( $code ) {
		// Don't set the process_failed as code since it is not that helpful unless we don't have one already set.
		$this->main_error_code = ( $code === 'process_failed' && $this->main_error_code ? $this->main_error_code : $code );
	}

	private function set_main_error_message( $message, $code ) {
		// Don't set the process_failed as message since it is not that helpful unless we don't have one already set.
		$this->main_error_message = ( $code === 'process_failed' && $this->main_error_code ? $this->main_error_code : $message );
	}

	public function get_main_error_code() {
		return $this->main_error_code;
	}

	public function get_main_error_message() {
		return $this->main_error_message;
	}

	/**
	 * Overwrites the feedback function
	 */
	public function feedback( $data ) {

		$current_error = null;
		if ( is_wp_error( $data ) ) {
			$this->set_main_error_code( $data->get_error_code() );
			$string = $data->get_error_message();
		} elseif ( is_array( $data ) ) {
			return;
		} else {
			$string = $data;
		}

		if ( ! empty( $this->upgrader->strings[$string] ) ) {
			$this->set_main_error_code( $string );

			$current_error = $string;
			$string        = $this->upgrader->strings[$string];
		}

		if ( strpos( $string, '%' ) !== false ) {
			$args = func_get_args();
			$args = array_splice( $args, 1 );
			if ( ! empty( $args ) ) {
				$string = vsprintf( $string, $args );
			}
		}

		$string = trim( $string );
		$string = wp_kses(
			$string, array(
			'a'      => array(
				'href' => true
			),
			'br'     => true,
			'em'     => true,
			'strong' => true,
		)
		);

		$this->set_main_error_message( $string, $current_error );
		$this->messages[] = $string;
	}
}
