<?php
/**
 * Main class for the Masterbar package.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status\Host;

/**
 * Main class for the Masterbar package.
 */
class Main {

	const PACKAGE_VERSION = '0.2.0-alpha';

	/**
	 * Initializer.
	 * Used to configure the Masterbar package.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'jetpack_masterbar_init' ) ) {
			return;
		}

		$host                    = new Host();
		$should_use_nav_redesign = function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled();

		if ( ! $should_use_nav_redesign && ! $host->is_wpcom_simple() ) {
			new Masterbar();
		}

		new Admin_Color_Schemes();

		if ( $host->is_wpcom_platform() ) {
			new Inline_Help();
			require_once __DIR__ . '/wp-posts-list/bootstrap.php';
			require_once __DIR__ . '/nudges/bootstrap.php';
		}

		if ( $host->is_woa_site() ) {
			require_once __DIR__ . '/profile-edit/bootstrap.php';
		}

		/**
		 * Whether to load the admin menu functionality.
		 *
		 * @use add_filter( 'jetpack_load_admin_menu_class', '__return_true' );
		 *
		 * @param bool $load_admin_menu_class Load Jetpack's custom admin menu functionality. Default to false.
		 */
		if ( ! $should_use_nav_redesign && apply_filters( 'jetpack_load_admin_menu_class', false ) ) {
			require_once __DIR__ . '/admin-menu/load.php';
		}

		/**
		 * Fires after the Masterbar package is initialized.
		 * Used mainly to ensure the package is initialized once.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_masterbar_init' );
	}
}
