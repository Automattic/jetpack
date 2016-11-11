<?php

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $plugins = array();

	protected $network_wide = false;

	protected $bulk = true;
	protected $log;

	static $_response_format = array(
		'id'              => '(safehtml)  The plugin\'s ID',
		'slug'            => '(safehtml)  The plugin\'s .org slug',
		'active'          => '(boolean) The plugin status.',
		'update'          => '(object)  The plugin update info.',
		'name'            => '(safehtml)  The name of the plugin.',
		'plugin_url'      => '(url)  Link to the plugin\'s web site.',
		'version'         => '(safehtml)  The plugin version number.',
		'description'     => '(safehtml)  Description of what the plugin does and/or notes from the author',
		'author'          => '(safehtml)  The author\'s name',
		'author_url'      => '(url)  The authors web site address',
		'network'         => '(boolean) Whether the plugin can only be activated network wide.',
		'autoupdate'      => '(boolean) Whether the plugin is automatically updated',
		'autoupdate_translation' => '(boolean) Whether the plugin is automatically updating translations',
		'next_autoupdate' => '(string) Y-m-d H:i:s for next scheduled update event',
		'log'             => '(array:safehtml) An array of update log strings.',
		'uninstallable'   => '(boolean) Whether the plugin is unistallable.',
	);

	protected function result() {

		$plugins = $this->get_plugins();

		if ( ! $this->bulk && ! empty( $plugins ) ) {
			return array_pop( $plugins );
		}

		return array( 'plugins' => $plugins );

	}

	protected function validate_input( $plugin ) {

		if ( is_wp_error( $error = parent::validate_input( $plugin ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_network_wide() ) ) {
			return $error;
		}

		$args = $this->input();
		// find out what plugin, or plugins we are dealing with
		// validate the requested plugins
		if ( ! isset( $plugin ) || empty( $plugin ) ) {
			if ( ! $args['plugins'] || empty( $args['plugins'] ) ) {
				return new WP_Error( 'missing_plugin', __( 'You are required to specify a plugin.', 'jetpack' ), 400 );
			}
			if ( is_array( $args['plugins'] ) ) {
				$this->plugins = $args['plugins'];
			} else {
				$this->plugins[] = $args['plugins'];
			}
		} else {
			$this->bulk = false;
			$this->plugins[] = urldecode( $plugin );
		}
		
		if ( is_wp_error( $error = $this->validate_plugins() ) ) {
			return $error;
		};

		return true;
	}

	/**
	 * Walks through submitted plugins to make sure they are valid
	 * @return bool|WP_Error
	 */
	protected function validate_plugins() {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ));
		}
		foreach( $this->plugins as $index => $plugin ) {
			if ( ! preg_match( "/\.php$/", $plugin ) ) {
				$plugin =  $plugin . '.php';
				$this->plugins[ $index ] = $plugin;
			}
			$valid = $this->validate_plugin( urldecode( $plugin ) ) ;
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
		}

		return true;
	}

	protected function format_plugin( $plugin_file, $plugin_data ) {
		$plugin = array();
		$plugin['id']              = preg_replace("/(.+)\.php$/", "$1", $plugin_file );
		$plugin['slug']            = Jetpack_Autoupdate::get_plugin_slug( $plugin_file );
		$plugin['active']          = Jetpack::is_plugin_active( $plugin_file );
		$plugin['name']            = $plugin_data['Name'];
		$plugin['plugin_url']      = $plugin_data['PluginURI'];
		$plugin['version']         = $plugin_data['Version'];
		$plugin['description']     = $plugin_data['Description'];
		$plugin['author']          = $plugin_data['Author'];
		$plugin['author_url']      = $plugin_data['AuthorURI'];
		$plugin['network']         = $plugin_data['Network'];
		$plugin['update']          = $this->get_plugin_updates( $plugin_file );
		$plugin['next_autoupdate'] = date( 'Y-m-d H:i:s', wp_next_scheduled( 'wp_maybe_auto_update' ) );

		$autoupdate = in_array( $plugin_file, Jetpack_Options::get_option( 'autoupdate_plugins', array() ) );
		$plugin['autoupdate']      = $autoupdate;
		
		$autoupdate_translation = in_array( $plugin_file, Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() ) );
		$plugin['autoupdate_translation'] = $autoupdate || $autoupdate_translation;

		$plugin['uninstallable']   = is_uninstallable_plugin( $plugin_file );

		if ( ! empty ( $this->log[ $plugin_file ] ) ) {
			$plugin['log'] = $this->log[ $plugin_file ];
		}
		return $plugin;
	}

	protected function get_plugins() {
		$plugins = array();
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$installed_plugins = apply_filters( 'all_plugins', get_plugins() );
		foreach( $this->plugins as $plugin ) {
			if ( ! isset( $installed_plugins[ $plugin ] ) )
				continue;
			$plugins[] = $this->format_plugin( $plugin, $installed_plugins[ $plugin ] );
		}
		$args = $this->query_args();

		if ( isset( $args['offset'] ) ) {
			$plugins = array_slice( $plugins, (int) $args['offset'] );
		}
		if ( isset( $args['limit'] ) ) {
			$plugins = array_slice( $plugins, 0, (int) $args['limit'] );
		}

		return $plugins;
	}

	protected function validate_network_wide() {
		$args = $this->input();

		if ( isset( $args['network_wide'] ) && $args['network_wide'] ) {
			$this->network_wide = true;
		}

		if ( $this->network_wide && ! current_user_can( 'manage_network_plugins' ) ) {
			return new WP_Error( 'unauthorized', __( 'This user is not authorized to manage plugins network wide.', 'jetpack' ), 403 );
		}

		return true;
	}


	protected function validate_plugin( $plugin ) {
		if ( ! isset( $plugin) || empty( $plugin ) ) {
			return new WP_Error( 'missing_plugin', __( 'You are required to specify a plugin to activate.', 'jetpack' ), 400 );
		}

		if ( is_wp_error( $error = validate_plugin( $plugin ) ) ) {
			return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
		}

		return true;
	}

	protected function get_plugin_updates( $plugin_file ) {
		$plugin_updates = get_plugin_updates();
		if ( isset( $plugin_updates[ $plugin_file ] ) ){
			return $plugin_updates[ $plugin_file ]->update;
		}
		return null;
	}
}
