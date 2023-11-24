<?php
/**
 * Subclass that exposes some protected properties.
 *
 * @package automattic/jetpack-backup
 */

use Automattic\Jetpack\Backup\Helper_Script_Manager;

/**
 * Subclass that exposes some protected properties.
 */
class Public_Helper_Script_Manager extends Helper_Script_Manager {

	/**
	 * Return maximum size of the helper script, in bytes.
	 *
	 * @return int Maximum size of the helper script, in bytes.
	 */
	public function max_filesize() {
		return $this->max_filesize;
	}

	/**
	 * Return a ssociative array of possible places to install a jetpack-temp directory, along with the URL to access
	 * each.
	 *
	 * @return array Keys specify the full path of install locations, and values point to the equivalent URL.
	 */
	public function install_locations() {
		return $this->install_locations;
	}
}
