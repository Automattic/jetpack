<?php
/**
 * The file that contains then Configurable trait.
 *
 * @package Automattic/jetpack-config
 */

namespace Automattic\Config;

/*
 * The Configurable trait adding methods to allow packages to be automatically configured.
 */
trait Configurable {

	/**
	 * Configure a package.
	 *
	 * @param array $args {
	 *     An array of arguments adding a name and file path for the consumer plugin to allow the package to install needed hooks.
	 *
	 *     @type string $slug
	 *     @type string $name
	 *     @type string $url
	 *     @type string $plugin_file
	 * }
	 */
	public function setup( array $args ) {
		$this->plugin_file = $args['plugin_file'];

		$this->initialize_deactivate_hook();
	}

	/**
	 * Initialize the plugin deactivation hook.
	 */
	public function initialize_deactivate_hook() {
		require_once ABSPATH . '/wp-admin/includes/plugin.php';

		if ( is_plugin_active_for_network( $this->plugin_file ) ) {
			register_deactivation_hook( $this->plugin_file, array( $this, 'on_network_deactivate' ) );
		} else {
			register_deactivation_hook( $this->plugin_file, array( $this, 'on_deactivate' ) );
		}
	}

	/**
	 * A configurable package class must declare a network deactivation routine.
	 */
	abstract public function on_network_deactivate();

	/**
	 * A configurable package class must declare a deactivation routine.
	 */
	abstract public function on_deactivate();
}
