<?php
/**
 * Each package that requires initialization will have a configuration file like this.
 * The Configuration should implement at least one configuration interface.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Config\OnPluginDeactivation;
use Automattic\Config\OnPluginsLoaded;

/**
 * The configurator class for the Connection package.
 */
class Configurator implements OnPluginDeactivation, OnPluginsLoaded {

	/**
	 * The connection manager object.
	 *
	 * @var Automattic\Jetpack\Connection
	 */
	private $connection;

	/**
	 * The plugin file slug.
	 *
	 * @var String
	 */
	private $plugin_file;

	/**
	 * Returns a new Configurator object for the Connection package.
	 *
	 * @param Manager $connection  the connection manager instance.
	 * @param string  $plugin_file Path to the plugin file that initiates the connection.
	 */
	public function __construct( Manager $connection, $plugin_file ) {
		$this->connection  = $connection;
		$this->plugin_file = $plugin_file;
	}

	/**
	 * Implements actions needed to be run on `plugins_loaded` action of the WordPress lifecycle.
	 */
	public function on_plugins_loaded() {
		Manager::configure();
	}

	/**
	 * Returns the plugin file name to be used in setting up plugin lifecycle hooks.
	 */
	public function get_plugin_file() {
		return $this->plugin_file;
	}

	/**
	 * Deactivate the connection on plugin disconnect.
	 */
	public function on_deactivate() {
		$this->connection->disconnect_site_wpcom();
		$this->connection->delete_all_connection_tokens();
	}

	/**
	 * Deactivate the connection on plugin disconnect for network-activated plugins.
	 */
	public function on_network_deactivate() {
		if ( ! is_network_admin() ) {
			return;
		}

		foreach ( get_sites() as $s ) {
			switch_to_blog( $s->blog_id );

			$active_plugins = get_option( 'active_plugins' );

			/*
			 * If this plugin was activated in the subsite individually
			 * we do not want to call disconnect. Plugins activated
			 * individually (before network activation) stay activated
			 * when the network deactivation occurs
			 */
			if ( ! in_array( $this->get_plugin_file(), $active_plugins, true ) ) {
				$this->deactivate_disconnect();
			}

			restore_current_blog();
		}
	}

}
