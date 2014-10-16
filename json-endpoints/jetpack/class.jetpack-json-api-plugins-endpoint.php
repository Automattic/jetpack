<?php

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $network_wide = false;
	protected $log;
	protected $plugins;
	protected $bulk = true;

	protected $action;
	protected $active;
	protected $autoupdate;
	protected $needed_capabilities;

	static $_response_format	= array(
		'id'          => '(string)  The plugin\'s ID',
		'active'      => '(boolean) The plugin status.',
		'update'      => '(object)  The plugin update info.',
		'name'        => '(string)  The name of the plugin.',
		'plugin_url'  => '(url)  Link to the plugin\'s web site.',
		'version'     => '(string)  The plugin version number.',
		'description' => '(safehtml)  Description of what the plugin does and/or notes from the author',
		'author'      => '(string)  The author\'s name',
		'author_url'  => '(url)  The authors web site address',
		'network'     => '(boolean) Whether the plugin can only be activated network wide.',
		'autoupdate'  => '(boolean) Whether the plugin is automatically updated',
		'log'         => '(array:safehtml) An array of update log strings.',
	);

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities, true ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_network_wide() ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_input( $plugin ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_plugins() ) ) {
			return $error;
		}

		if ( ! empty( $this->action ) ) {
			$result = call_user_func( array( $this, $this->action ) );
			if( is_wp_error($result) )
				return $result;
		}

		if ( ! is_null( $this->autoupdate ) ) {
			$autoupdate_action = ( $this->autoupdate ) ? 'autoupdate_on' : 'autoupdate_off';
			call_user_func( array( $this, $autoupdate_action ) );
		}

		if ( ! is_null( $this->active ) ) {
			$active_action = ( $this->active ) ? 'activate' : 'deactivate';
			$result = call_user_func( array( $this, $active_action ) );
			if( is_wp_error( $result ) )
				return $result;
		}

		$plugins = self::get_plugins();

		if ( ! $this->bulk && ! empty( $plugins ) ) {
			return array_pop( $plugins );
		}

		return array( 'plugins' => $plugins );

	}

	protected function validate_input( $plugin ) {
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
				$this->plugins[] = $plugin;
			}
		} else {
			$this->bulk = false;
			$this->plugins[] = urldecode( $plugin );
		}

		// find out if we need to activate, or autoupdate any plugins
		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) )
			$this->autoupdate = $args['autoupdate'];
		if ( isset( $args['active'] ) && is_bool( $args['active'] ) )
			$this->active = $args['active'];

		return true;
	}

	protected function format_plugin( $plugin_file, $plugin_data ) {
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$plugin = array();
		$plugin['id']     = preg_replace("/(.+)\.php$/", "$1", urlencode( $plugin_file ) );
		$plugin['active'] = Jetpack::is_plugin_active( $plugin_file );

		$update_plugins   = get_site_transient( 'update_plugins' );
		$plugin['update'] = ( isset( $update_plugins->response[ $plugin_file ] ) ) ? $update_plugins->response[ $plugin_file ] : null;

		$plugin['name']        = $plugin_data['Name'];
		$plugin['plugin_url']  = $plugin_data['PluginURI'];
		$plugin['version']     = $plugin_data['Version'];
		$plugin['description'] = $plugin_data['Description'];
		$plugin['author']      = $plugin_data['Author'];
		$plugin['author_url']  = $plugin_data['AuthorURI'];
		$plugin['network']     = $plugin_data['Network'];
		$plugin['autoupdate']  = in_array( $plugin_file, $autoupdate_plugins );
		if ( ! empty ( $this->log[ $plugin_file ] ) ) {
			$plugin['log'] = $this->log[ $plugin_file ];
		}
		return $plugin;
	}

	protected function get_plugins() {
		$installed_plugins = get_plugins();
		foreach( $this->plugins as $plugin ) {
			if ( ! isset( $installed_plugins[ $plugin ] ) )
				continue;
			$response[] = $this->format_plugin( $plugin, $installed_plugins[ $plugin ] );
		}
		return $response;
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

	protected function validate_plugins() {
		if ( empty( $this->plugins ) || ! is_array( $this->plugins ) ) {
			return new WP_Error( 'missing_plugins', __( 'No plugins found.', 'jetpack' ));
		}
		foreach( $this->plugins as $index => $plugin ) {
			if ( is_wp_error( $error = $this->validate_plugin( $plugin ) ) ) {
				return $error;
			}
			$this->plugins[ $index ] = $plugin . '.php';
		}
		return true;
	}

	protected function validate_plugin( $plugin ) {
		if ( ! isset( $plugin) || empty( $plugin ) ) {
			return new WP_Error( 'missing_plugin', __( 'You are required to specify a plugin to activate.', 'jetpack' ), 400 );
		}

		if ( is_wp_error( $error = validate_plugin( urldecode( $plugin ) . '.php' ) ) ) {
			return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
		}

		return true;
	}

}
