<?php
/**
 * The onpluginsloaded configurator interface.
 *
 * @package automattic/jetpack-config
 */

namespace Automattic\Config;

interface OnPluginsLoaded extends Configurable {
	/**
	 * A configurable package class must declare a network deactivation routine.
	 */
	public function on_plugins_loaded();
}
