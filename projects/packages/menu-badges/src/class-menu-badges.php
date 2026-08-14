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

		// Render badges late, after products have registered their menus and counts.
		add_action( 'admin_menu', array( Menu_Renderer::class, 'render' ), 100000 );

		// Client live-update API.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_client' ) );
	}

	/**
	 * Enqueue the vanilla client that owns live badge updates.
	 *
	 * @return void
	 */
	public static function enqueue_client() {
		\Automattic\Jetpack\Assets::register_script(
			'jetpack-menu-badges',
			'../src/js/menu-badges.js',
			__FILE__,
			array(
				'enqueue'   => true,
				'in_footer' => true,
			)
		);
	}
}
