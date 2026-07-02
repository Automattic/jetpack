<?php
/**
 * Bootstrap for the Jetpack menu-badges package.
 *
 * @package automattic/jetpack-menu-badges
 */

namespace Automattic\Jetpack\Menu_Badges;

/**
 * Wires the notification-count registry into the admin menu and enqueues the client.
 */
class Menu_Badges {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Initialize the package. Idempotent.
	 *
	 * @return void
	 */
	public static function init() {
		static $done = false;
		if ( $done ) {
			return;
		}
		$done = true;
		// Renderer + client wiring added in later tasks.
	}
}
