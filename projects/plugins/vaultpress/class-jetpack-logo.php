<?php
/**
 * Jetpack Logo for use on dashboard pages.
 *
 * @since 2.1.0
 *
 * @package VaultPress
 */

use Automattic\Jetpack\Assets\Logo;

/**
 * Jetpack Logo Class.
 */
class Jetpack_Logo {
	/**
	 * Constructor.
	 */
	public function __construct() {
	}

	/**
	 * Display a Jetpack Logo.
	 */
	public function output() {
		$logo = new Logo();
		return $logo->render();
	}
}
