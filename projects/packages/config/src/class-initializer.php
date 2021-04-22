<?php
/**
 * The initializer class file.
 *
 * @package automattic/jetpack-config
 */

namespace Automattic\Config;

/**
 * The Configuration package Initializer class that takes care of the plugin activation and deactivation routines.
 */
class Initializer {

	/**
	 * A package configuration object.
	 *
	 * @var Configurable
	 */
	private $package_config;

	/**
	 * Creates a new Initializer type object.
	 *
	 * @param Configurable $package_config a package configuration object that implements one or more interfaces (e.g. OnPluginDeactivation).
	 */
	private function __construct( Configurable $package_config ) {
		$this->package_config = $package_config;
	}

	/**
	 * Initializes a new hook for the package to be run on a specified event.
	 *
	 * @param Configurable $package_config an object implementing one of the interfaces: OnPluginsLoaded, OnPluginDeactivation.
	 */
	public static function init( Configurable $package_config ) {
		$init = new static( $package_config );

		if ( $package_config instanceof OnPluginsLoaded ) {
			$init->on_plugins_loaded();
		}

		if ( $package_config instanceof OnPluginDeactivation ) {
			$init->on_plugin_deactivation();
		}
	}

	/**
	 * Registers a deactivation hook for the specified plugin configuration object.
	 */
	public function on_plugin_deactivation() {
		require_once ABSPATH . '/wp-admin/includes/plugin.php';

		if ( is_plugin_active_for_network( $this->package_config->get_plugin_file() ) ) {
			register_deactivation_hook( $this->package_config->get_plugin_file(), array( $this->package_config, 'on_network_deactivate' ) );
		} else {
			register_deactivation_hook( $this->package_config->get_plugin_file(), array( $this->package_config, 'on_deactivate' ) );
		}
	}

}
