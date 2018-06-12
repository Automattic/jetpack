<?php
new Jetpack_JSON_API_Plugins_Modify_Endpoint(
	array(
		'description'          => 'Activate/Deactivate a Plugin on your Jetpack Site, or set automatic updates',
		'min_version'          => '1',
		'max_version'          => '1.1',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s',
		'stat'                 => 'plugins:1:modify',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(string) The plugin ID',
		),
		'request_format'       => array(
			'action'       => '(string) Possible values are \'update\'',
			'autoupdate'   => '(bool) Whether or not to automatically update the plugin',
			'active'       => '(bool) Activate or deactivate the plugin',
			'network_wide' => '(bool) Do action network wide (default value: false)',
		),
		'query_parameters'     => array(
			'autoupdate' => '(bool=false) If the update is happening as a result of autoupdate event',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
			'body'    => array(
				'action' => 'update',
			)
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello-dolly%20hello'
	)
);

new Jetpack_JSON_API_Plugins_Modify_Endpoint(
	array(
		'description'          => 'Activate/Deactivate a list of plugins on your Jetpack Site, or set automatic updates',
		'min_version'          => '1',
		'max_version'          => '1.1',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins',
		'stat'                 => 'plugins:modify',
		'path_labels'          => array(
			'$site' => '(int|string) The site ID, The site domain',
		),
		'request_format'       => array(
			'action'       => '(string) Possible values are \'update\'',
			'autoupdate'   => '(bool) Whether or not to automatically update the plugin',
			'active'       => '(bool) Activate or deactivate the plugin',
			'network_wide' => '(bool) Do action network wide (default value: false)',
			'plugins'      => '(array) A list of plugin ids to modify',
		),
		'query_parameters'     => array(
			'autoupdate' => '(bool=false) If the update is happening as a result of autoupdate event',
		),
		'response_format'      => array(
			'plugins'     => '(array:plugin) An array of plugin objects.',
			'updated'     => '(array) A list of plugin ids that were updated. Only present if action is update.',
			'not_updated' => '(array) A list of plugin ids that were not updated. Only present if action is update.',
			'log'         => '(array) Update log. Only present if action is update.',
		),
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
			'body'    => array(
				'active'  => true,
				'plugins' => array(
					'jetpack/jetpack',
					'akismet/akismet',
				),
			)
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins'
	)
);

new Jetpack_JSON_API_Plugins_Modify_Endpoint(
	array(
		'description'          => 'Update a Plugin on your Jetpack Site',
		'min_version'          => '1',
		'max_version'          => '1.1',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/update/',
		'stat'                 => 'plugins:1:update',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(string) The plugin ID',
		),
		'query_parameters'     => array(
			'autoupdate' => '(bool=false) If the update is happening as a result of autoupdate event',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello-dolly%20hello/update'
	)
);

class Jetpack_JSON_API_Plugins_Modify_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s
	// POST  /sites/%s/plugins
	protected $slug = null;
	protected $needed_capabilities = 'activate_plugins';
	protected $action = 'default_action';
	protected $expected_actions = array( 'update', 'install', 'delete', 'update_translations' );

	public function callback( $path = '', $blog_id = 0, $object = null ) {
		Jetpack_JSON_API_Endpoint::validate_input( $object );
		switch ( $this->action ) {
			case 'delete':
				$this->needed_capabilities = 'delete_plugins';
			case 'update_translations':
			case 'update' :
				$this->needed_capabilities = 'update_plugins';
				break;
			case 'install' :
				$this->needed_capabilities = 'install_plugins';
				break;
		}

		if ( isset( $args['autoupdate'] ) || isset( $args['autoupdate_translations'] ) ) {
			$this->needed_capabilities = 'update_plugins';
		}

		return parent::callback( $path, $blog_id, $object );
	}

	public function default_action() {
		$args = $this->input();

		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			if ( $args['autoupdate'] ) {
				$this->autoupdate_on();
			} else {
				$this->autoupdate_off();
			}
		}

		if ( isset( $args['active'] ) && is_bool( $args['active'] ) ) {
			if ( $args['active'] ) {
				// We don't have to check for activate_plugins permissions since we assume that the user has those
				// Since we set them via $needed_capabilities.
				return $this->activate();
			} else {
				if ( $this->current_user_can( 'deactivate_plugins' ) ) {
					return $this->deactivate();
				} else {
					return new WP_Error( 'unauthorized_error', __( 'Plugin deactivation is not allowed', 'jetpack' ), '403' );
				}
			}
		}

		if ( isset( $args['autoupdate_translations'] ) && is_bool( $args['autoupdate_translations'] ) ) {
			if ( $args['autoupdate_translations'] ) {
				$this->autoupdate_translations_on();
			} else {
				$this->autoupdate_translations_off();
			}
		}

		return true;
	}

	protected function autoupdate_on() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$autoupdate_plugins = array_unique( array_merge( $autoupdate_plugins, $this->plugins ) );
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
	}

	protected function autoupdate_off() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$autoupdate_plugins = array_diff( $autoupdate_plugins, $this->plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
	}

	protected function autoupdate_translations_on() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() );
		$autoupdate_plugins = array_unique( array_merge( $autoupdate_plugins, $this->plugins ) );
		Jetpack_Options::update_option( 'autoupdate_plugins_translations', $autoupdate_plugins );
	}

	protected function autoupdate_translations_off() {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() );
		$autoupdate_plugins = array_diff( $autoupdate_plugins, $this->plugins );
		Jetpack_Options::update_option( 'autoupdate_plugins_translations', $autoupdate_plugins );
	}

	protected function activate() {
		$permission_error = false;
		foreach ( $this->plugins as $plugin ) {

			if ( ! $this->current_user_can( 'activate_plugin', $plugin ) ) {
				$this->log[$plugin]['error'] = __( 'Sorry, you are not allowed to activate this plugin.' );
				$has_errors                  = true;
				$permission_error            = true;
				continue;
			}

			if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $plugin ) ) || is_plugin_active_for_network( $plugin ) ) {
				$this->log[$plugin]['error'] = __( 'The Plugin is already active.', 'jetpack' );
				$has_errors                  = true;
				continue;
			}

			if ( ! $this->network_wide && is_network_only_plugin( $plugin ) && is_multisite() ) {
				$this->log[$plugin]['error'] = __( 'Plugin can only be Network Activated', 'jetpack' );
				$has_errors                  = true;
				continue;
			}

			$result = activate_plugin( $plugin, '', $this->network_wide );

			if ( is_wp_error( $result ) ) {
				$this->log[$plugin]['error'] = $result->get_error_messages();
				$has_errors                  = true;
				continue;
			}

			$success = Jetpack::is_plugin_active( $plugin );
			if ( $success && $this->network_wide ) {
				$success &= is_plugin_active_for_network( $plugin );
			}

			if ( ! $success ) {
				$this->log[$plugin]['error'] = $result->get_error_messages;
				$has_errors                  = true;
				continue;
			}
			$this->log[$plugin][] = __( 'Plugin activated.', 'jetpack' );
		}

		if ( ! $this->bulk && isset( $has_errors ) ) {
			$plugin = $this->plugins[0];
			if ( $permission_error ) {
				return new WP_Error( 'unauthorized_error', $this->log[$plugin]['error'], 403 );
			}

			return new WP_Error( 'activation_error', $this->log[$plugin]['error'] );
		}
	}

	protected function current_user_can( $capability, $plugin = null ) {
		global $wp_version;
		if ( version_compare( $wp_version, '4.9-beta2' ) >= 0 ) {
			if ( $plugin ) {
				return current_user_can( $capability, $plugin );
			}

			return current_user_can( $capability );
		}

		// Assume that the user has the activate plugins capability.
		return current_user_can( 'activate_plugins' );

	}

	protected function deactivate() {
		$permission_error = false;
		foreach ( $this->plugins as $plugin ) {
			if ( ! $this->current_user_can( 'deactivate_plugin', $plugin ) ) {
				$error = $this->log[$plugin]['error'] = __( 'Sorry, you are not allowed to deactivate this plugin.', 'jetpack' );
				$permission_error                     = true;
				continue;
			}

			if ( ! Jetpack::is_plugin_active( $plugin ) ) {
				$error = $this->log[$plugin]['error'] = __( 'The Plugin is already deactivated.', 'jetpack' );
				continue;
			}

			deactivate_plugins( $plugin, false, $this->network_wide );

			$success = ! Jetpack::is_plugin_active( $plugin );
			if ( $success && $this->network_wide ) {
				$success &= ! is_plugin_active_for_network( $plugin );
			}

			if ( ! $success ) {
				$error = $this->log[$plugin]['error'] = __( 'There was an error deactivating your plugin', 'jetpack' );
				continue;
			}
			$this->log[$plugin][] = __( 'Plugin deactivated.', 'jetpack' );
		}
		if ( ! $this->bulk && isset( $error ) ) {
			if ( $permission_error ) {
				return new WP_Error( 'unauthorized_error', $error, 403 );
			}

			return new WP_Error( 'deactivation_error', $error );
		}
	}

	protected function update() {
		$query_args = $this->query_args();
		if ( isset( $query_args['autoupdate'] ) && $query_args['autoupdate'] ) {
			Jetpack_Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );
		}
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins(); // Check for Plugin updates
		ob_end_clean();

		$update_plugins = get_site_transient( 'update_plugins' );

		if ( isset( $update_plugins->response ) ) {
			$plugin_updates_needed = array_keys( $update_plugins->response );
		} else {
			$plugin_updates_needed = array();
		}

		$update_attempted = false;

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );

		$result = false;

		foreach ( $this->plugins as $plugin ) {

			if ( ! in_array( $plugin, $plugin_updates_needed ) ) {
				$this->log[$plugin][] = __( 'No update needed', 'jetpack' );
				continue;
			}

			/**
			 * Pre-upgrade action
			 *
			 * @since 3.9.3
			 *
			 * @param array $plugin            Plugin data
			 * @param array $plugin            Array of plugin objects
			 * @param bool  $updated_attempted false for the first update, true subsequently
			 */
			do_action( 'jetpack_pre_plugin_upgrade', $plugin, $this->plugins, $update_attempted );

			$update_attempted = true;

			// Object created inside the for loop to clean the messages for each plugin
			$skin = new WP_Ajax_Upgrader_Skin();
			// The Automatic_Upgrader_Skin skin shouldn't output anything.
			$upgrader = new Plugin_Upgrader( $skin );
			$upgrader->init();
			// This avoids the plugin to be deactivated.
			// Using bulk upgrade puts the site into maintenance mode during the upgrades
			$result             = $upgrader->bulk_upgrade( array( $plugin ) );
			$errors             = $upgrader->skin->get_errors();
			$this->log[$plugin] = $upgrader->skin->get_upgrade_messages();

			if ( is_wp_error( $errors ) && $errors->get_error_code() ) {
				return $errors;
			}
		}

		if ( ! $this->bulk && ! $result && $update_attempted ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your plugin', 'jetpack' ), 400 );
		}

		return $this->default_action();
	}

	function update_translations() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins(); // Check for Plugin updates
		ob_end_clean();

		$available_updates = get_site_transient( 'update_plugins' );
		if ( ! isset( $available_updates->translations ) || empty( $available_updates->translations ) ) {
			return new WP_Error( 'nothing_to_translate' );
		}

		$update_attempted = false;
		$result           = false;
		foreach ( $this->plugins as $plugin ) {
			$this->slug  = Jetpack_Autoupdate::get_plugin_slug( $plugin );
			$translation = array_filter( $available_updates->translations, array( $this, 'get_translation' ) );

			if ( empty( $translation ) ) {
				$this->log[$plugin][] = __( 'No update needed', 'jetpack' );
				continue;
			}

			/**
			 * Pre-upgrade action
			 *
			 * @since 4.4
			 *
			 * @param array $plugin           Plugin data
			 * @param array $plugin           Array of plugin objects
			 * @param bool  $update_attempted false for the first update, true subsequently
			 */
			do_action( 'jetpack_pre_plugin_upgrade_translations', $plugin, $this->plugins, $update_attempted );

			$update_attempted = true;

			$skin     = new Automatic_Upgrader_Skin();
			$upgrader = new Language_Pack_Upgrader( $skin );
			$upgrader->init();

			$result = $upgrader->upgrade( (object) $translation[0] );

			$this->log[$plugin] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! $result ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your plugin', 'jetpack' ), 400 );
		}

		return true;
	}

	protected function get_translation( $translation ) {
		return ( $translation['slug'] === $this->slug );
	}
}
