<?php
/**
 * The ondeactivation interface file.
 *
 * @package automattic/jetpack-config
 */

namespace Automattic\Config;

interface OnPluginDeactivation extends Configurable {

	/**
	 * The function must return path to the plugin file.
	 *
	 * @return string
	 */
	public function get_plugin_file();

	/**
	 * A configurable package class must declare a network deactivation routine.
	 */
	public function on_network_deactivate();

	/**
	 * A configurable package class must declare a deactivation routine.
	 */
	public function on_deactivate();
}
