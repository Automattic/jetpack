<?php

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $network_wide = false;
	protected $plugin;
	protected $log;

	protected $action;
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
		'log'         => '(array:safehtml) An array of update log strings.',
	);

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities, true ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_network_wide() ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_plugin( $plugin ) ) ) {
			return $error;
		}

		if ( ! empty( $this->action ) ) {
			if ( is_wp_error( $error = call_user_func( array( $this, $this->action ) ) ) ) {
				return $error;
			}
		}

		return self::get_plugin( $this->plugin );
	}

	protected function format_plugin( $plugin_file, $plugin_data ) {
		$plugin = array();
		$plugin['id']     = preg_replace("/(.+)\.php$/", "$1", urlencode( $plugin_file ) );
		$plugin['active'] = Jetpack::is_plugin_active( $plugin_file );

		$current          = get_site_transient( 'update_plugins' );
		$plugin['update'] = ( isset( $current->response[ $plugin_file ] ) ) ? $current->response[ $plugin_file ] : null;

		$plugin['name']        = $plugin_data['Name'];
		$plugin['plugin_url']  = $plugin_data['PluginURI'];
		$plugin['version']     = $plugin_data['Version'];
		$plugin['description'] = $plugin_data['Description'];
		$plugin['author']      = $plugin_data['Author'];
		$plugin['author_url']  = $plugin_data['AuthorURI'];
		$plugin['network']     = $plugin_data['Network'];

		if ( ! empty ( $this->log ) ) {
			$plugin['log'] = $this->log;
		}

		return $plugin;
	}

	protected function get_plugin() {
		$installed_plugins = get_plugins();
		if ( ! isset( $installed_plugins[ $this->plugin ] ) )
			return new WP_Error( 'unknown_plugin', __( 'Plugin not found.', 'jetpack' ), 404 );
		return $this->format_plugin( $this->plugin, $installed_plugins[ $this->plugin ] );
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

		$this->plugin = urldecode( $plugin ) . '.php';

		if ( is_wp_error( $error = validate_plugin( $this->plugin ) ) ) {
			return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
		}

		return true;
	}

}
